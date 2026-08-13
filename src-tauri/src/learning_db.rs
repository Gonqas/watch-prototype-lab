use std::{
    fs,
    path::{Path, PathBuf},
    time::Instant,
};

use chrono::Utc;
use rusqlite::{backup::Backup, params, Connection, OpenFlags, Transaction};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use uuid::Uuid;

pub const LEARNING_SCHEMA_VERSION: i64 = 2;

pub struct LearningDatabase {
    pub connection: std::sync::Mutex<Connection>,
    pub path: PathBuf,
    pub backup_dir: PathBuf,
    pub package_dir: PathBuf,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeLearningBackup {
    pub schema_version: i64,
    pub id: String,
    pub kind: String,
    pub created_at: String,
    pub storage_reference: String,
    pub manifest_hash: String,
    pub database_hash: String,
    pub verified: bool,
    pub protected: bool,
    pub bytes: u64,
}

const MIGRATION_1: &str = r#"
CREATE TABLE learning_profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  locale TEXT NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  archived INTEGER NOT NULL CHECK(archived IN (0,1)),
  deleted_at TEXT,
  record_version INTEGER NOT NULL CHECK(record_version > 0),
  payload TEXT NOT NULL
);
CREATE INDEX learning_profiles_modified_idx ON learning_profiles(modified_at DESC);

CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES learning_profiles(id) ON DELETE RESTRICT,
  package_id TEXT NOT NULL,
  package_version TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  rubric_id TEXT NOT NULL,
  state TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_checkpoint_at TEXT,
  completed_at TEXT,
  initial_project_fingerprint TEXT NOT NULL,
  current_project_fingerprint TEXT NOT NULL,
  attempt INTEGER NOT NULL CHECK(attempt > 0),
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX learning_sessions_profile_updated_idx ON learning_sessions(profile_id, updated_at DESC);
CREATE INDEX learning_sessions_package_idx ON learning_sessions(package_id, package_version);
CREATE INDEX learning_sessions_state_idx ON learning_sessions(state);

CREATE TABLE learning_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL CHECK(sequence >= 0),
  timestamp TEXT NOT NULL,
  runtime_event_version INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  origin TEXT NOT NULL,
  actor TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  persisted_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  UNIQUE(session_id, sequence),
  UNIQUE(session_id, idempotency_key)
);
CREATE INDEX learning_events_session_sequence_idx ON learning_events(session_id, sequence);
CREATE INDEX learning_events_type_idx ON learning_events(event_type);

CREATE TABLE learning_evidence (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES learning_profiles(id) ON DELETE RESTRICT,
  session_id TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE RESTRICT,
  competency_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  status TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX learning_evidence_profile_competency_idx ON learning_evidence(profile_id, competency_id, observed_at);
CREATE INDEX learning_evidence_session_idx ON learning_evidence(session_id);
CREATE INDEX learning_evidence_hash_idx ON learning_evidence(evidence_hash);

CREATE TABLE learning_assessments (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES learning_profiles(id) ON DELETE RESTRICT,
  competency_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  projection TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX learning_assessments_profile_competency_idx ON learning_assessments(profile_id, competency_id, evaluated_at);
CREATE INDEX learning_assessments_input_idx ON learning_assessments(input_hash);

CREATE TABLE learning_mastery (
  profile_id TEXT NOT NULL REFERENCES learning_profiles(id) ON DELETE RESTRICT,
  competency_id TEXT NOT NULL,
  mastery_state TEXT NOT NULL,
  strength REAL NOT NULL CHECK(strength >= 0 AND strength <= 1),
  projector_version TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY(profile_id, competency_id)
);
CREATE INDEX learning_mastery_state_idx ON learning_mastery(profile_id, mastery_state);

CREATE TABLE learning_packages (
  package_id TEXT NOT NULL,
  version TEXT NOT NULL,
  origin TEXT NOT NULL,
  package_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  installed_at TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  storage_reference TEXT NOT NULL,
  removable INTEGER NOT NULL CHECK(removable IN (0,1)),
  payload TEXT NOT NULL,
  PRIMARY KEY(package_id, version),
  UNIQUE(package_hash)
);
CREATE INDEX learning_packages_status_idx ON learning_packages(status);

CREATE TABLE learning_backups (
  id TEXT PRIMARY KEY,
  backup_kind TEXT NOT NULL,
  created_at TEXT NOT NULL,
  storage_reference TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  database_hash TEXT NOT NULL,
  verified INTEGER NOT NULL CHECK(verified IN (0,1)),
  protected INTEGER NOT NULL CHECK(protected IN (0,1)),
  bytes INTEGER NOT NULL CHECK(bytes >= 0),
  payload TEXT NOT NULL
);
CREATE INDEX learning_backups_created_idx ON learning_backups(created_at DESC);

CREATE TABLE learning_recovery_log (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX learning_recovery_session_idx ON learning_recovery_log(session_id, created_at);
"#;

const MIGRATION_2: &str = r#"
CREATE TABLE physical_specimens (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX physical_specimens_profile_idx ON physical_specimens(profile_id, updated_at DESC);

CREATE TABLE physical_components (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT NOT NULL, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX physical_components_specimen_idx ON physical_components(specimen_id, updated_at DESC);

CREATE TABLE instrument_profiles (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX instrument_profiles_profile_idx ON instrument_profiles(profile_id, updated_at DESC);

CREATE TABLE instrument_verifications (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT NOT NULL,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX instrument_verifications_owner_idx ON instrument_verifications(owner_id, updated_at DESC);

CREATE TABLE inspection_plans (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);

CREATE TABLE inspection_sessions (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT NOT NULL, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX inspection_sessions_specimen_idx ON inspection_sessions(specimen_id, updated_at DESC);

CREATE TABLE inspection_observations (
  id TEXT PRIMARY KEY, profile_id TEXT, specimen_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX inspection_observations_owner_idx ON inspection_observations(owner_id, updated_at DESC);

CREATE TABLE inspection_findings (
  id TEXT PRIMARY KEY, profile_id TEXT, specimen_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX inspection_findings_owner_idx ON inspection_findings(owner_id, updated_at DESC);

CREATE TABLE image_assets (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX image_assets_specimen_idx ON image_assets(specimen_id, updated_at DESC);

CREATE TABLE image_derivatives (
  id TEXT PRIMARY KEY, profile_id TEXT, specimen_id TEXT, owner_id TEXT NOT NULL,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);

CREATE TABLE image_calibrations (
  id TEXT PRIMARY KEY, profile_id TEXT, specimen_id TEXT, owner_id TEXT NOT NULL,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);

CREATE TABLE image_annotations (
  id TEXT PRIMARY KEY, profile_id TEXT, specimen_id TEXT, owner_id TEXT NOT NULL,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX image_annotations_owner_idx ON image_annotations(owner_id, updated_at DESC);

CREATE TABLE measurement_definitions (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);

CREATE TABLE measurement_series (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT NOT NULL, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX measurement_series_specimen_idx ON measurement_series(specimen_id, updated_at DESC);

CREATE TABLE measurement_readings (
  id TEXT PRIMARY KEY, profile_id TEXT, specimen_id TEXT, owner_id TEXT NOT NULL,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX measurement_readings_owner_idx ON measurement_readings(owner_id, updated_at ASC);

CREATE TABLE nominal_measured_comparisons (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT NOT NULL, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);

CREATE TABLE geometry_correction_proposals (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT NOT NULL, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX geometry_proposals_state_idx ON geometry_correction_proposals(state, updated_at DESC);

CREATE TABLE object_store_objects (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT,
  state TEXT NOT NULL, sha256 TEXT NOT NULL UNIQUE, bytes INTEGER NOT NULL CHECK(bytes >= 0),
  media_type TEXT NOT NULL, storage_path TEXT NOT NULL, created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL, record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX object_store_objects_state_idx ON object_store_objects(state, updated_at DESC);

CREATE TABLE object_store_references (
  id TEXT PRIMARY KEY, profile_id TEXT, specimen_id TEXT, owner_id TEXT NOT NULL,
  object_id TEXT NOT NULL REFERENCES object_store_objects(id) ON DELETE RESTRICT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX object_store_references_object_idx ON object_store_references(object_id);
CREATE INDEX object_store_references_owner_idx ON object_store_references(owner_id);

CREATE TABLE object_store_import_jobs (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);

CREATE TABLE metrology_reports (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, specimen_id TEXT NOT NULL, owner_id TEXT,
  state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  record_version INTEGER NOT NULL CHECK(record_version > 0), payload TEXT NOT NULL
);
CREATE INDEX metrology_reports_specimen_idx ON metrology_reports(specimen_id, updated_at DESC);
"#;

pub fn initialize_learning_database(
    connection: &mut Connection,
    database_path: &Path,
    backup_dir: &Path,
) -> Result<(), String> {
    connection
        .execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA foreign_keys=ON;
             PRAGMA synchronous=FULL;
             CREATE TABLE IF NOT EXISTS learning_schema_migrations (
               version INTEGER PRIMARY KEY,
               name TEXT NOT NULL,
               checksum TEXT NOT NULL,
               applied_at TEXT NOT NULL,
               duration_ms INTEGER NOT NULL
             );",
        )
        .map_err(|error| format!("No se pudo preparar migraciones learning: {error}"))?;
    let current: i64 = connection
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM learning_schema_migrations",
            [],
            |row| row.get(0),
        )
        .map_err(|error| format!("No se pudo leer la versión learning: {error}"))?;
    if current > LEARNING_SCHEMA_VERSION {
        return Err(format!(
            "La base learning usa una versión futura {current}; esta aplicación admite {LEARNING_SCHEMA_VERSION}."
        ));
    }
    if current < 1 {
        if current > 0 || database_has_user_tables(connection)? {
            create_backup(connection, database_path, backup_dir, "pre-migration", true)?;
        }
        apply_migration(connection, 1, "initial-learning-schema", MIGRATION_1)?;
    }
    if current < 2 {
        if current >= 1 {
            create_backup(connection, database_path, backup_dir, "pre-migration", true)?;
        }
        apply_migration(connection, 2, "horology-metrology-5a", MIGRATION_2)?;
    }
    let foreign_keys: i64 = connection
        .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
        .map_err(|error| format!("No se pudo comprobar foreign_keys: {error}"))?;
    if foreign_keys != 1 {
        return Err("SQLite learning no activó foreign_keys.".to_string());
    }
    Ok(())
}

fn database_has_user_tables(connection: &Connection) -> Result<bool, String> {
    let count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master
             WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> 'learning_schema_migrations'",
            [],
            |row| row.get(0),
        )
        .map_err(|error| format!("No se pudo inspeccionar SQLite: {error}"))?;
    Ok(count > 0)
}

fn apply_migration(
    connection: &mut Connection,
    version: i64,
    name: &str,
    sql: &str,
) -> Result<(), String> {
    let started = Instant::now();
    let checksum = sha256_bytes(sql.as_bytes());
    let transaction = connection
        .transaction()
        .map_err(|error| format!("No se pudo iniciar migración {version}: {error}"))?;
    transaction
        .execute_batch(sql)
        .map_err(|error| format!("Falló migración {version}: {error}"))?;
    transaction
        .execute(
            "INSERT INTO learning_schema_migrations(version, name, checksum, applied_at, duration_ms)
             VALUES(?1, ?2, ?3, ?4, ?5)",
            params![
                version,
                name,
                checksum,
                Utc::now().to_rfc3339(),
                started.elapsed().as_millis() as i64
            ],
        )
        .map_err(|error| format!("No se pudo registrar migración {version}: {error}"))?;
    transaction
        .commit()
        .map_err(|error| format!("No se pudo confirmar migración {version}: {error}"))
}

pub fn snapshot(connection: &Connection) -> Result<Value, String> {
    let revision: i64 = connection
        .query_row("PRAGMA data_version", [], |row| row.get(0))
        .unwrap_or(0);
    Ok(json!({
        "schemaVersion": 1,
        "revision": revision,
        "profiles": read_payloads(connection, "learning_profiles")?,
        "sessions": read_payloads(connection, "learning_sessions")?,
        "events": read_payloads_ordered(connection, "learning_events", "session_id, sequence")?,
        "evidence": read_payloads(connection, "learning_evidence")?,
        "assessments": read_payloads(connection, "learning_assessments")?,
        "mastery": read_payloads(connection, "learning_mastery")?,
        "packages": read_payloads(connection, "learning_packages")?,
        "migrations": read_migrations(connection)?,
        "backups": read_payloads(connection, "learning_backups")?,
        "recoveryLog": read_payloads(connection, "learning_recovery_log")?,
    }))
}

pub fn replace_snapshot(connection: &mut Connection, value: &Value) -> Result<(), String> {
    let transaction = connection
        .transaction()
        .map_err(|error| format!("No se pudo iniciar transacción learning: {error}"))?;
    clear_learning_data(&transaction)?;
    insert_profiles(&transaction, array(value, "profiles")?)?;
    insert_sessions(&transaction, array(value, "sessions")?)?;
    insert_events(&transaction, array(value, "events")?)?;
    insert_evidence(&transaction, array(value, "evidence")?)?;
    insert_assessments(&transaction, array(value, "assessments")?)?;
    insert_mastery(&transaction, array(value, "mastery")?)?;
    insert_packages(&transaction, array(value, "packages")?)?;
    insert_backups(&transaction, array(value, "backups")?)?;
    insert_recovery(&transaction, array(value, "recoveryLog")?)?;
    transaction
        .commit()
        .map_err(|error| format!("No se pudo confirmar snapshot learning: {error}"))
}

fn clear_learning_data(transaction: &Transaction<'_>) -> Result<(), String> {
    transaction
        .execute_batch(
            "DELETE FROM learning_mastery;
             DELETE FROM learning_assessments;
             DELETE FROM learning_evidence;
             DELETE FROM learning_events;
             DELETE FROM learning_recovery_log;
             DELETE FROM learning_sessions;
             DELETE FROM learning_profiles;
             DELETE FROM learning_packages;
             DELETE FROM learning_backups;",
        )
        .map_err(|error| format!("No se pudo vaciar snapshot learning: {error}"))
}

fn insert_profiles(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_profiles(id, display_name, locale, created_at, modified_at, archived, deleted_at, record_version, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "id")?,
                text(value, "displayName")?,
                text(value, "locale")?,
                text(value, "createdAt")?,
                text(value, "modifiedAt")?,
                boolean(value, "archived")?,
                optional_text(value, "deletedAt"),
                integer(value, "recordVersion")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_sessions(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_sessions(id, profile_id, package_id, package_version, activity_id, rubric_id, state, started_at, last_checkpoint_at, completed_at, initial_project_fingerprint, current_project_fingerprint, attempt, updated_at, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "id")?,
                text(value, "profileId")?,
                text(value, "packageId")?,
                text(value, "packageVersion")?,
                text(value, "activityId")?,
                text(value, "rubricId")?,
                text(value, "state")?,
                text(value, "startedAt")?,
                optional_text(value, "lastCheckpointAt"),
                optional_text(value, "completedAt"),
                text(value, "initialProjectFingerprint")?,
                text(value, "currentProjectFingerprint")?,
                integer(value, "attempt")?,
                text(value, "updatedAt")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_events(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_events(id, session_id, sequence, timestamp, runtime_event_version, event_type, origin, actor, idempotency_key, persisted_at, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "id")?,
                text(value, "sessionId")?,
                integer(value, "sequence")?,
                text(value, "timestamp")?,
                integer(value, "runtimeEventVersion")?,
                text(value, "type")?,
                text(value, "origin")?,
                text(value, "actor")?,
                text(value, "idempotencyKey")?,
                text(value, "persistedAt")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_evidence(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_evidence(id, profile_id, session_id, competency_id, evidence_type, status, observed_at, created_at, evidence_hash, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "id")?,
                text(value, "profileId")?,
                text(value, "sessionId")?,
                text(value, "competencyId")?,
                text(value, "evidenceType")?,
                text(value, "status")?,
                text(value, "observedAt")?,
                text(value, "createdAt")?,
                text(value, "hash")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_assessments(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_assessments(id, profile_id, competency_id, rule_id, rule_version, algorithm, algorithm_version, evaluated_at, projection, input_hash, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "id")?,
                text(value, "profileId")?,
                text(value, "competencyId")?,
                text(value, "ruleId")?,
                text(value, "ruleVersion")?,
                text(value, "algorithm")?,
                text(value, "algorithmVersion")?,
                text(value, "evaluatedAt")?,
                text(value, "projection")?,
                text(value, "inputHash")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_mastery(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_mastery(profile_id, competency_id, mastery_state, strength, projector_version, calculated_at, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "profileId")?,
                text(value, "competencyId")?,
                text(value, "state")?,
                number(value, "strength")?,
                text(value, "projectorVersion")?,
                text(value, "calculatedAt")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_packages(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_packages(package_id, version, origin, package_hash, status, installed_at, verified_at, storage_reference, removable, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "packageId")?,
                text(value, "version")?,
                text(value, "origin")?,
                text(value, "packageHash")?,
                text(value, "status")?,
                text(value, "installedAt")?,
                text(value, "verifiedAt")?,
                text(value, "storageReference")?,
                boolean(value, "removable")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_backups(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_backups(id, backup_kind, created_at, storage_reference, manifest_hash, database_hash, verified, protected, bytes, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "id")?,
                text(value, "kind")?,
                text(value, "createdAt")?,
                text(value, "storageReference")?,
                text(value, "manifestHash")?,
                text(value, "databaseHash")?,
                boolean(value, "verified")?,
                boolean(value, "protected")?,
                integer(value, "bytes")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

fn insert_recovery(transaction: &Transaction<'_>, values: &[Value]) -> Result<(), String> {
    let mut statement = transaction
        .prepare(
            "INSERT INTO learning_recovery_log(id, session_id, action, outcome, created_at, payload)
             VALUES(?1,?2,?3,?4,?5,?6)",
        )
        .map_err(sql_error)?;
    for value in values {
        statement
            .execute(params![
                text(value, "id")?,
                optional_text(value, "sessionId"),
                text(value, "action")?,
                text(value, "outcome")?,
                text(value, "createdAt")?,
                serde_json::to_string(value).map_err(json_error)?,
            ])
            .map_err(sql_error)?;
    }
    Ok(())
}

pub fn create_backup(
    connection: &Connection,
    database_path: &Path,
    backup_dir: &Path,
    kind: &str,
    protected: bool,
) -> Result<NativeLearningBackup, String> {
    fs::create_dir_all(backup_dir)
        .map_err(|error| format!("No se pudo crear la carpeta de backups: {error}"))?;
    connection
        .execute_batch("PRAGMA wal_checkpoint(FULL);")
        .map_err(|error| format!("No se pudo consolidar WAL antes del backup: {error}"))?;
    let id = format!("backup.{}", Uuid::new_v4());
    let created_at = Utc::now().to_rfc3339();
    let backup_path = backup_dir.join(format!("{id}.sqlite3"));
    let mut destination = Connection::open(&backup_path)
        .map_err(|error| format!("No se pudo abrir destino de backup: {error}"))?;
    let backup = Backup::new(connection, &mut destination)
        .map_err(|error| format!("No se pudo iniciar SQLite backup: {error}"))?;
    backup
        .run_to_completion(64, std::time::Duration::from_millis(5), None)
        .map_err(|error| format!("No se pudo completar SQLite backup: {error}"))?;
    drop(backup);
    let integrity: String = destination
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|error| format!("No se pudo verificar backup: {error}"))?;
    if integrity != "ok" {
        return Err(format!("Backup SQLite corrupto: {integrity}"));
    }
    drop(destination);
    let bytes =
        fs::read(&backup_path).map_err(|error| format!("No se pudo leer backup: {error}"))?;
    let database_hash = sha256_bytes(&bytes);
    let manifest = json!({
        "format": "wplab-learning-sqlite-backup",
        "formatVersion": 1,
        "id": id,
        "kind": kind,
        "createdAt": created_at,
        "databaseHash": database_hash,
        "databaseFile": backup_path.file_name().and_then(|name| name.to_str()).unwrap_or_default(),
    });
    let manifest_bytes = serde_json::to_vec(&manifest).map_err(json_error)?;
    let manifest_hash = sha256_bytes(&manifest_bytes);
    fs::write(backup_path.with_extension("manifest.json"), &manifest_bytes)
        .map_err(|error| format!("No se pudo escribir manifest de backup: {error}"))?;
    let record = NativeLearningBackup {
        schema_version: 1,
        id: id.clone(),
        kind: kind.to_string(),
        created_at: created_at.clone(),
        storage_reference: backup_path.to_string_lossy().to_string(),
        manifest_hash: manifest_hash.clone(),
        database_hash: database_hash.clone(),
        verified: true,
        protected,
        bytes: bytes.len() as u64,
    };
    if table_exists(connection, "learning_backups")? {
        persist_backup_record(connection, &record)?;
    }
    let _ = database_path;
    Ok(record)
}

pub fn persist_backup_record(
    connection: &Connection,
    record: &NativeLearningBackup,
) -> Result<(), String> {
    let payload = json!({
        "schemaVersion": 1,
        "id": record.id,
        "kind": record.kind,
        "createdAt": record.created_at,
        "storageReference": record.storage_reference,
        "manifestHash": record.manifest_hash,
        "databaseHash": record.database_hash,
        "verified": record.verified,
        "protected": record.protected,
        "bytes": record.bytes,
    });
    connection
        .execute(
            "INSERT OR REPLACE INTO learning_backups(id, backup_kind, created_at, storage_reference, manifest_hash, database_hash, verified, protected, bytes, payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
            params![
                record.id,
                record.kind,
                record.created_at,
                record.storage_reference,
                record.manifest_hash,
                record.database_hash,
                record.verified,
                record.protected,
                record.bytes as i64,
                serde_json::to_string(&payload).map_err(json_error)?
            ],
        )
        .map_err(sql_error)?;
    Ok(())
}

pub fn restore_backup(
    target: &mut Connection,
    backup_path: &Path,
    expected_hash: &str,
) -> Result<(), String> {
    let bytes = fs::read(backup_path)
        .map_err(|error| format!("No se pudo leer backup para restaurar: {error}"))?;
    if sha256_bytes(&bytes) != expected_hash {
        return Err("El hash del backup no coincide.".to_string());
    }
    let source = Connection::open_with_flags(backup_path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|error| format!("No se pudo abrir backup: {error}"))?;
    let integrity: String = source
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|error| format!("No se pudo verificar backup: {error}"))?;
    if integrity != "ok" {
        return Err(format!("Backup corrupto: {integrity}"));
    }
    let backup = Backup::new(&source, target)
        .map_err(|error| format!("No se pudo iniciar restauración: {error}"))?;
    backup
        .run_to_completion(64, std::time::Duration::from_millis(5), None)
        .map_err(|error| format!("No se pudo restaurar backup: {error}"))?;
    Ok(())
}

pub fn backup_records(connection: &Connection) -> Result<Vec<Value>, String> {
    read_payloads_ordered(connection, "learning_backups", "created_at DESC")
}

pub fn delete_backup(connection: &Connection, id: &str) -> Result<(), String> {
    let (path, protected): (String, bool) = connection
        .query_row(
            "SELECT storage_reference, protected FROM learning_backups WHERE id=?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|error| format!("Backup inexistente: {error}"))?;
    if protected {
        return Err("El backup está protegido por una recuperación.".to_string());
    }
    connection
        .execute("DELETE FROM learning_backups WHERE id=?1", params![id])
        .map_err(sql_error)?;
    let path = PathBuf::from(path);
    if path.exists() {
        fs::remove_file(&path).map_err(|error| format!("No se pudo borrar backup: {error}"))?;
    }
    let manifest = path.with_extension("manifest.json");
    if manifest.exists() {
        fs::remove_file(manifest)
            .map_err(|error| format!("No se pudo borrar manifest: {error}"))?;
    }
    Ok(())
}

pub fn database_info(connection: &Connection, path: &Path) -> Result<Value, String> {
    let version: i64 = connection
        .query_row(
            "SELECT COALESCE(MAX(version),0) FROM learning_schema_migrations",
            [],
            |row| row.get(0),
        )
        .map_err(sql_error)?;
    let integrity: String = connection
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(sql_error)?;
    Ok(json!({
        "path": path,
        "schemaVersion": version,
        "currentSchemaVersion": LEARNING_SCHEMA_VERSION,
        "integrity": integrity,
        "foreignKeys": connection.query_row("PRAGMA foreign_keys", [], |row| row.get::<_, i64>(0)).unwrap_or(0) == 1,
    }))
}

#[tauri::command]
pub fn learning_database_info_native(
    state: tauri::State<'_, LearningDatabase>,
) -> Result<Value, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "El bloqueo de SQLite learning quedó invalidado.".to_string())?;
    database_info(&connection, &state.path)
}

#[tauri::command]
pub fn learning_snapshot_native(
    state: tauri::State<'_, LearningDatabase>,
) -> Result<Value, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "El bloqueo de SQLite learning quedó invalidado.".to_string())?;
    snapshot(&connection)
}

#[tauri::command]
pub fn learning_replace_snapshot_native(
    value: Value,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<(), String> {
    let mut connection = state
        .connection
        .lock()
        .map_err(|_| "El bloqueo de SQLite learning quedó invalidado.".to_string())?;
    replace_snapshot(&mut connection, &value)
}

#[tauri::command]
pub fn learning_create_backup_native(
    kind: String,
    protected: bool,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<NativeLearningBackup, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "El bloqueo de SQLite learning quedó invalidado.".to_string())?;
    create_backup(
        &connection,
        &state.path,
        &state.backup_dir,
        &kind,
        protected,
    )
}

#[tauri::command]
pub fn learning_list_backups_native(
    state: tauri::State<'_, LearningDatabase>,
) -> Result<Vec<Value>, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "El bloqueo de SQLite learning quedó invalidado.".to_string())?;
    backup_records(&connection)
}

#[tauri::command]
pub fn learning_restore_backup_native(
    id: String,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<NativeLearningBackup, String> {
    let mut connection = state
        .connection
        .lock()
        .map_err(|_| "El bloqueo de SQLite learning quedó invalidado.".to_string())?;
    let (backup_path, expected_hash): (String, String) = connection
        .query_row(
            "SELECT storage_reference, database_hash FROM learning_backups WHERE id=?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|error| format!("Backup inexistente: {error}"))?;
    let safety_backup = create_backup(
        &connection,
        &state.path,
        &state.backup_dir,
        "pre-restore",
        true,
    )?;
    restore_backup(&mut connection, Path::new(&backup_path), &expected_hash)?;
    connection
        .execute_batch("PRAGMA foreign_keys=ON;")
        .map_err(sql_error)?;
    initialize_learning_database(&mut connection, &state.path, &state.backup_dir)?;
    persist_backup_record(&connection, &safety_backup)?;
    Ok(safety_backup)
}

#[tauri::command]
pub fn learning_delete_backup_native(
    id: String,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<(), String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "El bloqueo de SQLite learning quedó invalidado.".to_string())?;
    delete_backup(&connection, &id)
}

#[tauri::command]
pub fn learning_stage_binary_native(
    bytes: Vec<u8>,
    expected_hash: String,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<String, String> {
    if sha256_bytes(&bytes) != expected_hash {
        return Err("El blob recibido no coincide con su SHA-256 declarado.".to_string());
    }
    let staging_dir = state.package_dir.join("staging");
    fs::create_dir_all(&staging_dir)
        .map_err(|error| format!("No se pudo crear staging de paquetes: {error}"))?;
    let token = format!("stage.{}", Uuid::new_v4());
    fs::write(staging_dir.join(&token), bytes)
        .map_err(|error| format!("No se pudo preparar el blob: {error}"))?;
    Ok(token)
}

#[tauri::command]
pub fn learning_commit_binary_native(
    token: String,
    expected_hash: String,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<String, String> {
    validate_stage_token(&token)?;
    let source = state.package_dir.join("staging").join(&token);
    let bytes =
        fs::read(&source).map_err(|error| format!("No se pudo leer el blob preparado: {error}"))?;
    if sha256_bytes(&bytes) != expected_hash {
        return Err("El blob preparado cambió antes de confirmarse.".to_string());
    }
    let digest = hash_digest(&expected_hash)?;
    let object_dir = state.package_dir.join("sha256");
    fs::create_dir_all(&object_dir)
        .map_err(|error| format!("No se pudo crear almacén de paquetes: {error}"))?;
    let destination = object_dir.join(digest);
    if destination.exists() {
        fs::remove_file(&source)
            .map_err(|error| format!("No se pudo retirar staging duplicado: {error}"))?;
    } else {
        fs::rename(&source, &destination)
            .map_err(|error| format!("No se pudo confirmar el blob: {error}"))?;
    }
    Ok(format!("native:sha256/{digest}"))
}

#[tauri::command]
pub fn learning_rollback_binary_native(
    token: String,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<(), String> {
    validate_stage_token(&token)?;
    let path = state.package_dir.join("staging").join(token);
    if path.exists() {
        fs::remove_file(path)
            .map_err(|error| format!("No se pudo retirar el blob preparado: {error}"))?;
    }
    Ok(())
}

#[tauri::command]
pub fn learning_read_binary_native(
    reference: String,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<Vec<u8>, String> {
    let digest = native_reference_digest(&reference)?;
    fs::read(state.package_dir.join("sha256").join(digest))
        .map_err(|error| format!("No se pudo leer el blob instalado: {error}"))
}

#[tauri::command]
pub fn learning_remove_binary_native(
    reference: String,
    state: tauri::State<'_, LearningDatabase>,
) -> Result<(), String> {
    let digest = native_reference_digest(&reference)?;
    let path = state.package_dir.join("sha256").join(digest);
    if path.exists() {
        fs::remove_file(path)
            .map_err(|error| format!("No se pudo borrar el blob instalado: {error}"))?;
    }
    Ok(())
}

fn validate_stage_token(token: &str) -> Result<(), String> {
    let valid = token
        .strip_prefix("stage.")
        .and_then(|value| Uuid::parse_str(value).ok())
        .is_some();
    if valid {
        Ok(())
    } else {
        Err("Token de staging no válido.".to_string())
    }
}

fn hash_digest(hash: &str) -> Result<&str, String> {
    hash.strip_prefix("sha256:")
        .filter(|value| {
            value.len() == 64 && value.chars().all(|character| character.is_ascii_hexdigit())
        })
        .ok_or_else(|| "SHA-256 no válido.".to_string())
}

fn native_reference_digest(reference: &str) -> Result<&str, String> {
    hash_digest(
        reference
            .strip_prefix("native:")
            .ok_or_else(|| "Referencia nativa no válida.".to_string())?,
    )
}

fn read_payloads(connection: &Connection, table: &str) -> Result<Vec<Value>, String> {
    read_payloads_ordered(connection, table, "rowid")
}

fn read_payloads_ordered(
    connection: &Connection,
    table: &str,
    order: &str,
) -> Result<Vec<Value>, String> {
    let allowed = [
        "learning_profiles",
        "learning_sessions",
        "learning_events",
        "learning_evidence",
        "learning_assessments",
        "learning_mastery",
        "learning_packages",
        "learning_backups",
        "learning_recovery_log",
    ];
    if !allowed.contains(&table) {
        return Err("Tabla learning no permitida.".to_string());
    }
    let sql = format!("SELECT payload FROM {table} ORDER BY {order}");
    let mut statement = connection.prepare(&sql).map_err(sql_error)?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(sql_error)?;
    rows.map(|row| serde_json::from_str::<Value>(&row.map_err(sql_error)?).map_err(json_error))
        .collect()
}

fn read_migrations(connection: &Connection) -> Result<Vec<Value>, String> {
    let mut statement = connection
        .prepare("SELECT version,name,checksum,applied_at,duration_ms FROM learning_schema_migrations ORDER BY version")
        .map_err(sql_error)?;
    let rows = statement
        .query_map([], |row| {
            Ok(json!({
                "version": row.get::<_, i64>(0)?,
                "name": row.get::<_, String>(1)?,
                "checksum": row.get::<_, String>(2)?,
                "appliedAt": row.get::<_, String>(3)?,
                "durationMs": row.get::<_, i64>(4)?,
            }))
        })
        .map_err(sql_error)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(sql_error)
}

fn table_exists(connection: &Connection, name: &str) -> Result<bool, String> {
    connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name=?1)",
            params![name],
            |row| row.get(0),
        )
        .map_err(sql_error)
}

fn array<'a>(value: &'a Value, field: &str) -> Result<&'a [Value], String> {
    value
        .get(field)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .ok_or_else(|| format!("Snapshot sin array {field}."))
}

fn text<'a>(value: &'a Value, field: &str) -> Result<&'a str, String> {
    value
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| format!("Campo {field} ausente o no textual."))
}

fn optional_text<'a>(value: &'a Value, field: &str) -> Option<&'a str> {
    value.get(field).and_then(Value::as_str)
}

fn integer(value: &Value, field: &str) -> Result<i64, String> {
    value
        .get(field)
        .and_then(Value::as_i64)
        .ok_or_else(|| format!("Campo {field} ausente o no entero."))
}

fn number(value: &Value, field: &str) -> Result<f64, String> {
    value
        .get(field)
        .and_then(Value::as_f64)
        .ok_or_else(|| format!("Campo {field} ausente o no numérico."))
}

fn boolean(value: &Value, field: &str) -> Result<bool, String> {
    value
        .get(field)
        .and_then(Value::as_bool)
        .ok_or_else(|| format!("Campo {field} ausente o no booleano."))
}

fn sha256_bytes(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn sql_error(error: rusqlite::Error) -> String {
    format!("Error SQLite learning: {error}")
}

fn json_error(error: serde_json::Error) -> String {
    format!("Error JSON learning: {error}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn open_test() -> (tempfile::TempDir, PathBuf, PathBuf, Connection) {
        let directory = tempdir().unwrap();
        let database_path = directory.path().join("learning.sqlite3");
        let backup_dir = directory.path().join("backups");
        let connection = Connection::open(&database_path).unwrap();
        (directory, database_path, backup_dir, connection)
    }

    fn profile() -> Value {
        json!({
          "schemaVersion":1,"id":"profile.test","displayName":"Local","locale":"es-ES",
          "accessibility":{"reducedMotion":false,"textScale":1,"contrast":"system","interactionMode":"adaptive","extendedTime":false,"readLabels":false,"adaptations":[]},
          "educationalPreferences":{},"createdAt":"2026-07-23T09:00:00Z","modifiedAt":"2026-07-23T09:00:00Z",
          "archived":false,"recordVersion":1
        })
    }

    fn empty_snapshot() -> Value {
        json!({
          "schemaVersion":1,"revision":0,"profiles":[],"sessions":[],"events":[],"evidence":[],
          "assessments":[],"mastery":[],"packages":[],"migrations":[],"backups":[],"recoveryLog":[]
        })
    }

    #[test]
    fn creates_empty_database_with_migration_and_foreign_keys() {
        let (_directory, path, backups, mut connection) = open_test();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        assert_eq!(
            connection
                .query_row(
                    "SELECT MAX(version) FROM learning_schema_migrations",
                    [],
                    |row| row.get::<_, i64>(0)
                )
                .unwrap(),
            2
        );
        assert!(table_exists(&connection, "learning_events").unwrap());
        assert!(table_exists(&connection, "physical_specimens").unwrap());
        assert!(table_exists(&connection, "object_store_objects").unwrap());
        assert!(table_exists(&connection, "geometry_correction_proposals").unwrap());
        assert_eq!(
            connection
                .query_row("PRAGMA foreign_keys", [], |row| row.get::<_, i64>(0))
                .unwrap(),
            1
        );
    }

    #[test]
    fn migration_is_idempotent_and_reopens() {
        let (_directory, path, backups, mut connection) = open_test();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        drop(connection);
        let mut reopened = Connection::open(&path).unwrap();
        initialize_learning_database(&mut reopened, &path, &backups).unwrap();
        assert_eq!(database_info(&reopened, &path).unwrap()["integrity"], "ok");
    }

    #[test]
    fn failed_migration_rolls_back() {
        let (_directory, path, backups, mut connection) = open_test();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        let result = apply_migration(
            &mut connection,
            3,
            "broken",
            "CREATE TABLE temporary_ok(id TEXT); INVALID SQL;",
        );
        assert!(result.is_err());
        assert!(!table_exists(&connection, "temporary_ok").unwrap());
        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM learning_schema_migrations WHERE version=3",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn snapshot_replace_is_transactional_and_enforces_foreign_keys() {
        let (_directory, path, backups, mut connection) = open_test();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        let mut value = empty_snapshot();
        value["profiles"] = json!([profile()]);
        replace_snapshot(&mut connection, &value).unwrap();
        assert_eq!(
            snapshot(&connection).unwrap()["profiles"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
        let mut invalid = value.clone();
        invalid["sessions"] = json!([{
          "schemaVersion":1,"id":"session.bad","profileId":"missing","packageId":"pack","packageVersion":"1.0.0",
          "lessonId":"lesson","activityId":"activity","activityVersion":"1.0.0","rubricId":"rubric","rubricVersion":"1.0.0",
          "reference":{"kind":"project","projectId":"project"},"initialProjectFingerprint":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "currentProjectFingerprint":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "initialCapabilities":[],"state":"created","startedAt":"2026-07-23T09:00:00Z","attempt":1,
          "runtimeVersion":"1.0.0","updatedAt":"2026-07-23T09:00:00Z"
        }]);
        assert!(replace_snapshot(&mut connection, &invalid).is_err());
        assert_eq!(
            snapshot(&connection).unwrap()["profiles"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
    }

    #[test]
    fn event_constraints_reject_duplicate_sequence_and_idempotency() {
        let (_directory, path, backups, mut connection) = open_test();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        let mut value = empty_snapshot();
        value["profiles"] = json!([profile()]);
        value["sessions"] = json!([{
          "schemaVersion":1,"id":"session.test","profileId":"profile.test","packageId":"pack","packageVersion":"1.0.0",
          "lessonId":"lesson","activityId":"activity","activityVersion":"1.0.0","rubricId":"rubric","rubricVersion":"1.0.0",
          "reference":{"kind":"project","projectId":"project"},"initialProjectFingerprint":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "currentProjectFingerprint":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "initialCapabilities":[],"state":"active","startedAt":"2026-07-23T09:00:00Z","attempt":1,
          "runtimeVersion":"1.0.0","updatedAt":"2026-07-23T09:00:00Z"
        }]);
        let event = json!({
          "schemaVersion":1,"id":"event.1","sessionId":"session.test","sequence":0,"timestamp":"2026-07-23T09:00:00Z",
          "runtimeEventVersion":1,"type":"scene-started","origin":"runtime","actor":"learner","payload":{},
          "idempotencyKey":"key","persistedAt":"2026-07-23T09:00:00Z","compatibility":"supported"
        });
        let mut duplicate = event.clone();
        duplicate["id"] = json!("event.2");
        value["events"] = json!([event, duplicate]);
        assert!(replace_snapshot(&mut connection, &value).is_err());
    }

    #[test]
    fn creates_verifies_and_restores_real_sqlite_backup() {
        let (_directory, path, backups, mut connection) = open_test();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        let mut value = empty_snapshot();
        value["profiles"] = json!([profile()]);
        replace_snapshot(&mut connection, &value).unwrap();
        let backup = create_backup(&connection, &path, &backups, "manual", false).unwrap();
        let empty = empty_snapshot();
        replace_snapshot(&mut connection, &empty).unwrap();
        restore_backup(
            &mut connection,
            Path::new(&backup.storage_reference),
            &backup.database_hash,
        )
        .unwrap();
        connection.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        assert_eq!(
            snapshot(&connection).unwrap()["profiles"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
    }

    #[test]
    fn rejects_corrupt_backup() {
        let (_directory, path, backups, mut connection) = open_test();
        initialize_learning_database(&mut connection, &path, &backups).unwrap();
        let backup = create_backup(&connection, &path, &backups, "manual", false).unwrap();
        fs::write(&backup.storage_reference, b"corrupt").unwrap();
        assert!(restore_backup(
            &mut connection,
            Path::new(&backup.storage_reference),
            &backup.database_hash
        )
        .is_err());
    }
}

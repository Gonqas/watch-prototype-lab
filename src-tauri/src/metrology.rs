use std::{
    collections::HashSet,
    fs::{self, File},
    io::{BufReader, BufWriter, Read, Write},
    path::{Path, PathBuf},
    sync::Mutex,
};

use chrono::Utc;
use image::{DynamicImage, ImageFormat, ImageReader};
use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use tauri::State;

use crate::learning_db::{create_backup, persist_backup_record, restore_backup, LearningDatabase};

const MAX_IMAGE_BYTES: u64 = 250 * 1024 * 1024;
const COPY_BUFFER_BYTES: usize = 1024 * 1024;

pub struct MetrologyImportState {
    cancelled: Mutex<HashSet<String>>,
}

impl MetrologyImportState {
    pub fn new() -> Self {
        Self {
            cancelled: Mutex::new(HashSet::new()),
        }
    }

    fn begin(&self, job_id: &str) -> Result<(), String> {
        self.cancelled
            .lock()
            .map_err(|_| "El control de importación quedó bloqueado.".to_string())?
            .remove(job_id);
        Ok(())
    }

    fn is_cancelled(&self, job_id: &str) -> bool {
        self.cancelled
            .lock()
            .map(|items| items.contains(job_id))
            .unwrap_or(true)
    }

    fn finish(&self, job_id: &str) {
        if let Ok(mut items) = self.cancelled.lock() {
            items.remove(job_id);
        }
    }
}

fn table_for(record_type: &str) -> Option<&'static str> {
    Some(match record_type {
        "physical_specimens" => "physical_specimens",
        "physical_components" => "physical_components",
        "instrument_profiles" => "instrument_profiles",
        "instrument_verifications" => "instrument_verifications",
        "inspection_plans" => "inspection_plans",
        "inspection_sessions" => "inspection_sessions",
        "inspection_observations" => "inspection_observations",
        "inspection_findings" => "inspection_findings",
        "image_assets" => "image_assets",
        "image_derivatives" => "image_derivatives",
        "image_calibrations" => "image_calibrations",
        "image_annotations" => "image_annotations",
        "measurement_definitions" => "measurement_definitions",
        "measurement_series" => "measurement_series",
        "measurement_readings" => "measurement_readings",
        "nominal_measured_comparisons" => "nominal_measured_comparisons",
        "geometry_correction_proposals" => "geometry_correction_proposals",
        "object_store_objects" => "object_store_objects",
        "object_store_references" => "object_store_references",
        "object_store_import_jobs" => "object_store_import_jobs",
        "metrology_reports" => "metrology_reports",
        _ => return None,
    })
}

fn text(value: &Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|item| !item.trim().is_empty())
        .map(ToString::to_string)
}

fn required_text(value: &Value, key: &str) -> Result<String, String> {
    text(value, key).ok_or_else(|| format!("El registro de metrología necesita {key}."))
}

fn owner_id(record_type: &str, value: &Value) -> Option<String> {
    let keys: &[&str] = match record_type {
        "instrument_verifications" => &["instrumentId"],
        "inspection_observations" | "inspection_findings" => &["sessionId"],
        "image_derivatives" | "image_calibrations" | "image_annotations" => &["imageAssetId"],
        "measurement_readings" => &["seriesId"],
        "object_store_references" => &["ownerId"],
        _ => &["ownerId"],
    };
    keys.iter().find_map(|key| text(value, key))
}

fn record_state(value: &Value) -> String {
    ["state", "status", "condition"]
        .iter()
        .find_map(|key| text(value, key))
        .unwrap_or_else(|| "active".to_string())
}

fn put_record(connection: &Connection, record_type: &str, value: &Value) -> Result<(), String> {
    let table = table_for(record_type)
        .ok_or_else(|| "Tipo de registro de metrología no permitido.".to_string())?;
    let id = required_text(value, "id")?;
    let profile_id = text(value, "profileId");
    let specimen_id = text(value, "specimenId");
    let owner_id = owner_id(record_type, value);
    let state = record_state(value);
    let created_at = text(value, "createdAt").unwrap_or_else(|| Utc::now().to_rfc3339());
    let updated_at = text(value, "updatedAt").unwrap_or_else(|| created_at.clone());
    let record_version = value
        .get("recordVersion")
        .and_then(Value::as_i64)
        .unwrap_or(1);
    let payload = serde_json::to_string(value)
        .map_err(|error| format!("Registro de metrología no serializable: {error}"))?;
    if record_type == "object_store_objects" {
        let sha256 = required_text(value, "sha256")?;
        let bytes = value
            .get("bytes")
            .and_then(Value::as_i64)
            .ok_or_else(|| "El objeto necesita bytes.".to_string())?;
        let media_type = required_text(value, "mediaType")?;
        let storage_path = required_text(value, "storagePath")?;
        connection.execute(
            "INSERT INTO object_store_objects(id,profile_id,specimen_id,owner_id,state,sha256,bytes,media_type,storage_path,created_at,updated_at,record_version,payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
             ON CONFLICT(id) DO NOTHING",
            params![id, profile_id, specimen_id, owner_id, state, sha256, bytes, media_type, storage_path, created_at, updated_at, record_version, payload],
        ).map_err(|error| format!("No se pudo guardar el objeto: {error}"))?;
    } else if record_type == "object_store_references" {
        let object_id = required_text(value, "objectId")?;
        connection.execute(
            "INSERT INTO object_store_references(id,profile_id,specimen_id,owner_id,object_id,state,created_at,updated_at,record_version,payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)
             ON CONFLICT(id) DO UPDATE SET profile_id=excluded.profile_id,specimen_id=excluded.specimen_id,owner_id=excluded.owner_id,object_id=excluded.object_id,state=excluded.state,updated_at=excluded.updated_at,record_version=excluded.record_version,payload=excluded.payload",
            params![id, profile_id, specimen_id, owner_id.unwrap_or_else(|| "unknown".to_string()), object_id, state, created_at, updated_at, record_version, payload],
        ).map_err(|error| format!("No se pudo guardar la referencia: {error}"))?;
    } else {
        let sql = format!(
            "INSERT INTO {table}(id,profile_id,specimen_id,owner_id,state,created_at,updated_at,record_version,payload)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)
             ON CONFLICT(id) DO UPDATE SET profile_id=excluded.profile_id,specimen_id=excluded.specimen_id,owner_id=excluded.owner_id,state=excluded.state,updated_at=excluded.updated_at,record_version=excluded.record_version,payload=excluded.payload"
        );
        connection
            .execute(
                &sql,
                params![
                    id,
                    profile_id,
                    specimen_id,
                    owner_id,
                    state,
                    created_at,
                    updated_at,
                    record_version,
                    payload
                ],
            )
            .map_err(|error| format!("No se pudo guardar {record_type}: {error}"))?;
    }
    Ok(())
}

fn get_record(
    connection: &Connection,
    record_type: &str,
    id: &str,
) -> Result<Option<Value>, String> {
    let table = table_for(record_type)
        .ok_or_else(|| "Tipo de registro de metrología no permitido.".to_string())?;
    let sql = format!("SELECT payload FROM {table} WHERE id=?1");
    let payload: Option<String> = connection
        .query_row(&sql, params![id], |row| row.get(0))
        .optional()
        .map_err(|error| format!("No se pudo leer {record_type}: {error}"))?;
    payload
        .map(|raw| {
            serde_json::from_str(&raw)
                .map_err(|error| format!("Registro de metrología corrupto: {error}"))
        })
        .transpose()
}

fn list_records(
    connection: &Connection,
    record_type: &str,
    profile_id: Option<&str>,
    specimen_id: Option<&str>,
    owner_id: Option<&str>,
    offset: i64,
    limit: i64,
) -> Result<Value, String> {
    let table = table_for(record_type)
        .ok_or_else(|| "Tipo de registro de metrología no permitido.".to_string())?;
    let count_sql = format!("SELECT COUNT(*) FROM {table} WHERE (?1 IS NULL OR profile_id=?1) AND (?2 IS NULL OR specimen_id=?2) AND (?3 IS NULL OR owner_id=?3)");
    let total: i64 = connection
        .query_row(
            &count_sql,
            params![profile_id, specimen_id, owner_id],
            |row| row.get(0),
        )
        .map_err(|error| format!("No se pudo contar {record_type}: {error}"))?;
    let sql = format!("SELECT payload FROM {table} WHERE (?1 IS NULL OR profile_id=?1) AND (?2 IS NULL OR specimen_id=?2) AND (?3 IS NULL OR owner_id=?3) ORDER BY updated_at DESC LIMIT ?4 OFFSET ?5");
    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| format!("No se pudo preparar consulta: {error}"))?;
    let rows = statement
        .query_map(
            params![
                profile_id,
                specimen_id,
                owner_id,
                limit.clamp(1, 250),
                offset.max(0)
            ],
            |row| row.get::<_, String>(0),
        )
        .map_err(|error| format!("No se pudo listar {record_type}: {error}"))?;
    let mut items = Vec::new();
    for row in rows {
        let raw = row.map_err(|error| format!("No se pudo leer fila: {error}"))?;
        items.push(
            serde_json::from_str::<Value>(&raw)
                .map_err(|error| format!("Registro corrupto: {error}"))?,
        );
    }
    Ok(
        json!({ "items": items, "total": total, "offset": offset.max(0), "limit": limit.clamp(1, 250) }),
    )
}

#[tauri::command]
pub fn learning_metrology_put_native(
    record_type: String,
    value: Value,
    state: State<'_, LearningDatabase>,
) -> Result<(), String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    put_record(&connection, &record_type, &value)
}

#[tauri::command]
pub fn learning_metrology_get_native(
    record_type: String,
    id: String,
    state: State<'_, LearningDatabase>,
) -> Result<Option<Value>, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    get_record(&connection, &record_type, &id)
}

#[tauri::command]
pub fn learning_metrology_list_native(
    record_type: String,
    profile_id: Option<String>,
    specimen_id: Option<String>,
    owner_id: Option<String>,
    offset: Option<i64>,
    limit: Option<i64>,
    state: State<'_, LearningDatabase>,
) -> Result<Value, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    list_records(
        &connection,
        &record_type,
        profile_id.as_deref(),
        specimen_id.as_deref(),
        owner_id.as_deref(),
        offset.unwrap_or(0),
        limit.unwrap_or(50),
    )
}

#[tauri::command]
pub fn learning_remove_object_reference_native(
    reference_id: String,
    state: State<'_, LearningDatabase>,
) -> Result<(), String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    connection
        .execute(
            "DELETE FROM object_store_references WHERE id=?1",
            params![reference_id],
        )
        .map_err(|error| format!("No se pudo retirar la referencia: {error}"))?;
    Ok(())
}

fn object_root(database_path: &Path) -> Result<PathBuf, String> {
    let parent = database_path
        .parent()
        .ok_or_else(|| "No se pudo resolver la carpeta de datos.".to_string())?;
    Ok(parent.join("learning-objects"))
}

pub fn recover_object_store_staging(database_path: &Path) -> Result<(), String> {
    let staging = object_root(database_path)?.join(".staging");
    fs::create_dir_all(&staging)
        .map_err(|error| format!("No se pudo preparar staging de imágenes: {error}"))?;
    for entry in
        fs::read_dir(&staging).map_err(|error| format!("No se pudo revisar staging: {error}"))?
    {
        let path = entry
            .map_err(|error| format!("Entrada de staging inválida: {error}"))?
            .path();
        if path.is_file() {
            fs::remove_file(path)
                .map_err(|error| format!("No se pudo recuperar staging: {error}"))?;
        }
    }
    Ok(())
}

fn image_format(
    path: &Path,
) -> Result<(DynamicImage, ImageFormat, &'static str, &'static str), String> {
    let reader = ImageReader::open(path)
        .map_err(|error| format!("No se pudo abrir la imagen: {error}"))?
        .with_guessed_format()
        .map_err(|error| format!("No se pudo detectar el formato: {error}"))?;
    let format = reader
        .format()
        .ok_or_else(|| "Formato de imagen desconocido.".to_string())?;
    let (media_type, extension) = match format {
        ImageFormat::Jpeg => ("image/jpeg", "jpg"),
        ImageFormat::Png => ("image/png", "png"),
        ImageFormat::WebP => ("image/webp", "webp"),
        _ => return Err("Solo se admiten JPEG, PNG y WebP. HEIC permanece bloqueado hasta disponer de soporte real.".to_string()),
    };
    let image = reader
        .decode()
        .map_err(|error| format!("La imagen está dañada o no coincide con su formato: {error}"))?;
    Ok((image, format, media_type, extension))
}

fn file_hash(path: &Path) -> Result<String, String> {
    let mut reader = BufReader::new(
        File::open(path).map_err(|error| format!("No se pudo abrir objeto: {error}"))?,
    );
    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; COPY_BUFFER_BYTES];
    loop {
        let read = reader
            .read(&mut buffer)
            .map_err(|error| format!("No se pudo leer objeto: {error}"))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn copy_file_verified(
    source: &Path,
    destination: &Path,
    expected_hash: &str,
) -> Result<u64, String> {
    if file_hash(source)? != expected_hash {
        return Err(format!(
            "El objeto {} no coincide con su SHA-256.",
            source.display()
        ));
    }
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("No se pudo preparar destino de backup: {error}"))?;
    }
    let temporary = destination.with_extension("restore-staging");
    fs::copy(source, &temporary).map_err(|error| format!("No se pudo copiar objeto: {error}"))?;
    if file_hash(&temporary)? != expected_hash {
        let _ = fs::remove_file(&temporary);
        return Err("La copia del objeto no supera SHA-256.".to_string());
    }
    if destination.exists() {
        fs::remove_file(destination)
            .map_err(|error| format!("No se pudo sustituir staging verificado: {error}"))?;
    }
    fs::rename(&temporary, destination)
        .map_err(|error| format!("No se pudo confirmar copia verificada: {error}"))?;
    destination
        .metadata()
        .map(|value| value.len())
        .map_err(|error| format!("No se pudo medir copia: {error}"))
}

fn relative_object_path(root: &Path, source: &Path) -> Result<PathBuf, String> {
    let relative = source.strip_prefix(root).map(Path::to_path_buf)
        .map_err(|_| "Un objeto registrado está fuera del almacén permitido.".to_string())?;
    if relative.is_absolute() || relative.components().any(|part| matches!(part, std::path::Component::ParentDir)) {
        return Err("Un objeto registrado contiene una ruta no permitida.".to_string());
    }
    Ok(relative)
}

fn build_metrology_backup(
    connection: &Connection,
    database: &LearningDatabase,
    include_objects: bool,
) -> Result<Value, String> {
    let kind = if include_objects {
        "metrology-full"
    } else {
        "metrology-metadata"
    };
    let backup = create_backup(connection, &database.path, &database.backup_dir, kind, true)?;
    let root = object_root(&database.path)?;
    fs::create_dir_all(&root)
        .map_err(|error| format!("No se pudo preparar el almacén: {error}"))?;
    let backup_root = database.backup_dir.join(format!("{}.objects", backup.id));
    let mut statement = connection
        .prepare("SELECT payload FROM object_store_objects WHERE state <> 'deleted' ORDER BY id")
        .map_err(|error| format!("No se pudo preparar manifiesto de objetos: {error}"))?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| format!("No se pudieron listar objetos: {error}"))?;
    let mut objects = Vec::new();
    let mut included_bytes = 0u64;
    for row in rows {
        let raw = row.map_err(|error| format!("Objeto de backup ilegible: {error}"))?;
        let value: Value = serde_json::from_str(&raw)
            .map_err(|error| format!("Payload de objeto corrupto: {error}"))?;
        let id = required_text(&value, "id")?;
        let sha256 = required_text(&value, "sha256")?;
        let source = PathBuf::from(required_text(&value, "storagePath")?);
        let relative = relative_object_path(&root, &source)?;
        let verified = source.is_file()
            && file_hash(&source)
                .map(|hash| hash == sha256)
                .unwrap_or(false);
        let mut included = false;
        let mut problem = None::<String>;
        if !verified {
            problem = Some("ausente o SHA-256 inválido".to_string());
        } else if include_objects {
            let destination = backup_root.join(&relative);
            match copy_file_verified(&source, &destination, &sha256) {
                Ok(bytes) => {
                    included = true;
                    included_bytes += bytes;
                }
                Err(error) => problem = Some(error),
            }
        }
        objects.push(json!({
            "id":id,"sha256":sha256,"bytes":value.get("bytes").and_then(Value::as_u64).unwrap_or(0),
            "mediaType":text(&value,"mediaType"),"storageRelative":relative.to_string_lossy(),
            "included":included,"verifiedAtBackup":verified,"omissionReason":if include_objects { problem } else { Some("backup de metadatos: objeto declarado pero no incluido".to_string()) }
        }));
    }
    let created_at = Utc::now().to_rfc3339();
    let manifest = json!({
        "format":"wplab-metrology-backup","formatVersion":1,"backupId":backup.id,"kind":kind,
        "createdAt":created_at,"databasePath":backup.storage_reference,"databaseHash":backup.database_hash,
        "objectsIncluded":include_objects,"objects":objects,"includedObjectBytes":included_bytes,
        "restorePolicy":"preview-required-no-silent-overwrite"
    });
    let manifest_path = database
        .backup_dir
        .join(format!("{}.metrology-manifest.json", backup.id));
    let manifest_bytes = serde_json::to_vec_pretty(&manifest)
        .map_err(|error| format!("No se pudo serializar manifiesto: {error}"))?;
    fs::write(&manifest_path, &manifest_bytes)
        .map_err(|error| format!("No se pudo guardar manifiesto: {error}"))?;
    Ok(json!({
        "backup":backup,"manifestPath":manifest_path,"manifestHash":format!("{:x}",Sha256::digest(&manifest_bytes)),
        "objectsIncluded":include_objects,"objectCount":objects.len(),"includedObjectBytes":included_bytes,
        "omittedObjectCount":objects.iter().filter(|value| !value.get("included").and_then(Value::as_bool).unwrap_or(false)).count()
    }))
}

#[tauri::command]
pub fn learning_create_metrology_backup_native(
    include_objects: bool,
    state: State<'_, LearningDatabase>,
) -> Result<Value, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    build_metrology_backup(&connection, &state, include_objects)
}

fn metrology_restore_preview(id: &str, database: &LearningDatabase) -> Result<Value, String> {
    let manifest_path = database
        .backup_dir
        .join(format!("{id}.metrology-manifest.json"));
    let bytes = fs::read(&manifest_path)
        .map_err(|error| format!("No se pudo leer el manifiesto metrológico: {error}"))?;
    let manifest: Value = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Manifiesto metrológico corrupto: {error}"))?;
    let root = object_root(&database.path)?;
    let backup_root = database.backup_dir.join(format!("{id}.objects"));
    let mut missing = Vec::new();
    let mut conflicts = Vec::new();
    let mut restorable = Vec::new();
    for object in manifest
        .get("objects")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
    {
        if !object
            .get("included")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            continue;
        }
        let relative = PathBuf::from(required_text(&object, "storageRelative")?);
        if relative.is_absolute()
            || relative
                .components()
                .any(|part| matches!(part, std::path::Component::ParentDir))
        {
            return Err("Ruta relativa de backup no permitida.".to_string());
        }
        let sha256 = required_text(&object, "sha256")?;
        let source = backup_root.join(&relative);
        let destination = root.join(&relative);
        if !source.is_file()
            || file_hash(&source)
                .map(|hash| hash != sha256)
                .unwrap_or(true)
        {
            missing.push(required_text(&object, "id")?);
            continue;
        }
        if destination.exists()
            && file_hash(&destination)
                .map(|hash| hash != sha256)
                .unwrap_or(true)
        {
            conflicts.push(required_text(&object, "id")?);
            continue;
        }
        restorable.push(required_text(&object, "id")?);
    }
    Ok(json!({
        "backupId":id,"manifestHash":format!("{:x}",Sha256::digest(&bytes)),"databaseHash":manifest.get("databaseHash"),
        "objectsIncluded":manifest.get("objectsIncluded"),"restorableObjectIds":restorable,
        "missingOrCorruptObjectIds":missing,"conflictingObjectIds":conflicts,"requiresConfirmation":true,"willOverwrite":false
    }))
}

#[tauri::command]
pub fn learning_preview_metrology_restore_native(
    id: String,
    state: State<'_, LearningDatabase>,
) -> Result<Value, String> {
    metrology_restore_preview(&id, &state)
}

#[tauri::command]
pub fn learning_restore_metrology_backup_native(
    id: String,
    confirmed_manifest_hash: String,
    state: State<'_, LearningDatabase>,
) -> Result<Value, String> {
    let preview = metrology_restore_preview(&id, &state)?;
    if preview.get("manifestHash").and_then(Value::as_str) != Some(confirmed_manifest_hash.as_str())
    {
        return Err("La confirmación no coincide con el manifiesto previsualizado.".to_string());
    }
    if preview
        .get("missingOrCorruptObjectIds")
        .and_then(Value::as_array)
        .is_some_and(|items| !items.is_empty())
        || preview
            .get("conflictingObjectIds")
            .and_then(Value::as_array)
            .is_some_and(|items| !items.is_empty())
    {
        return Err(
            "La restauración está bloqueada por objetos ausentes, corruptos o en conflicto."
                .to_string(),
        );
    }
    let manifest_path = state
        .backup_dir
        .join(format!("{id}.metrology-manifest.json"));
    let manifest: Value = serde_json::from_slice(
        &fs::read(&manifest_path)
            .map_err(|error| format!("No se pudo leer manifiesto: {error}"))?,
    )
    .map_err(|error| format!("Manifiesto inválido: {error}"))?;
    let backup_path = PathBuf::from(required_text(&manifest, "databasePath")?);
    let database_hash = required_text(&manifest, "databaseHash")?;
    let root = object_root(&state.path)?;
    let backup_root = state.backup_dir.join(format!("{id}.objects"));
    let staging = root.join(".restore-staging").join(&id);
    if staging.exists() {
        fs::remove_dir_all(&staging)
            .map_err(|error| format!("No se pudo limpiar staging de restauración: {error}"))?;
    }
    fs::create_dir_all(&staging)
        .map_err(|error| format!("No se pudo preparar restauración: {error}"))?;
    for object in manifest
        .get("objects")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
    {
        if !object
            .get("included")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            continue;
        }
        let relative = PathBuf::from(required_text(&object, "storageRelative")?);
        copy_file_verified(
            &backup_root.join(&relative),
            &staging.join(&relative),
            &required_text(&object, "sha256")?,
        )?;
    }
    let mut connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    let safety = build_metrology_backup(&connection, &state, true)?;
    if let Err(error) = restore_backup(&mut connection, &backup_path, &database_hash) {
        let _ = fs::remove_dir_all(&staging);
        return Err(error);
    }
    for object in manifest
        .get("objects")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default()
    {
        if !object
            .get("included")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            continue;
        }
        let relative = PathBuf::from(required_text(&object, "storageRelative")?);
        let destination = root.join(&relative);
        if destination.exists() {
            continue;
        }
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("No se pudo preparar objeto restaurado: {error}"))?;
        }
        fs::rename(staging.join(&relative), &destination)
            .map_err(|error| format!("No se pudo confirmar objeto restaurado: {error}"))?;
        let object_id = required_text(&object, "id")?;
        let payload_raw: String = connection
            .query_row(
                "SELECT payload FROM object_store_objects WHERE id=?1",
                params![object_id],
                |row| row.get(0),
            )
            .map_err(|error| format!("Objeto restaurado sin metadatos: {error}"))?;
        let mut payload: Value = serde_json::from_str(&payload_raw)
            .map_err(|error| format!("Payload restaurado corrupto: {error}"))?;
        payload["storagePath"] = Value::String(destination.to_string_lossy().to_string());
        connection
            .execute(
                "UPDATE object_store_objects SET storage_path=?2,payload=?3 WHERE id=?1",
                params![
                    object_id,
                    destination.to_string_lossy(),
                    serde_json::to_string(&payload).map_err(|error| error.to_string())?
                ],
            )
            .map_err(|error| format!("No se pudo actualizar ruta restaurada: {error}"))?;
    }
    let _ = fs::remove_dir_all(&staging);
    if let Some(backup_value) = safety.get("backup") {
        let record: crate::learning_db::NativeLearningBackup =
            serde_json::from_value(backup_value.clone())
                .map_err(|error| format!("Backup de seguridad inválido: {error}"))?;
        persist_backup_record(&connection, &record)?;
    }
    Ok(
        json!({"restored":true,"backupId":id,"safetyBackup":safety,"objectCount":preview.get("restorableObjectIds").and_then(Value::as_array).map_or(0,Vec::len)}),
    )
}

#[tauri::command]
pub fn learning_cancel_image_import_native(
    job_id: String,
    state: State<'_, MetrologyImportState>,
) -> Result<bool, String> {
    state
        .cancelled
        .lock()
        .map_err(|_| "El control de importación quedó bloqueado.".to_string())?
        .insert(job_id);
    Ok(true)
}

#[tauri::command]
pub fn learning_import_image_native(
    path: String,
    job_id: String,
    profile_id: String,
    specimen_id: Option<String>,
    privacy: String,
    database: State<'_, LearningDatabase>,
    imports: State<'_, MetrologyImportState>,
) -> Result<Value, String> {
    imports.begin(&job_id)?;
    let created_at = Utc::now().to_rfc3339();
    let total_bytes = Path::new(&path).metadata().ok().map(|value| value.len());
    let base_job = json!({
        "schemaVersion":1,"id":job_id,"profileId":profile_id,"specimenId":specimen_id,
        "sourcePathName":Path::new(&path).file_name().and_then(|value|value.to_str()).unwrap_or("imagen"),
        "state":"hashing","bytesProcessed":0,"totalBytes":total_bytes,"createdAt":created_at,
        "updatedAt":created_at,"recordVersion":1
    });
    {
        let connection = database
            .connection
            .lock()
            .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
        put_record(&connection, "object_store_import_jobs", &base_job)?;
    }
    let result = import_image(
        &path,
        &job_id,
        &profile_id,
        specimen_id.as_deref(),
        &privacy,
        &database,
        &imports,
    );
    {
        let completed_at = Utc::now().to_rfc3339();
        let mut final_job = base_job.clone();
        final_job["updatedAt"] = Value::String(completed_at);
        final_job["recordVersion"] = Value::Number(2.into());
        match &result {
            Ok(value) => {
                final_job["state"] = Value::String("complete".to_string());
                final_job["bytesProcessed"] = Value::Number(total_bytes.unwrap_or(0).into());
                if let Some(id) = value.pointer("/originalObject/id").and_then(Value::as_str) {
                    final_job["objectId"] = Value::String(id.to_string());
                }
                if let Some(id) = value.pointer("/imageAsset/id").and_then(Value::as_str) {
                    final_job["imageAssetId"] = Value::String(id.to_string());
                }
            }
            Err(error) => {
                final_job["state"] = Value::String(
                    if error.contains("cancelada") {
                        "cancelled"
                    } else {
                        "failed"
                    }
                    .to_string(),
                );
                final_job["error"] = Value::String(error.clone());
            }
        }
        if let Ok(connection) = database.connection.lock() {
            let _ = put_record(&connection, "object_store_import_jobs", &final_job);
        }
    }
    imports.finish(&job_id);
    result
}

fn import_image(
    path: &str,
    job_id: &str,
    profile_id: &str,
    specimen_id: Option<&str>,
    privacy: &str,
    database: &LearningDatabase,
    imports: &MetrologyImportState,
) -> Result<Value, String> {
    if !["private", "profile", "exportable"].contains(&privacy) {
        return Err("Nivel de privacidad no permitido.".to_string());
    }
    let source = PathBuf::from(path)
        .canonicalize()
        .map_err(|error| format!("No se pudo validar la ruta seleccionada: {error}"))?;
    if !source.is_file() {
        return Err("La ruta seleccionada no es un archivo.".to_string());
    }
    let source_bytes = source
        .metadata()
        .map_err(|error| format!("No se pudo leer tamaño: {error}"))?
        .len();
    if source_bytes == 0 || source_bytes > MAX_IMAGE_BYTES {
        return Err("La imagen está vacía o supera 250 MB.".to_string());
    }
    let root = object_root(&database.path)?;
    let staging_dir = root.join(".staging");
    fs::create_dir_all(&staging_dir)
        .map_err(|error| format!("No se pudo preparar staging: {error}"))?;
    let staging_path = staging_dir.join(format!("{job_id}.source"));
    let mut reader = BufReader::new(
        File::open(&source).map_err(|error| format!("No se pudo abrir origen: {error}"))?,
    );
    let mut writer = BufWriter::new(
        File::create(&staging_path)
            .map_err(|error| format!("No se pudo crear staging: {error}"))?,
    );
    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; COPY_BUFFER_BYTES];
    loop {
        if imports.is_cancelled(job_id) {
            let _ = fs::remove_file(&staging_path);
            return Err("Importación cancelada por el usuario.".to_string());
        }
        let read = reader
            .read(&mut buffer)
            .map_err(|error| format!("No se pudo leer la imagen: {error}"))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
        writer
            .write_all(&buffer[..read])
            .map_err(|error| format!("No se pudo escribir staging: {error}"))?;
    }
    writer
        .flush()
        .map_err(|error| format!("No se pudo confirmar staging: {error}"))?;
    drop(writer);
    let hash = format!("{:x}", hasher.finalize());
    let (decoded, _format, media_type, extension) = image_format(&staging_path)?;
    let width = decoded.width();
    let height = decoded.height();
    let object_dir = root.join("objects").join(&hash[..2]);
    let thumbnail_dir = root.join("thumbnails");
    fs::create_dir_all(&object_dir)
        .map_err(|error| format!("No se pudo preparar objetos: {error}"))?;
    fs::create_dir_all(&thumbnail_dir)
        .map_err(|error| format!("No se pudo preparar miniaturas: {error}"))?;
    let final_path = object_dir.join(format!("{hash}.{extension}"));
    let thumbnail_stage = staging_dir.join(format!("{job_id}.thumbnail.webp"));
    let thumbnail_path = thumbnail_dir.join(format!("{hash}.webp"));
    let deduplicated = final_path.exists();
    let thumbnail_existed = thumbnail_path.exists();
    if !deduplicated {
        fs::rename(&staging_path, &final_path)
            .map_err(|error| format!("No se pudo confirmar el original: {error}"))?;
    } else {
        fs::remove_file(&staging_path)
            .map_err(|error| format!("No se pudo limpiar staging duplicado: {error}"))?;
    }
    if !thumbnail_path.exists() {
        decoded
            .thumbnail(512, 512)
            .save_with_format(&thumbnail_stage, ImageFormat::WebP)
            .map_err(|error| format!("No se pudo crear miniatura: {error}"))?;
        fs::rename(&thumbnail_stage, &thumbnail_path)
            .map_err(|error| format!("No se pudo confirmar miniatura: {error}"))?;
    }
    let thumbnail_hash = file_hash(&thumbnail_path)?;
    let thumbnail_bytes = thumbnail_path
        .metadata()
        .map_err(|error| format!("No se pudo leer miniatura: {error}"))?
        .len();
    let now = Utc::now().to_rfc3339();
    let object_id = format!("metrology.object.{hash}");
    let thumbnail_id = format!("metrology.object.{thumbnail_hash}");
    let profile_scope = format!("{:x}", Sha256::digest(profile_id.as_bytes()));
    let image_id = format!(
        "metrology.image.{}.{}.{hash}",
        &profile_scope[..12],
        specimen_id.unwrap_or("unassigned")
    );
    let original_name = source
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("imagen");
    let original = json!({
        "schemaVersion":1,"id":object_id,"sha256":hash,"bytes":source_bytes,"mediaType":media_type,
        "originalName":original_name,"importedAt":now,"ownerProfileId":profile_id,"profileId":profile_id,
        "specimenId":specimen_id,"privacy":privacy,"state":"ready","kind":"photo-original",
        "storagePath":final_path,"immutable":true,"createdAt":now,"updatedAt":now,"recordVersion":1
    });
    let thumbnail = json!({
        "schemaVersion":1,"id":thumbnail_id,"sha256":thumbnail_hash,"bytes":thumbnail_bytes,"mediaType":"image/webp",
        "originalName":format!("{original_name}.thumbnail.webp"),"importedAt":now,"ownerProfileId":profile_id,"profileId":profile_id,
        "specimenId":specimen_id,"privacy":privacy,"state":"ready","kind":"thumbnail",
        "storagePath":thumbnail_path,"immutable":true,"createdAt":now,"updatedAt":now,"recordVersion":1
    });
    let image_asset = json!({
        "schemaVersion":1,"id":image_id,"profileId":profile_id,"specimenId":specimen_id,"originalObjectId":object_id,
        "thumbnailObjectId":thumbnail_id,"derivativeObjectIds":[],"mediaType":media_type,"pixelWidth":width,
        "pixelHeight":height,"orientationDegrees":0,"importedAt":now,"privacy":privacy,"originalImmutable":true,
        "createdAt":now,"updatedAt":now,"recordVersion":1,"state":"ready"
    });
    let reference = json!({
        "schemaVersion":1,"id":format!("metrology.object-reference.{image_id}.original"),"profileId":profile_id,
        "specimenId":specimen_id,"objectId":object_id,"ownerType":"specimen","ownerId":specimen_id.unwrap_or(&image_id),
        "role":"photo-original","state":"ready","createdAt":now,"updatedAt":now,"recordVersion":1
    });
    let thumbnail_reference = json!({
        "schemaVersion":1,"id":format!("metrology.object-reference.{image_id}.thumbnail"),"profileId":profile_id,
        "specimenId":specimen_id,"objectId":thumbnail_id,"ownerType":"specimen","ownerId":specimen_id.unwrap_or(&image_id),
        "role":"thumbnail","state":"ready","createdAt":now,"updatedAt":now,"recordVersion":1
    });
    let mut connection = database
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    let transaction_result = (|| -> Result<(), String> {
        let transaction = connection
            .transaction()
            .map_err(|error| format!("No se pudo iniciar transacción de imagen: {error}"))?;
        put_record(&transaction, "object_store_objects", &original)?;
        put_record(&transaction, "object_store_objects", &thumbnail)?;
        put_record(&transaction, "image_assets", &image_asset)?;
        put_record(&transaction, "object_store_references", &reference)?;
        put_record(
            &transaction,
            "object_store_references",
            &thumbnail_reference,
        )?;
        transaction
            .commit()
            .map_err(|error| format!("No se pudo confirmar importación: {error}"))
    })();
    if let Err(error) = transaction_result {
        if !deduplicated {
            let _ = fs::remove_file(&final_path);
        }
        if !thumbnail_existed {
            let _ = fs::remove_file(&thumbnail_path);
        }
        return Err(error);
    }
    Ok(
        json!({ "jobId":job_id,"deduplicated":deduplicated,"imageAsset":image_asset,"originalObject":original,"thumbnailObject":thumbnail }),
    )
}

#[tauri::command]
pub fn learning_object_store_gc_preview_native(
    state: State<'_, LearningDatabase>,
) -> Result<Value, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    let mut statement = connection.prepare(
        "SELECT o.payload, COUNT(r.id) FROM object_store_objects o LEFT JOIN object_store_references r ON r.object_id=o.id GROUP BY o.id"
    ).map_err(|error| format!("No se pudo preparar GC: {error}"))?;
    let rows = statement
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|error| format!("No se pudo consultar GC: {error}"))?;
    let mut orphaned = Vec::new();
    let mut broken = Vec::new();
    for row in rows {
        let (payload, references) = row.map_err(|error| format!("Fila GC inválida: {error}"))?;
        let value: Value =
            serde_json::from_str(&payload).map_err(|error| format!("Objeto corrupto: {error}"))?;
        if references == 0 {
            orphaned.push(value.clone())
        }
        if let Some(path) = value.get("storagePath").and_then(Value::as_str) {
            if !Path::new(path).exists() {
                broken.push(value)
            }
        }
    }
    Ok(
        json!({ "previewOnly":true,"orphaned":orphaned,"brokenReferences":broken,"automaticDeletion":false }),
    )
}

#[tauri::command]
pub fn learning_object_store_collect_native(
    object_ids: Vec<String>,
    confirmed: bool,
    state: State<'_, LearningDatabase>,
) -> Result<Value, String> {
    if !confirmed {
        return Err("La limpieza exige confirmación tras previsualizar consecuencias.".to_string());
    }
    let root = object_root(&state.path)?;
    fs::create_dir_all(&root)
        .map_err(|error| format!("No se pudo preparar el almacén: {error}"))?;
    let root_canonical = root
        .canonicalize()
        .map_err(|error| format!("No se pudo validar el almacén: {error}"))?;
    let connection = state
        .connection
        .lock()
        .map_err(|_| "SQLite learning quedó bloqueado.".to_string())?;
    let transaction = connection
        .unchecked_transaction()
        .map_err(|error| format!("No se pudo iniciar GC: {error}"))?;
    let mut removed = Vec::new();
    for id in object_ids {
        let references: i64 = transaction
            .query_row(
                "SELECT COUNT(*) FROM object_store_references WHERE object_id=?1",
                params![id],
                |row| row.get(0),
            )
            .map_err(|error| format!("No se pudo contar referencias: {error}"))?;
        if references > 0 {
            return Err(format!(
                "El objeto {id} conserva {references} referencias y no puede eliminarse."
            ));
        }
        let raw: String = transaction
            .query_row(
                "SELECT payload FROM object_store_objects WHERE id=?1 AND state <> 'deleted'",
                params![id],
                |row| row.get(0),
            )
            .map_err(|error| format!("Objeto no elegible para GC: {error}"))?;
        let mut value: Value =
            serde_json::from_str(&raw).map_err(|error| format!("Objeto corrupto: {error}"))?;
        let path = PathBuf::from(required_text(&value, "storagePath")?);
        if path.exists() {
            let canonical = path
                .canonicalize()
                .map_err(|error| format!("No se pudo validar ruta de GC: {error}"))?;
            if !canonical.starts_with(&root_canonical) {
                return Err("GC rechazó una ruta fuera del almacén.".to_string());
            }
            if file_hash(&canonical)? != required_text(&value, "sha256")? {
                return Err(format!("GC rechazó {id}: SHA-256 distinto."));
            }
            fs::remove_file(&canonical)
                .map_err(|error| format!("No se pudo eliminar objeto huérfano: {error}"))?;
        }
        value["state"] = Value::String("deleted".to_string());
        value["updatedAt"] = Value::String(Utc::now().to_rfc3339());
        transaction.execute("UPDATE object_store_objects SET state='deleted',updated_at=?2,payload=?3 WHERE id=?1",params![id,value["updatedAt"].as_str(),serde_json::to_string(&value).map_err(|error| error.to_string())?]).map_err(|error| format!("No se pudo registrar GC: {error}"))?;
        removed.push(id);
    }
    transaction
        .commit()
        .map_err(|error| format!("No se pudo confirmar GC: {error}"))?;
    Ok(json!({"removedObjectIds":removed,"verifiedMissingAfterRemoval":true}))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::learning_db::initialize_learning_database;
    use tempfile::tempdir;

    #[test]
    fn record_type_whitelist_rejects_sql_identifiers() {
        assert!(table_for("physical_specimens").is_some());
        assert!(table_for("physical_specimens; DROP TABLE learning_profiles").is_none());
    }

    #[test]
    fn supported_image_formats_are_detected_from_content() {
        let directory = tempdir().unwrap();
        for (name, format) in [
            ("sample.jpg", ImageFormat::Jpeg),
            ("sample.png", ImageFormat::Png),
            ("sample.webp", ImageFormat::WebP),
        ] {
            let path = directory.path().join(name);
            DynamicImage::new_rgb8(8, 8)
                .save_with_format(&path, format)
                .unwrap();
            let (_, detected, _, _) = image_format(&path).unwrap();
            assert_eq!(detected, format);
        }
    }

    #[test]
    fn full_metrology_backup_copies_and_previews_verified_objects() {
        let directory = tempdir().unwrap();
        let database_path = directory.path().join("learning.sqlite3");
        let backup_dir = directory.path().join("backups");
        let package_dir = directory.path().join("packages");
        let mut connection = Connection::open(&database_path).unwrap();
        initialize_learning_database(&mut connection, &database_path, &backup_dir).unwrap();
        let database = LearningDatabase { connection: Mutex::new(connection), path: database_path.clone(), backup_dir: backup_dir.clone(), package_dir };
        let root = object_root(&database_path).unwrap();
        let object_path = root.join("objects").join("ab").join("sample.bin");
        fs::create_dir_all(object_path.parent().unwrap()).unwrap();
        fs::write(&object_path, b"immutable-photo-bytes").unwrap();
        let hash = file_hash(&object_path).unwrap();
        let timestamp = Utc::now().to_rfc3339();
        let object = json!({
            "schemaVersion":1,"id":"metrology.object.test","profileId":"profile.test","sha256":hash,
            "bytes":21,"mediaType":"application/octet-stream","originalName":"sample.bin","importedAt":timestamp,
            "ownerProfileId":"profile.test","privacy":"private","state":"ready","kind":"evidence",
            "storagePath":object_path,"immutable":true,"createdAt":timestamp,"updatedAt":timestamp,"recordVersion":1
        });
        let result = {
            let connection = database.connection.lock().unwrap();
            put_record(&connection, "object_store_objects", &object).unwrap();
            build_metrology_backup(&connection, &database, true).unwrap()
        };
        assert_eq!(result["objectCount"], 1);
        assert_eq!(result["omittedObjectCount"], 0);
        let id = result.pointer("/backup/id").and_then(Value::as_str).unwrap();
        let preview = metrology_restore_preview(id, &database).unwrap();
        assert_eq!(preview["restorableObjectIds"].as_array().unwrap().len(), 1);
        assert!(preview["missingOrCorruptObjectIds"].as_array().unwrap().is_empty());
    }
}

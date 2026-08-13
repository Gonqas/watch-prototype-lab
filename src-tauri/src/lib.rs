use std::{
    collections::VecDeque,
    fs,
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    process::{Child, ChildStdin, Command, Stdio},
    sync::{
        atomic::{AtomicBool, AtomicU32, Ordering},
        mpsc::{self, Receiver, RecvTimeoutError},
        Arc, Mutex,
    },
    thread,
    time::{Duration, Instant},
};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

use chrono::Utc;
use rusqlite::{params, Connection};
use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager, State};

mod learning_db;
mod metrology;

use learning_db::{
    initialize_learning_database, learning_commit_binary_native, learning_create_backup_native,
    learning_database_info_native, learning_delete_backup_native, learning_list_backups_native,
    learning_read_binary_native, learning_remove_binary_native, learning_replace_snapshot_native,
    learning_restore_backup_native, learning_rollback_binary_native, learning_snapshot_native,
    learning_stage_binary_native, LearningDatabase,
};
use metrology::{
    learning_cancel_image_import_native, learning_create_metrology_backup_native,
    learning_import_image_native, learning_metrology_get_native, learning_metrology_list_native,
    learning_metrology_put_native, learning_object_store_collect_native,
    learning_object_store_gc_preview_native, learning_preview_metrology_restore_native,
    learning_remove_object_reference_native, learning_restore_metrology_backup_native,
    recover_object_store_staging, MetrologyImportState,
};

struct DatabaseState {
    connection: Mutex<Connection>,
    path: PathBuf,
}

struct CadProcess {
    child: Child,
    stdin: ChildStdin,
    stdout: Receiver<String>,
    stderr: Arc<Mutex<BoundedCadOutput>>,
}

const CAD_REQUEST_TIMEOUT: Duration = Duration::from_secs(120);
const CAD_IO_POLL_INTERVAL: Duration = Duration::from_millis(100);
const CAD_STDERR_MAX_BYTES: usize = 16 * 1024;
const CAD_STDERR_MAX_LINE_BYTES: usize = 1024;

#[derive(Default)]
struct BoundedCadOutput {
    lines: VecDeque<String>,
    bytes: usize,
}

impl BoundedCadOutput {
    fn push(&mut self, line: String) {
        let bounded: String = line
            .trim()
            .chars()
            .take(CAD_STDERR_MAX_LINE_BYTES)
            .collect();
        self.bytes += bounded.len();
        self.lines.push_back(bounded);
        while self.bytes > CAD_STDERR_MAX_BYTES {
            let Some(removed) = self.lines.pop_front() else {
                break;
            };
            self.bytes = self.bytes.saturating_sub(removed.len());
        }
    }

    fn tail(&self) -> String {
        self.lines.iter().cloned().collect::<Vec<_>>().join(" | ")
    }
}

impl Drop for CadProcess {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

struct CadEngineState {
    process: Arc<Mutex<Option<CadProcess>>>,
    process_id: Arc<AtomicU32>,
    cancel_requested: Arc<AtomicBool>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectSummary {
    id: String,
    name: String,
    movement: String,
    modified_at: String,
    schema_version: i64,
}

fn text_field<'a>(value: &'a Value, path: &[&str], fallback: &'a str) -> &'a str {
    let mut current = value;
    for key in path {
        let Some(next) = current.get(key) else {
            return fallback;
        };
        current = next;
    }
    current.as_str().unwrap_or(fallback)
}

fn initialize_database(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA foreign_keys=ON;
             CREATE TABLE IF NOT EXISTS projects (
               id TEXT PRIMARY KEY,
               name TEXT NOT NULL,
               movement TEXT NOT NULL,
               modified_at TEXT NOT NULL,
               schema_version INTEGER NOT NULL,
               payload TEXT NOT NULL
             );
             CREATE INDEX IF NOT EXISTS projects_modified_idx ON projects(modified_at DESC);
             CREATE TABLE IF NOT EXISTS parts (
               id TEXT PRIMARY KEY,
               name TEXT NOT NULL,
               kind TEXT NOT NULL,
               modified_at TEXT NOT NULL,
               payload TEXT NOT NULL
             );
             CREATE INDEX IF NOT EXISTS parts_modified_idx ON parts(modified_at DESC);",
        )
        .map_err(|error| format!("No se pudo inicializar SQLite: {error}"))
}

#[tauri::command]
fn native_info(app: AppHandle, state: State<'_, DatabaseState>) -> Result<Value, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("No se pudo resolver app_data: {error}"))?;
    Ok(json!({
        "native": true,
        "appVersion": app.package_info().version.to_string(),
        "platform": std::env::consts::OS,
        "architecture": std::env::consts::ARCH,
        "databasePath": state.path,
        "dataDirectory": data_dir,
    }))
}

#[tauri::command]
fn save_project_native(project: Value, state: State<'_, DatabaseState>) -> Result<(), String> {
    let id = text_field(&project, &["id"], "");
    if id.is_empty() {
        return Err("El proyecto no tiene id".into());
    }
    let name = text_field(&project, &["name"], "Sin nombre");
    let movement = text_field(
        &project,
        &["movement", "name"],
        "Movimiento sin identificar",
    );
    let modified_at = text_field(&project, &["modifiedAt"], "");
    let modified_at = if modified_at.is_empty() {
        Utc::now().to_rfc3339()
    } else {
        modified_at.to_owned()
    };
    let schema_version = project
        .get("schemaVersion")
        .and_then(Value::as_i64)
        .unwrap_or(5);
    let payload = serde_json::to_string(&project)
        .map_err(|error| format!("No se pudo serializar el proyecto: {error}"))?;
    let connection = state
        .connection
        .lock()
        .map_err(|_| "La biblioteca local esta bloqueada".to_string())?;
    connection
        .execute(
            "INSERT INTO projects(id, name, movement, modified_at, schema_version, payload)
             VALUES(?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
               name=excluded.name,
               movement=excluded.movement,
               modified_at=excluded.modified_at,
               schema_version=excluded.schema_version,
               payload=excluded.payload",
            params![id, name, movement, modified_at, schema_version, payload],
        )
        .map_err(|error| format!("No se pudo guardar el proyecto: {error}"))?;
    Ok(())
}

#[tauri::command]
fn list_projects_native(state: State<'_, DatabaseState>) -> Result<Vec<ProjectSummary>, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "La biblioteca local esta bloqueada".to_string())?;
    let mut statement = connection
        .prepare(
            "SELECT id, name, movement, modified_at, schema_version
             FROM projects ORDER BY modified_at DESC",
        )
        .map_err(|error| format!("No se pudo consultar la biblioteca: {error}"))?;
    let rows = statement
        .query_map([], |row| {
            Ok(ProjectSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                movement: row.get(2)?,
                modified_at: row.get(3)?,
                schema_version: row.get(4)?,
            })
        })
        .map_err(|error| format!("No se pudo leer la biblioteca: {error}"))?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("No se pudo materializar la biblioteca: {error}"))
}

#[tauri::command]
fn load_project_native(
    id: String,
    state: State<'_, DatabaseState>,
) -> Result<Option<Value>, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "La biblioteca local esta bloqueada".to_string())?;
    let mut statement = connection
        .prepare("SELECT payload FROM projects WHERE id=?1")
        .map_err(|error| format!("No se pudo preparar la lectura: {error}"))?;
    let mut rows = statement
        .query(params![id])
        .map_err(|error| format!("No se pudo leer el proyecto: {error}"))?;
    let Some(row) = rows
        .next()
        .map_err(|error| format!("No se pudo avanzar la lectura: {error}"))?
    else {
        return Ok(None);
    };
    let payload: String = row
        .get(0)
        .map_err(|error| format!("Payload de proyecto invalido: {error}"))?;
    serde_json::from_str(&payload)
        .map(Some)
        .map_err(|error| format!("JSON de proyecto invalido: {error}"))
}

#[tauri::command]
fn delete_project_native(id: String, state: State<'_, DatabaseState>) -> Result<(), String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "La biblioteca local esta bloqueada".to_string())?;
    connection
        .execute("DELETE FROM projects WHERE id=?1", params![id])
        .map_err(|error| format!("No se pudo eliminar el proyecto: {error}"))?;
    Ok(())
}

#[tauri::command]
fn save_part_native(preset: Value, state: State<'_, DatabaseState>) -> Result<(), String> {
    let id = text_field(&preset, &["id"], "");
    if id.is_empty() {
        return Err("La pieza no tiene id".into());
    }
    let name = text_field(&preset, &["name"], "Pieza sin nombre");
    let kind = text_field(&preset, &["kind"], "unknown");
    let modified_at = text_field(&preset, &["modifiedAt"], "");
    let modified_at = if modified_at.is_empty() {
        Utc::now().to_rfc3339()
    } else {
        modified_at.to_owned()
    };
    let payload = serde_json::to_string(&preset)
        .map_err(|error| format!("No se pudo serializar la pieza: {error}"))?;
    let connection = state
        .connection
        .lock()
        .map_err(|_| "La biblioteca de piezas esta bloqueada".to_string())?;
    connection
        .execute(
            "INSERT INTO parts(id, name, kind, modified_at, payload)
             VALUES(?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(id) DO UPDATE SET
               name=excluded.name,
               kind=excluded.kind,
               modified_at=excluded.modified_at,
               payload=excluded.payload",
            params![id, name, kind, modified_at, payload],
        )
        .map_err(|error| format!("No se pudo guardar la pieza: {error}"))?;
    Ok(())
}

#[tauri::command]
fn list_parts_native(state: State<'_, DatabaseState>) -> Result<Vec<Value>, String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "La biblioteca de piezas esta bloqueada".to_string())?;
    let mut statement = connection
        .prepare("SELECT payload FROM parts ORDER BY modified_at DESC")
        .map_err(|error| format!("No se pudo consultar la biblioteca de piezas: {error}"))?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| format!("No se pudo leer la biblioteca de piezas: {error}"))?;
    rows.map(|row| {
        let payload = row.map_err(|error| format!("Pieza local invalida: {error}"))?;
        serde_json::from_str::<Value>(&payload)
            .map_err(|error| format!("JSON de pieza invalido: {error}"))
    })
    .collect()
}

#[tauri::command]
fn delete_part_native(id: String, state: State<'_, DatabaseState>) -> Result<(), String> {
    let connection = state
        .connection
        .lock()
        .map_err(|_| "La biblioteca de piezas esta bloqueada".to_string())?;
    connection
        .execute("DELETE FROM parts WHERE id=?1", params![id])
        .map_err(|error| format!("No se pudo eliminar la pieza: {error}"))?;
    Ok(())
}

fn executable_candidates(app: &AppHandle) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Ok(current) = std::env::current_exe() {
        if let Some(parent) = current.parent() {
            candidates.push(parent.join("watchlab-cad.exe"));
            candidates.push(parent.join("binaries").join("watchlab-cad.exe"));
        }
    }
    if let Ok(resources) = app.path().resource_dir() {
        candidates.push(resources.join("watchlab-cad.exe"));
        candidates.push(resources.join("binaries").join("watchlab-cad.exe"));
        candidates.push(resources.join("cad-engine").join("watchlab-cad.exe"));
    }
    candidates
}

fn start_engine_process(app: &AppHandle, process_id: &AtomicU32) -> Result<CadProcess, String> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let project_root = manifest_dir.parent().unwrap_or(Path::new("."));
    let dev_python = project_root
        .join(".venv-cad")
        .join("Scripts")
        .join("python.exe");
    let cad_dir = project_root.join("cad-engine");
    let mut command = if cfg!(debug_assertions) && dev_python.exists() && cad_dir.exists() {
        let mut command = Command::new(dev_python);
        command.args(["-m", "watchlab_cad.main", "--stdio"]);
        command.current_dir(cad_dir);
        command
    } else {
        let executable = executable_candidates(app)
            .into_iter()
            .find(|path| path.exists())
            .ok_or_else(|| "No se encontro el motor CAD local".to_string())?;
        let mut command = Command::new(executable);
        command.arg("--stdio");
        command
    };
    let mut child = command
        .creation_flags({
            #[cfg(windows)]
            {
                0x08000000
            }
            #[cfg(not(windows))]
            {
                0
            }
        })
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("No se pudo iniciar el motor CAD: {error}"))?;
    process_id.store(child.id(), Ordering::SeqCst);
    let stdin = child
        .stdin
        .take()
        .ok_or_else(|| "No se pudo abrir stdin del motor CAD".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "No se pudo abrir stdout del motor CAD".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "No se pudo abrir stderr del motor CAD".to_string())?;
    let (stdout_sender, stdout_receiver) = mpsc::channel();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let Ok(line) = line else { break };
            if stdout_sender.send(line).is_err() {
                break;
            }
        }
    });
    let stderr_buffer = Arc::new(Mutex::new(BoundedCadOutput::default()));
    let stderr_writer = stderr_buffer.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            let Ok(line) = line else { break };
            if let Ok(mut buffer) = stderr_writer.lock() {
                buffer.push(line)
            }
        }
    });
    Ok(CadProcess {
        child,
        stdin,
        stdout: stdout_receiver,
        stderr: stderr_buffer,
    })
}

fn cad_stderr_tail(process: &CadProcess) -> String {
    process
        .stderr
        .lock()
        .map(|buffer| buffer.tail())
        .unwrap_or_default()
}

fn execute_engine_request(
    process: &mut CadProcess,
    request: &Value,
    cancel_requested: &AtomicBool,
) -> Result<Value, String> {
    let encoded =
        serde_json::to_vec(request).map_err(|error| format!("Peticion CAD invalida: {error}"))?;
    process
        .stdin
        .write_all(&encoded)
        .and_then(|_| process.stdin.write_all(b"\n"))
        .and_then(|_| process.stdin.flush())
        .map_err(|error| format!("No se pudo enviar el proyecto al motor CAD: {error}"))?;
    let started_at = Instant::now();
    let mut lines_seen = 0usize;
    while lines_seen < 256 {
        if cancel_requested.load(Ordering::SeqCst) {
            return Err("Trabajo CAD cancelado por el usuario".to_string());
        }
        if started_at.elapsed() >= CAD_REQUEST_TIMEOUT {
            let detail = cad_stderr_tail(process);
            return Err(if detail.is_empty() {
                "El motor CAD supero el tiempo maximo de 120 segundos y fue detenido".to_string()
            } else {
                format!("El motor CAD supero el tiempo maximo de 120 segundos. Detalle acotado: {detail}")
            });
        }
        match process.stdout.recv_timeout(CAD_IO_POLL_INTERVAL) {
            Ok(line) => {
                lines_seen += 1;
                if let Ok(value) = serde_json::from_str::<Value>(line.trim()) {
                    if value.get("ok").is_some() {
                        return Ok(value);
                    }
                }
            }
            Err(RecvTimeoutError::Timeout) => continue,
            Err(RecvTimeoutError::Disconnected) => {
                let detail = cad_stderr_tail(process);
                return Err(if detail.is_empty() {
                    "El motor CAD se cerro sin responder".to_string()
                } else {
                    format!("El motor CAD se cerro sin responder. Detalle acotado: {detail}")
                });
            }
        }
    }
    Err("El motor CAD produjo demasiada salida sin una respuesta de protocolo".to_string())
}

fn run_engine_process(
    app: &AppHandle,
    process_state: &Arc<Mutex<Option<CadProcess>>>,
    process_id: &AtomicU32,
    cancel_requested: &AtomicBool,
    request: &Value,
) -> Result<Value, String> {
    let mut guard = process_state
        .lock()
        .map_err(|_| "El proceso CAD esta bloqueado".to_string())?;
    for attempt in 0..2 {
        if guard.is_none() {
            *guard = Some(start_engine_process(app, process_id)?);
        }
        let result = execute_engine_request(
            guard
                .as_mut()
                .ok_or_else(|| "Motor CAD no disponible".to_string())?,
            request,
            cancel_requested,
        );
        match result {
            Ok(value) => return Ok(value),
            Err(_) if cancel_requested.load(Ordering::SeqCst) => {
                guard.take();
                process_id.store(0, Ordering::SeqCst);
                return Err("Trabajo CAD cancelado por el usuario".to_string());
            }
            Err(error) if error.contains("tiempo maximo") => {
                guard.take();
                process_id.store(0, Ordering::SeqCst);
                return Err(error);
            }
            Err(error) if attempt == 0 => {
                guard.take();
                process_id.store(0, Ordering::SeqCst);
                if error.contains("Peticion CAD invalida") {
                    return Err(error);
                }
            }
            Err(error) => return Err(error),
        }
    }
    Err("No se pudo reiniciar el motor CAD".to_string())
}

#[tauri::command]
async fn run_cad_native(
    app: AppHandle,
    state: State<'_, CadEngineState>,
    request: Value,
) -> Result<Value, String> {
    let process = state.process.clone();
    let process_id = state.process_id.clone();
    let cancel_requested = state.cancel_requested.clone();
    cancel_requested.store(false, Ordering::SeqCst);
    tauri::async_runtime::spawn_blocking(move || {
        run_engine_process(&app, &process, &process_id, &cancel_requested, &request)
    })
    .await
    .map_err(|error| format!("Trabajo CAD cancelado: {error}"))?
}

#[tauri::command]
fn cancel_cad_native(state: State<'_, CadEngineState>) -> Result<bool, String> {
    state.cancel_requested.store(true, Ordering::SeqCst);
    let pid = state.process_id.load(Ordering::SeqCst);
    if pid == 0 {
        return Ok(false);
    }
    #[cfg(windows)]
    let status = Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/T", "/F"])
        .creation_flags(0x08000000)
        .status();
    #[cfg(not(windows))]
    let status = Command::new("kill")
        .args(["-TERM", &pid.to_string()])
        .status();
    status
        .map(|result| result.success())
        .map_err(|error| format!("No se pudo cancelar el motor CAD: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|error| format!("No se pudo resolver app_data: {error}"))?;
            fs::create_dir_all(&data_dir)?;
            let database_path = data_dir.join("watchlab.sqlite3");
            let connection = Connection::open(&database_path)?;
            initialize_database(&connection).map_err(std::io::Error::other)?;
            app.manage(DatabaseState {
                connection: Mutex::new(connection),
                path: database_path,
            });
            let learning_database_path = data_dir.join("learning.sqlite3");
            let learning_backup_dir = data_dir.join("learning-backups");
            let learning_package_dir = data_dir.join("learning-packages");
            fs::create_dir_all(&learning_backup_dir)?;
            fs::create_dir_all(&learning_package_dir)?;
            let mut learning_connection = Connection::open(&learning_database_path)?;
            initialize_learning_database(
                &mut learning_connection,
                &learning_database_path,
                &learning_backup_dir,
            )
            .map_err(std::io::Error::other)?;
            recover_object_store_staging(&learning_database_path).map_err(std::io::Error::other)?;
            app.manage(LearningDatabase {
                connection: Mutex::new(learning_connection),
                path: learning_database_path,
                backup_dir: learning_backup_dir,
                package_dir: learning_package_dir,
            });
            app.manage(MetrologyImportState::new());
            app.manage(CadEngineState {
                process: Arc::new(Mutex::new(None)),
                process_id: Arc::new(AtomicU32::new(0)),
                cancel_requested: Arc::new(AtomicBool::new(false)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            native_info,
            save_project_native,
            list_projects_native,
            load_project_native,
            delete_project_native,
            save_part_native,
            list_parts_native,
            delete_part_native,
            run_cad_native,
            cancel_cad_native,
            learning_database_info_native,
            learning_snapshot_native,
            learning_replace_snapshot_native,
            learning_create_backup_native,
            learning_list_backups_native,
            learning_restore_backup_native,
            learning_delete_backup_native,
            learning_stage_binary_native,
            learning_commit_binary_native,
            learning_rollback_binary_native,
            learning_read_binary_native,
            learning_remove_binary_native,
            learning_metrology_put_native,
            learning_metrology_get_native,
            learning_metrology_list_native,
            learning_import_image_native,
            learning_cancel_image_import_native,
            learning_remove_object_reference_native,
            learning_object_store_gc_preview_native,
            learning_object_store_collect_native,
            learning_create_metrology_backup_native,
            learning_preview_metrology_restore_native,
            learning_restore_metrology_backup_native,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Watch Prototype Lab");
}

#[cfg(test)]
mod cad_runtime_tests {
    use super::*;

    #[test]
    fn stderr_buffer_remains_bounded_and_keeps_the_tail() {
        let mut output = BoundedCadOutput::default();
        for index in 0..100 {
            output.push(format!("diagnostic-{index}-{}", "x".repeat(900)));
        }
        assert!(output.bytes <= CAD_STDERR_MAX_BYTES);
        assert!(output.tail().contains("diagnostic-99"));
        assert!(!output.tail().contains("diagnostic-0-"));
    }
}

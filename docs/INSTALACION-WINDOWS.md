# Instalación en Windows

## Para quien va a usar la aplicación

1. Abre el archivo `WatchPrototypeLab-Instalador-Windows-x64-v<versión>.exe` de la carpeta `release/`.
2. Windows instalará Watch Prototype Lab para tu usuario, sin pedir permisos de administrador.
3. Al terminar podrás abrirlo desde el menú Inicio, dentro de **Watch Prototype Lab**.
4. La desinstalación está disponible en **Configuración > Aplicaciones > Aplicaciones instaladas**.

El instalador selecciona español o inglés según el idioma de Windows. Si WebView2 no está disponible o está desactualizado, lo descarga de forma silenciosa durante la instalación; para ese caso se necesita conexión a Internet.

Windows SmartScreen puede mostrar un aviso mientras el ejecutable no tenga una firma de código comercial. El hash SHA-256 publicado junto al instalador permite comprobar que el archivo no ha cambiado, pero no sustituye una firma digital.

## Para generar una versión nueva

Desde PowerShell, en la raíz del proyecto:

```powershell
npm run installer
```

El proceso comprueba que las versiones Web, Rust y Tauri coinciden, valida dependencias, empaqueta el motor CAD si falta, ejecuta lint, pruebas y build, genera el NSIS y copia el resultado con un nombre claro a `release/`. También crea el hash, un manifiesto de entrega y una guía de instalación lista para acompañar al ejecutable.

Para repetir únicamente el empaquetado cuando la revisión completa ya se ha ejecutado:

```powershell
npm run installer:fast
```

La publicación pública debería añadir firma Authenticode con sello de tiempo. Es el paso pendiente para eliminar el aviso de editor desconocido y asegurar la cadena de confianza del instalador.

## Academia completa para diseño propio (0.9.0)

La versión 0.9.0 añade 18 unidades de teoría y práctica sobre fabricación/acabados, ruta de diseño propio y validación. El contenido funciona localmente y conserva progreso, respuestas y evidencias. La aplicación prepara procesos y revisiones, pero la fabricación, la seguridad de taller y la competencia manual requieren práctica física supervisada.

## Claridad y lectura (0.9.1)

La versión 0.9.1 conserva todo el contenido de 0.9.0 y reorganiza la Academia para separar acción, estudio y detalle técnico. Las lecciones abren en Teoría, las prácticas mantienen visible el siguiente paso y las fuentes, límites e identificadores siguen disponibles bajo demanda.

## Datos de inspección y metrología (desde 0.8.0)

La versión 0.8.0 incorpora el Sistema 5A: registro privado de unidades físicas, fotografías inmutables, inspecciones, instrumentos, series de medida, comparaciones y propuestas de corrección reversibles. En Desktop, crea un **backup completo** desde **Academia > Metrología > Protección, backup y restauración** antes de cambiar de equipo o restaurar datos.

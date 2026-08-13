# Comparación antes/después de Watchmaking Academy

## Cambio de producto

| Área | Antes | Después |
|---|---|---|
| Contexto | Aprender era una superficie técnica | Estudio y Academia son contextos hermanos |
| Inicio | Demo y datos técnicos dominaban | Continuar, próximo paso, repaso y rutas reales |
| Currículo | Lista extensa de actividades | Explorar por ruta, módulo, movimiento y competencia |
| Ruta | Listas de IDs | Progresión editorial con propósito, tiempo, fuentes y fidelidad |
| Lección | Puente hacia actividades | Lector con cinco modos, fuentes, notas y glosario |
| Workspace | Tres columnas y labs superpuestos | Paneles adaptables; labs en flujo; viewport principal |
| Práctica | Acceso disperso | Taller con 86 prácticas derivadas |
| Consulta | Sin Atlas global | Cuatro fixtures, piezas, relaciones y procedencia |
| Progreso | Proyecciones correctas, lectura técnica | Ruta, competencia, movimiento, subsistema e historial |
| Repaso | Motor sin superficie | Cola determinista y explicable |
| Búsqueda | Búsquedas aisladas | Índice educativo local y contextual |
| Estudio personal | Sin Cuaderno | Notas, marcadores y capturas locales |
| Responsive | Navegaciones y columnas comprimidas | Navegación compacta, drawers y una columna |
| Rendimiento | `LearningArea` monolítico, 2,27 MB | `LearningArea` 237 kB y superficies separadas |

## Capturas anteriores

- [Inicio, escritorio](screenshots/before-home-desktop.png)
- [Explorar, escritorio](screenshots/before-explorer-desktop.png)
- [Ruta MIYOTA 8215, escritorio](screenshots/before-route-8215-desktop.png)
- [Progreso, escritorio](screenshots/before-progress-desktop.png)
- [Inicio, ventana estrecha](screenshots/before-home-narrow.png)

## Capturas posteriores

- [Inicio, escritorio](screenshots/after-home-desktop.png)
- [Ruta MIYOTA 8215, escritorio](screenshots/after-route-8215-desktop.png)
- [Lección MIYOTA 8215, escritorio](screenshots/after-lesson-8215-desktop.png)
- [Workspace 2035 real, escritorio](screenshots/after-workspace-2035-desktop.png)
- [Taller virtual, escritorio](screenshots/after-workshop-desktop.png)
- [Atlas MIYOTA 8215, escritorio](screenshots/after-atlas-8215-desktop.png)
- [Progreso, escritorio](screenshots/after-progress-desktop.png)
- [Preferencias, escritorio](screenshots/after-preferences-desktop.png)
- [Harness de QA, escritorio](screenshots/after-harness-desktop.png)
- [Inicio, ventana estrecha](screenshots/after-home-narrow.png)
- [Lección MIYOTA 8215, ventana estrecha](screenshots/after-lesson-8215-narrow.png)

## Evaluación heurística experta

Escala: 1 = problema grave; 5 = sólido. No es investigación con usuarios.

| Heurística | Antes | Después | Evidencia |
|---|---:|---:|---|
| Visibilidad del estado | 3 | 4 | contexto, estado local/offline, sesión y checkpoint |
| Correspondencia con la tarea | 2 | 4 | rutas, Taller, Atlas y sesión humanizados |
| Control y recuperación | 3 | 5 | guardar/salir, reanudar explícito, restore y preferencias |
| Consistencia | 3 | 4 | shell, tokens, estados y acciones primarias |
| Prevención de errores | 4 | 4 | preflight y dependencias conservados |
| Reconocimiento frente a recuerdo | 2 | 4 | navegación poco profunda, búsqueda y panel contextual |
| Flexibilidad | 2 | 5 | cinco modos, densidad, ancho y paneles |
| Estética funcional | 2 | 4 | jerarquía adulta y viewport sin overlays |
| Ayuda y recuperación de error | 3 | 4 | límites de error, recovery y harness |
| Carga cognitiva | 2 | 4 | IDs ocultos, detalle progresivo y jerarquía |
| Accesibilidad práctica | 3 | 4 | textual, no-drag, reduced motion y narrow |
| Progresión pedagógica | 3 | 4 | ruta/módulo/lección/actividad/progreso conectados |
| **Media** | **2,7** | **4,2** | evaluación experta local |

## Límites de la comparación

- No se realizaron tests con usuarios.
- La revisión Web fue manual asistida por DOM y capturas.
- Desktop se validó mediante build y arranque de 8 segundos; no mediante auditoría visual completa.
- NVDA/JAWS, instalación en máquina Windows limpia y firma comercial permanecen pendientes.

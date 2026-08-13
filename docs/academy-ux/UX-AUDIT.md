# Auditoría UX previa de Watchmaking Academy

Fecha: 2026-07-27  
Base aprobada: Sistemas 0–4F  
Estado auditado: antes del primer cambio de código de producción de Sistema 4UX

## Alcance inspeccionado

Se revisaron los contratos y las implementaciones de Sistemas 0–4F, el kit de autoría, el blueprint editorial, los cuatro paquetes relojeros integrados, navegación, producto, persistencia, recomendaciones, evaluación, banco, laboratorios, fixtures, viewport, responsive, accesibilidad y el instalador.

El inventario ejecutable previo contiene:

| Conjunto | Rutas | Módulos | Lecciones | Actividades | Glosario | Fuentes |
|---|---:|---:|---:|---:|---:|---:|
| Mapa funcional | 1 | 1 | 6 | 10 | 36 | 12 |
| MIYOTA 2035 | 1 | 10 | 10 | 20 | 15 | 8 |
| Fundamentos mecánicos | 1 | 12 | 12 | 29 | 48 | 12 |
| MIYOTA 8215 | 1 | 15 | 15 | 37 | 56 | 12 |
| Total de curso real | 4 | 38 | 43 | 96 | 155 | 44 |

El catálogo añade una demostración contractual y un ejemplo de autoría. Ambos deben seguir disponibles para pruebas y compatibilidad, pero no deben dominar la experiencia de Academia.

## Hallazgos por superficie

### Shell y separación de producto

- El área tiene identidad propia, pero convive dentro de la navegación técnica como una sección más.
- La salida se expresa como “Volver al proyecto técnico”; no existe un conmutador de contexto Estudio/Academia.
- La barra de estado de ingeniería sigue visible en Academia y compite con la tarea educativa.
- La navegación lateral mezcla tareas primarias, administración, sesiones, historial y contenido al mismo nivel.
- El panel contextual permanente consume 300 px aunque muchas pantallas no lo necesitan.

### Inicio

- El inicio está conectado a sesiones, evidencias y recomendaciones reales.
- La tarjeta “ruta activa” está fijada a la demostración contractual, aunque existan cuatro cursos reales y progreso avanzado.
- La recomendación aparece duplicada en el contenido y en el panel contextual.
- IDs técnicos de actividades, reglas y competencias dominan la lectura.
- Falta una vista clara de “continuar”, ruta en curso, prácticas próximas y revisión debida.

### Explorador, rutas, módulos y lecciones

- El explorador lista las 98 actividades antes de ofrecer una lectura curricular clara.
- Los filtros de movimiento, familia, subsistema y competencia contienen opciones fijas del demo en vez de facetas derivadas del catálogo.
- Las rutas reales existen, pero la ficha lateral vierte listas largas de IDs.
- Los módulos y lecciones son navegables, aunque la lección es solo un puente hacia actividades; no existe lector, modos ni contexto editorial.
- Disponibilidad y prerrequisitos se muestran de forma optimista o técnica, sin una explicación humana compacta.

### Workspace y laboratorios

- El runtime, la restauración, la evidencia y las alternativas textuales son sólidos.
- El workspace usa tres columnas rígidas, más una cabecera y un dock con muchos controles simultáneos.
- Banco, laboratorio mecánico y laboratorio de calibre se posicionan sobre el viewport. El calibre puede cubrir hasta el 44 % superior y otros laboratorios hasta el 48 % inferior.
- Los paneles de laboratorio reutilizan el dominio real, pero su presentación es un panel técnico genérico con tipografía de 7–10 px.
- No hay modos de lección/actividad ni relación ajustable entre lectura, 3D y práctica.
- La futura zona de tutor ocupa atención aunque el tutor todavía no existe.

### Taller virtual y Atlas

- Banco, herramientas, bandejas, inspección, grafos, 33 instancias 2035, 63 instancias 8215 y laboratorios conceptuales ya existen.
- No existe una entrada de producto que organice esas prácticas por banco, calibre, subsistema, nivel o tipo.
- Los cuatro fixtures técnicos tienen ledger, fuentes, G/K/P, R0–R4 y relaciones consultables, pero no existe un Atlas navegable.

### Progreso, revisión y resultados

- El producto persiste intentos, eventos, evidencias, evaluaciones explicables y mastery.
- La vista de progreso es precisa, pero expone competencias por ID y no las agrupa por ruta o práctica.
- No hay una cola de revisión/retención dedicada pese a que el motor ya distingue `demonstrated` y `retained`.
- Resultados explica reglas y evidencias, pero no prioriza una síntesis accionable: qué se hizo bien, qué practicar y cuándo volver.

### Búsqueda, glosario, fuentes y cuaderno

- Existen búsquedas aisladas en explorador, sesiones y mapa.
- No existe búsqueda educativa global sobre rutas, módulos, lecciones, actividades, piezas, términos, fuentes y notas.
- Los 155 registros de glosario y 44 referencias de fuentes reales están en los paquetes, pero no tienen superficies propias.
- No existe cuaderno local contextual.

### Onboarding y preferencias

- Ya existen perfiles locales y preferencias de accesibilidad, idioma, ritmo, profundidad, retención y exportación.
- No existe onboarding que conecte experiencia previa, objetivos, duración preferida y primera recomendación.
- Varias preferencias educativas se almacenan como JSON libre, sin contrato UX versionado.

### Responsive y accesibilidad

- Hay skip link, foco visible, controles semánticos, alternativa sin arrastre, reduced motion y breakpoints a 1260/1000/720 px.
- A 700 px la navegación técnica y la navegación de Academia ocupan dos filas; el contenido queda comprimido y la barra técnica inferior permanece fija.
- Tablas administrativas dependen de scroll horizontal.
- El grafo visual usa posiciones fijas y obliga a un ancho mínimo de 700 px.
- Los tamaños de texto de 7–10 px en workspace y laboratorios son demasiado pequeños para una experiencia formativa cómoda.

## Evidencia visual “antes”

- `screenshots/before-home-desktop.png`
- `screenshots/before-explorer-desktop.png`
- `screenshots/before-route-8215-desktop.png`
- `screenshots/before-progress-desktop.png`
- `screenshots/before-home-narrow.png`

## Riesgos de migración

1. Romper deep links hash existentes al añadir nuevas superficies.
2. Confundir estado de interfaz con estado pedagógico persistido.
3. Duplicar contenido o fixtures para crear Taller/Atlas.
4. Mutar sesiones o progreso al generar estados de demostración.
5. Introducir métricas remotas o notas en exports sin consentimiento.
6. Elevar visualmente R2/G2/K2/P0 a una autoridad que no posee.
7. Empeorar el tiempo de carga añadiendo más código al chunk inicial de Academia.

## Criterio de intervención

Sistema 4UX conservará dominio, paquetes, IDs, sesiones, evidencias y URLs existentes. La transformación se realizará como una nueva capa de producto y presentación: shell, modelos de vista, superficies educativas, almacenamiento UX local versionado y adaptación del workspace. Taller y Atlas se derivarán de los contratos actuales; no se crearán cursos, piezas ni procedimientos nuevos.

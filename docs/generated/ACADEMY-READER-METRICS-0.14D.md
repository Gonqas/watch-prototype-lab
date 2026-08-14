# Métricas locales del lector 0.14D

El registro aditivo guarda un máximo de **2.500 eventos** por perfil, con rotación FIFO. Campos: eventId, sessionId, tipo, fecha, lessonId, sectionId, cueId, modo, viewport, origen/destino, transición, bucket de duración, completado, fuente y metadatos escalares tipados.

Eventos implementados: session-start/end, lesson-open/resume, section-enter, outline-open/jump, cue-view, visual-expand, source/glossary-open, mode-change, note/bookmark-created, explicit-completion, practice-transition, route-leave-incomplete, pagehide-incomplete y return-after-incomplete.

No guarda texto de notas, contenido, nombres personales ni URLs externas. No realiza peticiones de red. Preferencias permite exportar JSON, exportar CSV agregado y eliminar solo estos eventos. Los contadores agregados antiguos se conservan.

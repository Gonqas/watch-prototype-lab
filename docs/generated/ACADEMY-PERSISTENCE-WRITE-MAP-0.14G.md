# Mapa de escrituras de persistencia · 0.14G

| Escritor | Objetivo | Antes | Contrato 0.14G | Cierre |
|---|---|---|---|---|
| LearningProfileService.update | perfil, accesibilidad y preferencias | lectura seguida de escritura de snapshot completo | mutación funcional serializada por profileId | cola de perfil |
| LearningProfileService.updateEducationalPreferences | preferencias educativas | no existía como contrato funcional | merge sobre el valor más reciente | cola de perfil |
| LearningApplicationService.persistAcademyState | educationalPreferences.academyStateV1 | snapshot capturado por React | mergeAcademyLocalState dentro de mutación funcional | cambio de perfil, pagehide y shutdown |
| AcademyLocalStore | localStorage de Academia | escritura inmediata local | escritura inmediata con merge por entidad y tombstones | sin cola; fuente efectiva combinada |
| AcademyShell mirror | perfil persistente | debounce con preferencias capturadas | coalescencia de 300 ms y persistAcademyState | pagehide y desmontaje |
| Academy onboarding/preferences | idioma educativo y preferencias | update de objeto completo | actualización funcional independiente | cola de perfil |
| Learning accessibility controls | accesibilidad | podía competir con Academia | merge funcional conservando preferencias | cola de perfil |
| LearningApplicationService.markNotificationRead | notificación leída | snapshot potencialmente obsoleto | mutación funcional | cola de perfil |
| profile switch / shutdown | mutaciones pendientes | cierre sin barrera común | flush del perfil anterior o de todas las colas | explícito |

## Regla de propiedad

Cada perfil tiene una cola funcional. La mutación se reaplica al valor leído dentro de la transacción; no se conserva un snapshot del perfil como autoridad. El estado efectivo de Academia combina el registro inmediato del navegador con el espejo de perfil mediante identidad y fecha por entidad. No se registra contenido de notas en los diagnósticos.

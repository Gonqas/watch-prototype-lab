# Migración a Watchmaking Academy 4UX

## Principio

La migración es de presentación y preferencias, no de dominio educativo. No cambia los esquemas de sesiones, eventos, evidencias, evaluaciones, mastery, paquetes ni `WatchProject`.

## Compatibilidad

- todos los hash links existentes permanecen válidos;
- se añaden superficies nuevas sin renombrar las anteriores;
- los paquetes integrados conservan ID, versión y hash;
- las sesiones fijan las mismas versiones;
- IndexedDB y SQLite mantienen sus esquemas;
- el estado UX nuevo usa una clave local versionada y separada por perfil;
- notas y métricas son locales, privadas y excluidas de paquetes;
- `.wplab` no incorpora progreso ni estado de Academia;
- el cambio Estudio/Academia conserva la última ubicación educativa.

## Estado UX

`academy-local-state-v1` contiene:

- preferencias de shell y lector;
- finalización de onboarding;
- notas privadas;
- métricas locales agregadas y acotadas;
- versión y fecha de actualización.

Una lectura inválida vuelve a valores seguros sin borrar el payload original de aprendizaje. La migración nunca convierte datos pedagógicos ni toca el proyecto técnico.

## Deep links añadidos

- `#/learning/my-learning`
- `#/learning/workshop`
- `#/learning/atlas`
- `#/learning/review`
- `#/learning/search`
- `#/learning/notebook`
- `#/learning/glossary`
- `#/learning/sources`
- `#/learning/onboarding`

Los destinos previos siguen resolviendo como antes.

## Rollback

El checkpoint externo de 4F permite recuperar el estado previo. Eliminar únicamente la clave UX nueva restablece preferencias visuales y notas de 4UX, sin alterar sesiones, progreso o paquetes.

# Migraciones globales de la Academia — 0.14A.1

Estas causas se excluyen de la puntuación individual. No se cambia interfaz, navegación, campos ni módulos en esta fase.

| ID | Categoría | Entidades | Prevalencia | Método | Confianza | Recomendación |
|---|---|---:|---:|---|---|---|
| `migration.global.locale-placeholder-en` | locale-placeholder-duplicated | 222 | 100.0% | exact-match | high | hide-or-disable-en-until-real-translation |
| `migration.global.single-lesson-modules` | single-lesson-module | 216 | 99.5% | structural-rule | high | Review as a structural migration; do not merge or delete modules in 0.14A.1. |
| `migration.global.redundant-module-lesson-names` | redundant-names | 216 | 97.3% | exact-match | high | Resolve naming policy globally after navigation decisions; preserve current IDs and labels now. |

## Política de locale

- `localeStatus: placeholder-duplicated`
- `supportedLocaleActual: es`
- `recommendation: hide-or-disable-en-until-real-translation`

La recomendación se registra; no se oculta ni elimina todavía ningún campo.

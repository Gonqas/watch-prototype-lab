# Plantillas completas editables

Las versiones completas son los objetos ejecutables de `learning-content/example/`. Se mantienen allí —en vez de duplicarse— para que toda plantilla completa sea validada, empaquetada y ejecutada por la aplicación.

| Tipo | Plantilla completa |
| --- | --- |
| Curriculum | `../../example/curriculum/curriculum.authoring-example.json` |
| Learning path | `../../example/routes/route.authoring-first-package.json` |
| Module | `../../example/modules/module.authoring-traceable-scene.json` |
| Lesson + contrato visual | `../../example/lessons/lesson.authoring.traceability.json` |
| Concept | `../../example/concepts/concept.authoring.traceability.json` |
| Terminology entry | `../../example/glossary/term.authoring.selector.json` |
| Source reference | `../../example/sources/source.authoring.system-contracts.json` |
| Technical claim | `../../example/blocks/explanation.authoring.traceability.json` → `claims[0]` |
| Activity + ciclo pedagógico | `../../example/activities/activity.authoring.selector-walkthrough.json` |
| Question | `../../example/scenes/scene.authoring.selector-walkthrough.json` → `steps[0].questions[0]` |
| Exercise | `../../example/blocks/exercise.authoring.map-contracts.json` |
| Scene | `../../example/scenes/scene.authoring.selector-walkthrough.json` |
| Scene step | el mismo archivo → `steps[]` |
| Storyboard | el mismo archivo → `storyboard` |
| Competency | `../../example/competencies/competency.authoring.traceable-activity.json` |
| Evidence rule | `../../example/evidence/evidence.authoring.selection.json` |
| Rubric | `../../example/rubrics/rubric.authoring.traceable-activity.json` |
| Recommendation | `../../example/recommendations/recommendation.authoring.review-storyboard.json` |
| Visual resource | `../../example/visual-resources/visual.authoring.selector-scene.json` |
| Package manifest | `../../example/manifest.json` |

Para crear un paquete, copia `example/` completo, cambia primero el ID y la versión y sustituye sus entradas gradualmente. Ejecuta `npm run learning:validate` después de cada grupo de cambios.


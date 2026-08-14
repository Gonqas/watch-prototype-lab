# QA UX 0.14B.1

No se infiere calidad visual subjetiva de los tests. El harness se reutiliza para inspección DOM y responsive; las capturas son temporales y no se rastrean.

| Caso | Método/viewport | Aserción | Resultado |
|---|---|---|---|
| Teoría pendiente | unitario | exposureStatus=not-started; CTA Abrir lección | verificado |
| Teoría estudiada/práctica pendiente | unitario + DOM | CTA directo Practicar | verificado |
| Práctica en curso | unitario + DOM | CTA Retomar práctica | verificado |
| Mastery-check pendiente | unitario | masteryStatus=demonstration-due | verificado |
| Core disponible sin demostración | unitario | coreAvailableComplete=true; masteryStatus=not-assessed | verificado |
| Capítulo demostrado | unitario | masteryStatus=demonstrated | verificado |
| Retención pendiente | unitario | masteryStatus=retention-due | verificado |
| Capítulo retenido | unitario | masteryStatus=retained | verificado |
| P documentada | unitario | physicalEvidenceStatus=documented | verificado |
| P revisada sin retención | unitario | physicalEvidenceStatus=reviewed; masteryStatus!=retained | verificado |
| Etapa 5 parcial | DOM 1440x1000 | etiqueta explícita de cobertura parcial | verificado |
| Final disponible | unitario | available-path-complete con cobertura pendiente | verificado |
| Inicio/Contexto | contrato fuente + DOM | mismo actionId | verificado |
| Perfil en-US | unitario + DOM | preferencia conservada; español efectivo | verificado |
| Práctica curada no primera | unitario | guided-disassembly abre activity.miyota8215.guided-disassembly | verificado |
| Dos actividades | fixture unitario | orden explícito preservado | verificado |
| Sin actividad | fixture unitario | step válido y continuación por nextAction | verificado |

## Inspección visual acotada

- Ruta: `#/learning/my-learning?chapter=chapter.5.2`; viewport 1440×1000; perfil local sin progreso; se comprobó la etiqueta de cobertura parcial y que los refs planificados aparecen con títulos comprensibles.
- Ruta: `#/learning/home`; viewport 480×900; perfil local sin progreso; se comprobó una sola tarjeta de siguiente acción, cuatro destinos móviles y sugerencias subordinadas dentro de Contexto.
- Aserciones DOM: un único `[data-next-action-id]` en Contexto cuando está abierto; CTA de práctica enlaza el activityId del step; ausencia de etiquetas “Demostrada/Consolidada” sin mastery.
- Consola: 0 errores; un aviso de rendimiento preexistente (`[learning:performance]`).

## Limitaciones

- No se capturó hardware, evidencia P real ni retención longitudinal.
- Los estados complejos se validan con fixtures; el harness no altera datos educativos persistidos.
- Las dos capturas se mantuvieron únicamente en memoria durante la revisión; no se escribieron ni rastrearon como archivos.

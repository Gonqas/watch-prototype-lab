# Academia P0 — orden, prerrequisitos y evaluación honesta

Estado: implementado  
Versión de aplicación de referencia: 0.9.1  
Alcance: P0 de la auditoría integral de Watchmaking Academy

## Resultado

P0 corrige los fallos que podían hacer que la Academia enseñara o acreditara en un orden incorrecto. La aplicación conserva la lectura libre de la teoría, pero el recorrido guiado ya no permite iniciar una práctica evaluable sin completar sus bases. Una sesión terminada tampoco equivale por sí sola a una actividad superada.

Esta fase no desarrolla todavía la expansión teórica P1 ni las mejoras avanzadas de tutor, retención o personalización previstas para P2.

## 1. Recorrido canónico

El orden ya no depende de una lista parcial duplicada en la interfaz. Existe un único grafo curricular en `src/learning/academy/academyCurriculum.ts`.

| Orden | Ruta | Dependencias obligatorias |
|---:|---|---|
| 1 | Orientación funcional relojera | Ninguna |
| 2 | Banco, herramientas y observación segura | Orientación |
| 3 | Fundamentos del reloj mecánico | Orientación y banco |
| 4 | Cuarzo documentado sobre MIYOTA 2035 | Orientación y banco |
| 5 | Inspección y metrología | Banco y fundamentos mecánicos |
| 6 | MIYOTA 8215 completo | Fundamentos mecánicos y metrología |
| 7 | Atlas comparativo | Fundamentos mecánicos y metrología |
| 8 | Método de servicio | MIYOTA 8215 y atlas comparativo |
| 9 | Arquitecturas y complicaciones | Fundamentos mecánicos y atlas |
| 10 | Fabricación y acabados | Metrología, servicio y arquitecturas |
| 11 | Diseño de un reloj propio | Fabricación y arquitecturas |
| 12 | Validar mi reloj y defender el proyecto | Diseño propio y método de servicio |

La base de banco se ha separado de la especialización MIYOTA 2035. Utiliza hoy ese fixture porque es el recurso visual trazable disponible, pero su objetivo es general: preparar, elegir herramientas y observar antes de intervenir.

## 2. Puertas reales de prerrequisitos

El preflight comprueba cuatro niveles antes de crear una sesión:

1. paquete y dependencias instaladas;
2. capacidades de runtime y viewport;
3. competencias y conceptos previos demostrados;
4. rutas previas completadas y teoría obligatoria de la lección terminada.

Los IDs de competencia externos se resuelven como competencias; ya no se interpretan erróneamente como IDs de nodos de conocimiento. Un identificador desconocido bloquea en vez de desaparecer en silencio.

Si falta una base, el preflight devuelve `blocked`, no `warning`, y no crea sesión. La persona puede abrir la ruta y leer su teoría, pero debe completar la dependencia antes de practicar. El modo `authoring-preview` existe únicamente como dependencia inyectada para previsualizadores editoriales y pruebas aisladas; la aplicación normal usa siempre `enforced`.

## 3. Teoría antes de práctica

Las lecciones con `studyContract.sequence = theory-first` ya tenían segmentos de lectura y un registro local de finalización. P0 conecta ese registro con el servicio de aplicación. Por tanto, la protección no depende de que la persona llegue por un botón concreto: también se aplica a enlaces directos y accesos desde Taller.

Los conceptos enseñados dentro de la misma lección no se exigen como dominio previo —eso produciría un bloqueo circular—. Sí se exigen los conceptos de otras lecciones, las competencias externas y las rutas anteriores.

## 4. Realización, reconocimiento y demostración

Se distinguen tres hechos:

- **sesión realizada:** existe un intento terminado;
- **práctica superada:** la evaluación asociada ha pasado;
- **competencia demostrada:** una actividad declarada como demostración o transferencia ha satisfecho su rúbrica de nivel superior.

Una respuesta formativa de reconocimiento solo puede llevar a `practising`. Las actividades de transferencia culminan en `demonstrated` cuando satisfacen su evidencia, incluso si un metadato editorial antiguo las había marcado por error como formativas. Una sesión fallida se conserva como intento, pero no aumenta la progresión ni desbloquea el siguiente hito.

La finalización de ruta exige todas sus prácticas superadas y, cuando la ruta declara `demonstrationActivityIds`, todas esas demostraciones. La ruta preparatoria de banco usa `completionPolicy = practice`: completa una preparación, pero no finge acreditar destreza relojera.

## 5. Revisión humana ejecutable

`Revisar` incluye ahora una cola de respuestas abiertas pendientes. El flujo permite:

1. seleccionar la evidencia original;
2. identificar a la persona revisora;
3. registrar `approved`, `changes-requested` o `rejected`;
4. justificar la decisión por escrito;
5. conservar la respuesta, la revisión, la sustitución y su hash;
6. reevaluar automáticamente la rúbrica y reconstruir el dominio.

Una aprobación crea evidencia `human-review` activa y una versión revisada de la evidencia original. La evidencia pendiente queda supersedida mediante un marcador trazable. Una decisión negativa se conserva, pero su evaluación `correct = false` impide usarla para acreditar dominio. La misma evidencia no puede revisarse dos veces. En fabricación, diseño y validación, la persona revisora debe ser distinta del perfil que realizó la actividad.

## 6. Validación del reloj frente a calidad interna

La antigua ruta `route.capstone.validation` mezclaba el proyecto de aprendizaje con pruebas del propio producto. P0 la convierte en una ruta interna `demo: true`, fuera del catálogo, progreso y buscador del estudiante. Contiene:

- pruebas con principiantes;
- accesibilidad y equivalencia;
- retención diferida como señal de calidad editorial.

La nueva ruta real `route.capstone.watch-validation` contiene:

- revisión relojera independiente;
- transferencia entre calibres y arquitecturas.

Es la última puerta del recorrido personal y requiere revisión humana.

## 7. Limpieza editorial

Se han eliminado de 43 bloques las colas idénticas que comenzaban por `Modelo mental paso a paso` y repetían instrucciones genéricas. Se conserva la teoría específica, las afirmaciones, las fuentes y los contratos de cada bloque.

El validador editorial rechaza desde ahora las frases de plantilla detectadas. El mínimo de extensión se fija en 250 palabras específicas: se evita que una métrica de longitud incentive volver a introducir relleno repetido. La expansión densa y específica de los temas es trabajo P1.

La herramienta `scripts/clean-learning-boilerplate.mjs` documenta y hace reproducible la migración; falla si el conjunto esperado deja de ser exactamente el auditado.

## 8. Compatibilidad y persistencia

- No cambia el esquema de perfil, sesión, evidencia, evaluación ni dominio.
- No se modifica `WatchProject` ni el formato `.wplab`.
- Las sesiones y evidencias existentes siguen siendo legibles.
- Los estados anteriores no se borran; el nuevo cálculo simplemente deja de contar una sesión fallida como progreso.
- Los paquetes integrados se regeneran desde sus manifiestos y mantienen sus versiones actuales.
- `route.capstone.validation` conserva su ID para no romper referencias históricas, pero pasa a ser interna.
- Las tres primeras unidades del paquete de cuarzo conservan todos sus IDs; solo cambia su pertenencia de ruta.

## 9. Verificación añadida

Las pruebas cubren:

- orden exacto y ausencia de ciclos en el grafo curricular;
- dependencias anteriores a cada ruta;
- bloqueo real de preflight sin crear sesión;
- separación de rutas internas y del estudiante;
- alcance de las doce rutas reales;
- revisión humana aprobada, reevaluación, dominio y prevención de doble revisión;
- reconocimiento limitado a `practising`;
- transferencia limitada por evidencia y elevada a `demonstrated`;
- rechazo del boilerplate editorial;
- validación sin diagnósticos de los cinco paquetes modificados.

## 10. Archivos principales afectados

- `src/learning/academy/academyCurriculum.ts`
- `src/learning/academy/academyCatalog.ts`
- `src/learning/academy/academyStudyPlan.ts`
- `src/learning/application/service.ts`
- `src/learning/product/integratedContent.ts`
- `src/learning/ui/AcademySurfaces.tsx`
- `src/learning/ui/academy-surfaces.css`
- `src/learning/content/authoringValidation.ts`
- `learning-content/quartz-miyota2035/**`
- `learning-content/watchmaking-capstone/**`
- 43 bloques de orientación, mecánica conceptual, MIYOTA 2035 y MIYOTA 8215

## 11. Deuda explícitamente aplazada

P1 deberá profundizar y reescribir teoría, ejemplos resueltos y práctica deliberada por tema, además de auditar la densidad conceptual de cada una de las 154 actividades del estudiante. P2 podrá ampliar personalización, tutor contextual, analítica longitudinal y protocolos de retención. Ninguna de esas tareas debe deshacer las puertas, niveles de evidencia o separación de calidad interna establecidos aquí.

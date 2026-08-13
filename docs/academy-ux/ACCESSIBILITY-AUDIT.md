# Auditoría de accesibilidad de Sistema 4UX

Fecha: 2026-07-27.  
Alcance: revisión experta y smoke técnico; no certificación WCAG.

## Base heredada

- persistencia de preferencias por perfil;
- comandos semánticos;
- actividades sin arrastre obligatorio;
- alternativas textuales;
- reduced motion en escenas;
- evaluación que no penaliza adaptaciones.

## Cambios 4UX

- landmarks para banner, navegación, búsqueda, contexto y `main`;
- salto a `#learning-main` que enfoca el destino;
- navegación con enlaces y botones nativos;
- foco visible con contraste;
- títulos y jerarquía de encabezados;
- estados con texto, icono y contorno además de color;
- IDs técnicos ocultos salvo preferencia o diagnóstico expandido;
- modo `Textual` completo en lección y workspace;
- selección de entidades mediante botones;
- controles para plegar/redimensionar paneles sin drag;
- temas sistema/oscuro/claro, contraste alto, escala, interlineado y ancho;
- contexto en drawer para ventana estrecha;
- harness con reduced motion, alto contraste, texto ampliado y narrow;
- eventos relevantes expuestos con regiones vivas.

## Matriz práctica

| Área | Resultado | Evidencia |
|---|---|---|
| Navegación | Pasa smoke | links semánticos, salto, acción primaria |
| Lesson player | Pasa smoke | lectura, visual, dividido, enfoque y textual |
| Viewport | Pasa con límite | árbol semántico y selección sin arrastre; lector real pendiente |
| Workspace | Pasa smoke | paneles por botones, guardar/salir, textual |
| Banco y bandejas | Pasa contrato | acciones semánticas e identidades; auditoría NVDA pendiente |
| Atlas | Pasa smoke | enlaces de modelo/pieza/relación, G/K/P textual |
| Progreso | Pasa inspección | estados nombrados, no solo color |
| Reduced motion | Pasa smoke | preferencia persistida y capacidad del runtime |
| Contraste alto | Pasa smoke | clase y tokens aplicados |
| Texto ampliado | Pasa contrato | rango persistente; QA visual adicional recomendable |
| 700 × 850 | Pasa captura | lección utilizable y una columna |

## Smoke ejecutado

- se activó y persistió reduced motion;
- se activó contraste alto y se restauró después del test;
- se abrió modo textual en un workspace real;
- se seleccionó `Pila SR626SW` mediante botón, sin drag;
- se guardó y recuperó la sesión;
- el salto a contenido enfocó `main` al activarse;
- se inspeccionaron nombres accesibles de navegación, botones, estados y entidades;
- se capturó la lección a 700 × 850.

## Hallazgos corregidos durante QA

1. Un efecto recargaba estado local de forma síncrona: sustituido por actualización basada en eventos.
2. El skip link cambiaba el hash, pero no garantizaba foco: ahora enfoca el `main`.
3. El workspace mostraba IDs de paso e instancia: ahora respeta `showTechnicalIds`.
4. La bandeja mostraba IDs crudos: ahora usa nombres de pieza.
5. La pantalla de sesión exponía actividad, fixture y checkpoint como IDs: ahora humaniza la vista y reserva el detalle técnico.

## Pendientes no bloqueantes

- recorrido humano completo con Tab/Shift+Tab en todos los labs;
- NVDA y JAWS sobre árbol 8215, tornillos y bandejas;
- contraste medido de todos los estados del tema claro;
- zoom del sistema operativo por encima del 200 %;
- evaluación de pronunciación ES/EN en glosario;
- revisión táctil en hardware real;
- auditoría formal WCAG 2.2 AA.

No se afirma conformidad formal mientras esos trabajos no se ejecuten.

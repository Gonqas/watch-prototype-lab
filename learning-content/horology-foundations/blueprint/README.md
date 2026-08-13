# Sistema 4B — Blueprint editorial inicial

Este paquete contiene la primera definición editorial creada a partir del kit de autoría 4A:

- currículo maestro;
- decisiones editoriales;
- plan de reconstrucción visual MIYOTA;
- especificación del primer módulo real.

Todavía no es un `.wplab-learning-pack` validado. No contiene archivos de lección, escenas ni rúbricas en JSON porque primero deben aprobarse el currículo y los storyboards y, en paralelo, deben existir fixtures reales para MIYOTA 2035 y 8215.

Siguiente integración técnica recomendada:

1. crear el workspace `learning-content/horology-foundations`;
2. registrar fuentes oficiales y la fuente privada del libro;
3. crear fixtures visuales para cuarzo conceptual, 2035, mecánico conceptual y 8215;
4. convertir la especificación del primer módulo a los contratos JSON exactos;
5. ejecutar `learning:validate`, `learning:lint`, `learning:preview` y `learning:visual-report`;
6. producir los recursos marcados como críticos;
7. empaquetar e instalar localmente.

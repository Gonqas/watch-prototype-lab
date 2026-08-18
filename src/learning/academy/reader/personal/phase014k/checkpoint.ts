export const ACADEMY_STAGE_5_FINAL_CHECKPOINT = {
  checkpointId:'checkpoint.stage5.integration-method',
  title:'Comprobación final de integración · método completo',
  blocking:false,
  affectsProgress:false,
  createsMastery:false,
  questions:[
    '¿He definido los requisitos?','¿He elegido y documentado el movimiento?','¿He inventariado todos los componentes?','¿He registrado los documentos?',
    '¿He comparado movimiento, aro y caja?','¿He evaluado tija, tubo y corona?','¿He evaluado esfera, asiento y pies?','¿He evaluado agujeros y tubos de agujas?',
    '¿He construido el apilado axial?','¿He comprobado cristal y fondo?','¿He registrado el barrido del rotor?','¿He comprobado los estados dinámicos?',
    '¿He distinguido el diseño de la prueba de hermeticidad?','¿He evaluado las piezas donantes?','¿He registrado los datos pendientes y los conflictos?','¿He creado un plan de montaje?',
    '¿He creado un plan de verificación?','¿Mi conclusión está limitada por la evidencia?',
  ],
  actions:[
    ['Repasar requisitos','#/learning/lesson/lesson.capstone.design.requirements'],['Repasar documentación','#/learning/lesson/lesson.capstone.design.acquired-movement'],
    ['Repasar caja y aro','#/learning/lesson/lesson.encyclopedia.cases-water.arquitectura-de-caja'],['Repasar mando','#/learning/lesson/lesson.encyclopedia.cases-water.corona-tubo-y-tija'],
    ['Repasar esfera y agujas','#/learning/lesson/lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera'],['Repasar cierre','#/learning/lesson/lesson.encyclopedia.cases-water.cristales-y-biseles'],
    ['Repasar interferencias','#/learning/workshop?integration=1&panel=interferences'],['Repasar donantes','#/learning/workshop?integration=1&panel=donors'],
    ['Abrir laboratorio','#/learning/workshop?integration=1'],['Abrir dossier','#/learning/workshop?integration=1&panel=dossier'],['Continuar a etapa 6','#/learning/my-learning?stage=stage.6'],
  ].map(([label,href]) => ({label,href})),
} as const

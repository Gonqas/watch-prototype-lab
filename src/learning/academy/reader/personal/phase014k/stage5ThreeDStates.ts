export const ACADEMY_STAGE_5_3D_STATES = [
  {stateId:'3d.stage5.movement-envelope',represents:['envolvente del movimiento'],requiredInputs:['movement-diameter','movement-height'],state:'input-incomplete'},
  {stateId:'3d.stage5.case-cavity',represents:['cavidad de caja'],requiredInputs:['case-seat-diameter','case-inner-height'],state:'input-incomplete'},
  {stateId:'3d.stage5.holder-envelope',represents:['aro conceptual'],requiredInputs:['holder-inner-diameter','holder-outer-diameter','holder-height'],state:'input-incomplete'},
  {stateId:'3d.stage5.control-axis',represents:['eje de tija','tubo','corona'],requiredInputs:['stem-axis-height','tube-axis-height','stem-functional-length'],state:'input-incomplete'},
  {stateId:'3d.stage5.dial-and-hands',represents:['esfera','stack de agujas','barridos'],requiredInputs:['dial-diameter','dial-thickness','hand-stack-top'],state:'input-incomplete'},
  {stateId:'3d.stage5.closure',represents:['cristal','fondo','rotor'],requiredInputs:['crystal-inner-height','caseback-inner-height','rotor-rear-envelope'],state:'input-incomplete'},
] as const
export const ACADEMY_STAGE_5_3D_POLICY = {allowedStates:['input-incomplete','conceptual-envelope','dimensionally-constrained','conflict-detected','no-conflict-in-represented-model','physical-validation-pending'],defaultState:'input-incomplete',fixture8215ScaleAllowed:false,detailedGeometryWithoutInputs:false,webglRequired:false,fallback:'Resumen textual de entradas, estados evaluados, omitidos y límites.',physicalCompatibilityClaim:false} as const

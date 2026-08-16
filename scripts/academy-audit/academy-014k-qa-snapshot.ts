export const ACADEMY_014K_QA_VIEWPORTS = ['1440x1000','1024x768','760x900','480x900','reflow-200'] as const

const subjects = [
  ['01-stage5-entry.png','1440x1000','overview','Entrada a etapa 5'],['02-requirements.png','1440x1000','requirements','Requisitos'],['03-movement-choice.png','1440x1000','movement','Elección de movimiento'],
  ['04-empty-project.png','1024x768','overview','Proyecto vacío'],['05-inventory.png','1024x768','inventory','Inventario'],['06-document-authority.png','1024x768','authority','Autoridad documental'],
  ['07-compatibility-matrix.png','1440x1000','matrix','Matriz de compatibilidad'],['08-radial-chain.png','1440x1000','chains','Movimiento–aro–caja'],['09-control-chain.png','1024x768','chains','Cadena de mando'],
  ['10-dial-feet.png','1024x768','chains','Esfera y pies'],['11-hand-holes.png','1024x768','matrix','Agujeros de agujas'],['12-axial-stack.png','1440x1000','chains','Stack axial'],
  ['13-crystal.png','1024x768','interferences','Cristal'],['14-caseback-rotor.png','1024x768','interferences','Fondo y rotor'],['15-gaskets.png','1024x768','authority','Juntas'],
  ['16-dynamic-sweeps.png','1440x1000','interferences','Barridos'],['17-donors.png','1024x768','donors','Donantes'],['18-conflict.png','1024x768','matrix','Conflicto','conflict-found'],
  ['19-source-needed.png','760x900','authority','Source-needed','source-needed'],['20-assembly-plan.png','1440x1000','assembly','Plan de montaje'],['21-dossier.png','1440x1000','dossier','Dossier','documentally-compatible'],
  ['22-personal-review.png','1024x768','review','Revisión personal'],['23-mobile.png','480x900','overview','Móvil'],['24-reflow-200.png','reflow-200','matrix','Reflow 200 %'],
  ['25-dark-theme.png','1024x768','dossier','Tema oscuro','documentally-compatible'],['26-reduced-motion.png','760x900','interferences','Reduced motion'],['27-no-webgl-fallback.png','760x900','chains','Fallback sin WebGL'],
  ['28-invalid-import.png','1024x768','overview','Importación inválida'],
] as const

export const ACADEMY_014K_QA_CASES = subjects.map(([fileName,viewport,panel,subject,status]) => ({fileName,viewport,panel,subject,status:status??'source-needed',fixture:true,privateData:false,humanValidation:false}))

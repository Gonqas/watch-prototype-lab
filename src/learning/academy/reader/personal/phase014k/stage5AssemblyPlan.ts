import type { AssemblyPlanStep } from './stage5ComponentModel'

export const ACADEMY_STAGE_5_ASSEMBLY_PLAN: readonly AssemblyPlanStep[] = [
  ['assembly.01',1,'Congelar requisitos y referencias',[],['movement-case'],'Todos los componentes tienen identidad o unknown explícito.','Detener si cambia el movimiento elegido.','Volver al pliego'],
  ['assembly.02',2,'Revisar documentación aplicable',['assembly.01'],['stem-movement','dial-feet'],'Cada dimensión crítica conserva documento, datum y aplicabilidad.','Detener ante documentos de variante dudosa.','Marcar source-needed'],
  ['assembly.03',3,'Cerrar encaje radial',['assembly.02'],['movement-holder','holder-case'],'Cadena radial calculada o abierta con unknowns.','Detener ante margen negativo o datum ausente.','Reabrir selección de caja/aro'],
  ['assembly.04',4,'Cerrar cadena de mando',['assembly.02'],['stem-movement','stem-crown','crown-tube','tube-case'],'Ejes, roscas y estados documentados.','Detener ante desalineación o adaptación física.','Remitir modificación a etapa 6'],
  ['assembly.05',5,'Cerrar esfera y pies',['assembly.03'],['dial-movement','dial-seat','dial-feet'],'Asiento, apertura y pies comparados.','Detener si se requiere cortar, soldar o pegar.','Elegir esfera compatible'],
  ['assembly.06',6,'Cerrar stack de indicación',['assembly.05'],['hands-posts','hour-wheel-dial','hands-dial','hands-hands'],'Cadena axial conserva márgenes y unknowns.','Detener si falta un datum de altura.','Revisar documentación/medición'],
  ['assembly.07',7,'Cerrar cristal, fondo y juntas',['assembly.06'],['hands-crystal','rotor-caseback','crystal-bezel','gasket-housing'],'Rutas de fuga e interferencias están registradas.','Detener si se infiere hermeticidad sin ensayo.','Mantener not-verified'],
  ['assembly.08',8,'Auditar donantes',['assembly.02'],['donor-receiver'],'Identidad, procedencia, interfaces y reversibilidad documentadas.','Detener ante semejanza visual como única evidencia.','Rechazar o pedir fuente'],
  ['assembly.09',9,'Preparar dry-layout físico futuro',['assembly.03','assembly.04','assembly.05','assembly.06','assembly.07'],['movement-case','hands-crystal','rotor-caseback'],'Plan y stop conditions revisados; no se ejecuta en 0.14K.','Detener ante conflicto documental.','Volver al interfaz en conflicto'],
  ['assembly.10',10,'Emitir dossier y conclusión',['assembly.08','assembly.09'],['movement-case'],'Conclusión distingue papel, modelo y validación física.','Detener si se declara reloj completado.','Limitar la conclusión'],
].map(([stepId,order,title,dependencyStepIds,requiredInterfaceIds,checkpoint,stopCondition,rollback]) => ({stepId,order,title,dependencyStepIds,requiredInterfaceIds,checkpoint,stopCondition,rollback,executionStatus:'planned-only'})) as AssemblyPlanStep[]


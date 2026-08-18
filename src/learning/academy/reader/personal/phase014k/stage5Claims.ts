import type { IntegrationClaim } from './stage5ComponentModel'
import { ACADEMY_STAGE_5_CATALOG } from './stage5Catalog'
import { academyStage5SectionId } from './stage5Sections'

export interface AcademyStage5ClaimReview extends IntegrationClaim {
  lessonId: string
  sectionId: string
  central: boolean
  formulaIds: readonly string[]
  numericValues: readonly string[]
}

export const ACADEMY_STAGE_5_CLAIMS: readonly AcademyStage5ClaimReview[] = ACADEMY_STAGE_5_CATALOG.flatMap((item,index) => [
  {claimId:`claim.stage5.${index+1}.method`,lessonId:item.lessonId,sectionId:academyStage5SectionId.method(item.lessonId),claim:item.observableOutcome,kind:'compatibility',authority:'derived-from-verified-inputs',sourceIds:[],dimensionIds:[],interfaceIds:[],verificationStatus:'source-limited',limitations:[item.sourceScope,'El método no aporta cotas del proyecto.'],central:true,formulaIds:[],numericValues:[]},
  {claimId:`claim.stage5.${index+1}.boundary`,lessonId:item.lessonId,sectionId:academyStage5SectionId.example(item.lessonId),claim:'La conclusión documental o digital no acredita montaje, hermeticidad ni compatibilidad física.',kind:'limitation',authority:'derived-from-verified-inputs',sourceIds:[],dimensionIds:[],interfaceIds:[],verificationStatus:'verified',limitations:['Una afirmación de ejecución física requiere evidencia documentada fuera de 0.14K.'],central:false,formulaIds:[],numericValues:[]},
])
export function academyStage5ClaimsForLesson(lessonId:string) { return ACADEMY_STAGE_5_CLAIMS.filter((claim) => claim.lessonId === lessonId) }

export const ACADEMY_STAGE_5_FORMULAS = [
  {formulaId:'formula.stage5.radial-margin',name:'margen radial',expression:'radio_asiento − radio_envolvente',inputs:['case-seat-radius','movement-radius'],unit:'mm',source:'relación geométrica explícita',visualVerificationRequired:false},
  {formulaId:'formula.stage5.axial-margin',name:'margen axial',expression:'altura_disponible − suma_stack',inputs:['crystal-inner-height','hand-stack-top'],unit:'mm',source:'relación geométrica explícita',visualVerificationRequired:false},
  {formulaId:'formula.stage5.axis-offset',name:'diferencia de ejes',expression:'eje_tubo − eje_tija',inputs:['tube-axis-height','stem-axis-height'],unit:'mm',source:'relación geométrica explícita',visualVerificationRequired:false},
  {formulaId:'formula.stage5.functional-length',name:'longitud funcional',expression:'cadena exterior − profundidades de acoplamiento',inputs:['stem-functional-length','crown-engagement-depth'],unit:'mm',source:'relación geométrica explícita',visualVerificationRequired:false},
  {formulaId:'formula.stage5.envelope-clearance',name:'holgura de envolvente',expression:'envolvente_disponible − envolvente_móvil',inputs:['caseback-inner-height','rotor-rear-envelope'],unit:'mm',source:'relación geométrica explícita',visualVerificationRequired:false},
] as const

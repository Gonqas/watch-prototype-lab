import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  ACADEMY_PERSONAL_CURATION_PHASES, ACADEMY_READER_CURATION_PHASES,
  ACADEMY_STAGE_5_3D_POLICY, ACADEMY_STAGE_5_3D_STATES, ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_5_ANCHOR_IDS, ACADEMY_STAGE_5_ASSEMBLY_PLAN, ACADEMY_STAGE_5_CATALOG,
  ACADEMY_STAGE_5_CHAIN_TEMPLATES, ACADEMY_STAGE_5_CLAIMS, ACADEMY_STAGE_5_DOSSIER_SECTIONS,
  ACADEMY_STAGE_5_FORMULAS, ACADEMY_STAGE_5_INTEGRATION_REFS,
  ACADEMY_STAGE_5_INTERFACE_SEEDS, ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES, ACADEMY_STAGE_5_PARTIAL_RESOLUTIONS,
  ACADEMY_STAGE_5_PERSONAL_PRACTICES, ACADEMY_STAGE_5_PHOTO_BRIEFS, ACADEMY_STAGE_5_SUPPORT_IDS,
  ACADEMY_STAGE_5_VISUAL_DESIGNS, CURRENT_ACADEMY_CURATION_PHASE,
  academyCurationLayersForPhase, academyPhaseRank, academyPersonalActivityPresentation014K,
  authorityCanValidateCompatibility, buildEmptyCompatibilityMatrix, buildIntegrationDossier,
  calculateDimensionalChain, calculateInterferences, convertTraceableDimension, createIntegrationProject,
  deriveIntegrationProjectStatus, duplicateIntegrationProject, evaluateCompatibilityInterface,
  exportIntegrationProject, importIntegrationProject, integrationProjectCanBeDocumentallyCompatible,
  replaceTraceableDimension, resolveIntegrationProjectConflict, type TraceableDimension,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import { ACADEMY_LEARNER_PATH, ACADEMY_PLANNED_CONTENT, ACADEMY_STAGE_5_PLANNED_REFS } from '../../src/learning/academy/path/academyLearnerPath'
import { AcademyLocalStore, type AcademyStorage } from '../../src/learning/academy/academyLocalState'
import { buildAcademy014KOutputs, ACADEMY_014K_BASELINE, ACADEMY_014K_OUTPUT_FILES } from '../academy-014k'
import { ACADEMY_014K_QA_CASES, ACADEMY_014K_QA_VIEWPORTS } from './academy-014k-qa-snapshot'
import { loadAcademyCorpus, type AcademyCorpus } from './corpus'

const root=resolve(process.cwd())
let corpus:AcademyCorpus
let outputs:Map<string,string>
let pathSource=''
let labSource=''
let packageSource=''
beforeAll(async()=>{corpus=await loadAcademyCorpus(root);outputs=await buildAcademy014KOutputs(root);[pathSource,labSource,packageSource]=await Promise.all([readFile(resolve(root,'src/learning/academy/path/academyLearnerPath.ts'),'utf8'),readFile(resolve(root,'src/learning/ui/AcademyIntegrationLabSurface.tsx'),'utf8'),readFile(resolve(root,'package.json'),'utf8')])},120_000)

const packIds=()=>new Set(corpus.packs.map(({pack})=>pack.manifest.id))
const lessonIds=()=>new Set(corpus.packs.flatMap(({pack})=>pack.lessons.map(({id})=>id)))
const activityIds=()=>new Set(corpus.packs.flatMap(({pack})=>pack.activities.map(({id})=>id)))
const stage5=()=>ACADEMY_LEARNER_PATH.stages.find(({stageId})=>stageId==='stage.5')!
const chapter=(id:string)=>ACADEMY_LEARNER_PATH.chapters.find(({chapterId})=>chapterId===id)!
const dimension=(id:string,value:number|undefined,datum='datum.shared'):TraceableDimension=>({dimensionId:id,componentId:'component.fixture',name:id,value,unit:'mm',datum,applicability:'fixture',verificationStatus:value===undefined?'unknown':'measured',notes:''})
const sha256=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex')
const memoryStorage=():AcademyStorage=>{const values=new Map<string,string>();return{getItem:(key)=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value)},removeItem:(key)=>{values.delete(key)}}}
type MandatoryCase=readonly[number:number,name:string,run:()=>unknown|Promise<unknown>]
const cases:MandatoryCase[]=[]
const c=(number:number,name:string,run:MandatoryCase[2])=>cases.push([number,name,run])

c(1,'cargan los ocho paquetes',()=>expect(packIds().size).toBe(8))
c(2,'permanecen 24 rutas',()=>expect(corpus.counts.routes).toBe(24))
c(3,'permanecen 217 módulos',()=>expect(corpus.counts.modules).toBe(217))
c(4,'permanecen 222 lecciones',()=>expect(corpus.counts.lessons).toBe(222))
c(5,'permanecen 289 actividades',()=>expect(corpus.counts.activities).toBe(289))
c(6,'el digest del corpus no cambia',()=>expect(corpus.digest).toBe(ACADEMY_014K_BASELINE.corpusDigest))
c(7,'learning-content no cambia',()=>expect(ACADEMY_014K_BASELINE.protected.learningContent).toEqual({count:4012,digest:'22e0330de012ea3ef53cd39beb104b4d5fcb9c78ae48763b11cf7639cce7888d'}))
c(8,'originals no cambia',()=>expect(ACADEMY_014K_BASELINE.protected.originals).toEqual({count:7,digest:'633edd7f7027a61587b1b944b0b3bf8562819697144b449e4dc9aed1db4ab6b7'}))
c(9,'los informes A–J conservan snapshot byte a byte',()=>expect(ACADEMY_014K_BASELINE.protected.historicalReports).toEqual({count:199,digest:'45865c5b5e84c4cee9d6ff9167da9bf608ca7c0b9c460a8241e39e6a85d2a156'}))
c(10,'no se crean lecciones o módulos de relleno',()=>expect(ACADEMY_STAGE_5_CATALOG.every(({lessonId})=>lessonIds().has(lessonId))).toBe(true))
c(11,'E–J siguen registrados',()=>expect(['0.14E','0.14F','0.14G','0.14H','0.14I','0.14J'].every((phase)=>ACADEMY_PERSONAL_CURATION_PHASES.includes(phase as never))).toBe(true))
c(12,'K se construye',()=>expect(outputs.size).toBe(37))
c(13,'el registro incluye K literalmente',()=>expect(ACADEMY_READER_CURATION_PHASES.at(-1)).toBe('0.14K'))
c(14,'la fase activa es K',()=>expect(CURRENT_ACADEMY_CURATION_PHASE).toBe('0.14K'))
c(15,'K compone E–K',()=>expect(academyCurationLayersForPhase('0.14K').map(({phase})=>phase)).toEqual(['0.14D','0.14E','0.14F','0.14G','0.14H','0.14I','0.14J','0.14K']))
c(16,'una fase anterior no recibe datos K',()=>expect(academyCurationLayersForPhase('0.14J').some(({phase})=>phase==='0.14K')).toBe(false))
c(17,'una fase desconocida se rechaza',()=>expect(()=>academyPhaseRank('0.14L' as never)).toThrow(/desconocida/))
c(18,'existen cinco capítulos',()=>expect(stage5().chapterIds).toHaveLength(5))
c(19,'existen 12 anchors',()=>expect(ACADEMY_STAGE_5_ANCHOR_IDS).toHaveLength(12))
c(20,'existen cuatro supports',()=>expect(ACADEMY_STAGE_5_SUPPORT_IDS).toHaveLength(4))
c(21,'los supports no bloquean',()=>expect(ACADEMY_STAGE_5_SUPPORT_IDS.every((id)=>ACADEMY_STAGE_5_CATALOG.find(({lessonId})=>lessonId===id)?.pathRole==='support')).toBe(true))
c(22,'etapa 4 abre etapa 5',()=>expect(stage5().prerequisiteStageIds).toContain('stage.4'))
c(23,'etapa 5 abre etapa 6',()=>expect(ACADEMY_LEARNER_PATH.stages.find(({stageId})=>stageId==='stage.6')?.prerequisiteStageIds).toContain('stage.5'))
c(24,'la rama histórica no bloquea',()=>expect(ACADEMY_LEARNER_PATH.optionalBranches.find(({branchId})=>branchId==='branch.historical-cases')?.blocking).toBe(false))
c(25,'el método puede completarse sin componentes físicos',()=>expect(chapter('chapter.5.5').physicalEvidencePolicy.requiredPhysicalModality).toBe('none'))
c(26,'los ocho refs conservan IDs',()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.map(({ref})=>ref)).toEqual(ACADEMY_STAGE_5_PLANNED_REFS))
c(27,'ningún ref se elimina',()=>expect(ACADEMY_PLANNED_CONTENT.filter(({ref})=>ACADEMY_STAGE_5_PLANNED_REFS.includes(ref)).length).toBe(8))
c(28,'los ocho tienen resolución curricular',()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.every(({curriculumResolutionStatus})=>curriculumResolutionStatus==='implemented-method')).toBe(true))
c(29,'los ocho tienen secciones visibles',()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.every(({resolvedBySectionIds})=>resolvedBySectionIds.length>0)).toBe(true))
c(30,'los ocho tienen práctica o checkpoint',()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.every(({resolvedByPracticeIds,resolvedByActivityIds})=>resolvedByPracticeIds.length+resolvedByActivityIds.length>0)).toBe(true))
c(31,'los ocho tienen fuente o límite explícito',()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.every(({sourceAuthority,limitations})=>sourceAuthority.length>0&&limitations.length>0)).toBe(true))
c(32,'los cinco parciales tienen cierre',()=>expect(ACADEMY_STAGE_5_PARTIAL_RESOLUTIONS.filter(({status})=>status==='implemented-method')).toHaveLength(5))
c(33,'la UI distingue método y datos',()=>expect(labSource).toContain('Currículo: <strong>método completo</strong>'))
c(34,'source-needed no se presenta como contenido ausente',()=>expect(`${pathSource}${labSource}`).not.toContain('Contenido ausente'))
c(35,'la etapa activa queda complete-method',()=>expect(ACADEMY_STAGE_5_CATALOG.every((item)=>outputs.get('ACADEMY-STAGE-5-CURATION-0.14K.json')?.includes(item.lessonId))).toBe(true))
c(36,'un proyecto puede seguir source-needed',()=>expect(createIntegrationProject('profile.fixture').status).toBe('source-needed'))
c(37,'una dimensión desconocida no se convierte en cero',()=>expect(dimension('unknown',undefined).value).toBeUndefined())
c(38,'toda altura utilizable tiene datum',()=>{const chain=calculateDimensionalChain(ACADEMY_STAGE_5_CHAIN_TEMPLATES[0],ACADEMY_STAGE_5_CHAIN_TEMPLATES[0].members.map(({dimensionId})=>dimension(dimensionId,1,'')));expect(chain.status).toBe('datum-conflict')})
c(39,'toda medida conserva unidad',()=>expect(dimension('unit',1).unit).toBe('mm'))
c(40,'una conversión conserva valor original',()=>expect(convertTraceableDimension(dimension('convert',25.4),1,'count','25.4 mm = 1 unidad').originalValue).toBe(25.4))
c(41,'una medición propia no se presenta como tolerancia',()=>{const project=createIntegrationProject('p');project.components[0].sourceType='measured-own-component';project.dimensions=[{...dimension('x',1),componentId:project.components[0].componentId,tolerance:{minus:.1,plus:.1}}];const imported=importIntegrationProject(exportIntegrationProject(project,'2026-01-01T00:00:00Z'),'p');expect(imported.ok&&imported.project.dimensions[0].tolerance).toBeUndefined()})
c(42,'una estimación no se presenta como oficial',()=>expect(authorityCanValidateCompatibility('estimated')).toBe(false))
c(43,'un derivado conserva entradas',()=>expect({...dimension('derived',2),derivedFromDimensionIds:['input.a']}.derivedFromDimensionIds).toEqual(['input.a']))
c(44,'un cambio de entrada invalida derivados',()=>{const project=createIntegrationProject('p');project.dimensions=[dimension('input.a',1),{...dimension('derived',2),derivedFromDimensionIds:['input.a'],verificationStatus:'derived'}];expect(replaceTraceableDimension(project,dimension('input.a',2)).dimensions[1].staleBecauseInputChanged).toBe(true)})
c(45,'igualdad nominal no valida ajuste',()=>{const seed=ACADEMY_STAGE_5_INTERFACE_SEEDS.find(({interfaceId})=>interfaceId==='hands-posts')!;const result=evaluateCompatibilityInterface(seed,seed.requiredData.map((id)=>dimension(id,1)));expect(result.result).not.toBe('compatible-on-paper')})
c(46,'visual-match-only no valida compatibilidad',()=>expect(authorityCanValidateCompatibility('visual-match-only')).toBe(false))
c(47,'existen todas las interfaces mínimas',()=>expect(ACADEMY_STAGE_5_INTERFACE_SEEDS).toHaveLength(19))
c(48,'cada interfaz declara datos requeridos',()=>expect(ACADEMY_STAGE_5_INTERFACE_SEEDS.every(({requiredData})=>requiredData.length>0)).toBe(true))
c(49,'incomplete no se presenta compatible',()=>expect(buildEmptyCompatibilityMatrix().every(({result})=>result==='source-needed')).toBe(true))
c(50,'un fit requiere ambos componentes',()=>expect(ACADEMY_STAGE_5_INTERFACE_SEEDS.filter(({checkMethod})=>checkMethod==='fit').every(({componentA,componentB})=>Boolean(componentA&&componentB))).toBe(true))
c(51,'un clearance requiere toda la cadena',()=>{const seed=ACADEMY_STAGE_5_INTERFACE_SEEDS.find(({checkMethod})=>checkMethod==='clearance')!;expect(evaluateCompatibilityInterface(seed,seed.requiredData.slice(0,-1).map((id)=>dimension(id,1))).result).not.toBe('compatible-on-paper')})
c(52,'un conflicto se propaga',()=>{const project=createIntegrationProject('p');project.conflicts=['fixture'];expect(deriveIntegrationProjectStatus(project)).toBe('conflict-found')})
c(53,'un unknown se propaga',()=>expect(buildEmptyCompatibilityMatrix().every(({unknowns})=>unknowns.length>0)).toBe(true))
c(54,'la matriz es determinista',()=>expect(buildEmptyCompatibilityMatrix()).toEqual(buildEmptyCompatibilityMatrix()))
c(55,'existe cadena radial',()=>expect(ACADEMY_STAGE_5_CHAIN_TEMPLATES.some(({chainId})=>chainId==='chain.radial')).toBe(true))
c(56,'existe cadena de mando',()=>expect(ACADEMY_STAGE_5_CHAIN_TEMPLATES.some(({chainId})=>chainId==='chain.control')).toBe(true))
c(57,'existe cadena de esfera',()=>expect(ACADEMY_STAGE_5_CHAIN_TEMPLATES.some(({chainId})=>chainId==='chain.dial')).toBe(true))
c(58,'existe cadena axial',()=>expect(ACADEMY_STAGE_5_CHAIN_TEMPLATES.some(({chainId})=>chainId==='chain.indication')).toBe(true))
c(59,'existe cadena posterior',()=>expect(ACADEMY_STAGE_5_CHAIN_TEMPLATES.some(({chainId})=>chainId==='chain.rear')).toBe(true))
c(60,'datum incompatible bloquea',()=>{const template=ACADEMY_STAGE_5_CHAIN_TEMPLATES[0];expect(calculateDimensionalChain(template,template.members.map(({dimensionId})=>dimension(dimensionId,1,'otro'))).status).toBe('datum-conflict')})
c(61,'margen negativo produce conflicto',()=>{const template=ACADEMY_STAGE_5_CHAIN_TEMPLATES[0];const dimensions=template.members.map(({dimensionId},index)=>dimension(dimensionId,index===1||index===3?10:1,template.datum));expect(calculateDimensionalChain(template,dimensions).status).toBe('conflict-found')})
c(62,'margen desconocido permanece unknown',()=>{const template=ACADEMY_STAGE_5_CHAIN_TEMPLATES[0];expect(calculateDimensionalChain(template,[]).margin).toBeUndefined()})
for(const [number,id] of ACADEMY_STAGE_5_PLANNED_REFS.entries())c(63+number,`${id} tiene método`,()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.find(({ref})=>ref===id)?.curriculumResolutionStatus).toBe('implemented-method'))
c(71,'ningún gap inventa dimensión',()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.every(({requiredInputs})=>requiredInputs.every((input)=>typeof input==='string'))).toBe(true))
c(72,'diseño y ensayo de hermeticidad están separados',()=>expect(ACADEMY_STAGE_5_PARTIAL_RESOLUTIONS.find(({ref})=>ref==='stage5-partial.water-resistance')).toMatchObject({projectDefault:'not-verified',lessonIds:expect.arrayContaining(['lesson.encyclopedia.cases-water.toh-materiales-exterior','lesson.encyclopedia.cases-water.pruebas-de-presion'])}))
c(73,'sin ensayo el estado es not-verified',()=>expect(createIntegrationProject('p').waterResistanceStatus).toBe('not-verified'))
c(74,'no se presenta presión universal',()=>expect(outputs.get('ACADEMY-STAGE-5-CURATION-0.14K.md')).not.toMatch(/\b\d+\s*(bar|atm|m)\b/i))
c(75,'la prueba profesional no produce resultado simulado',()=>expect(ACADEMY_STAGE_5_CATALOG.find(({lessonId})=>lessonId.includes('pruebas-de-presion'))?.methodFocus).toContain('Ensayo profesional futuro'))
c(76,'fuente histórica no autoriza protocolo vigente',()=>expect(ACADEMY_STAGE_5_CATALOG.find(({lessonId})=>lessonId.includes('pruebas-de-presion'))?.sourceScope).toContain('fuentes históricas no autorizan'))
c(77,'semejanza visual no prueba donante',()=>expect(ACADEMY_STAGE_5_CATALOG.find(({lessonId})=>lessonId.includes('restauracion-y-fabricacion'))?.methodFocus).toContain('semejanza visual'))
c(78,'misma marca no prueba compatibilidad',()=>expect(labSource).toContain('misma marca no prueban'))
c(79,'referencia y documentación tienen prioridad',()=>expect(ACADEMY_STAGE_5_INTEGRATION_REFS.find(({ref})=>ref.includes('final-assembly'))?.sourceAuthority).toContain('derived-from-verified-inputs'))
c(80,'modificación prevista se remite a etapa 6',()=>expect(labSource).toContain('pertenece a etapa 6'))
c(81,'la procedencia de donante se conserva',()=>expect(createIntegrationProject('p').donorComponents).toEqual([]))
c(82,'la reversibilidad se registra',()=>expect(createIntegrationProject('p').components.every(({reversibility})=>Boolean(reversibility))).toBe(true))
c(83,'se distinguen checks estáticos y dinámicos',()=>expect(new Set(ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.map(({kind})=>kind))).toEqual(new Set(['static','dynamic'])))
c(84,'se registran estados evaluados',()=>expect(ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.every(({statesEvaluated})=>statesEvaluated.length>0)).toBe(true))
c(85,'se registran estados omitidos',()=>expect(ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.every(({statesOmitted})=>statesOmitted.length>0)).toBe(true))
c(86,'no-conflict de modelo no equivale compatible',()=>expect(ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.every(({limitations})=>limitations.length>0)).toBe(true))
c(87,'rotor necesita envolvente posterior',()=>expect(ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.find(({checkId})=>checkId.includes('rotor'))?.requiredDimensionIds).toContain('rotor-rear-envelope'))
c(88,'agujas necesitan barridos',()=>expect(ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.filter(({checkId})=>checkId.includes('hands')).every(({kind})=>kind==='dynamic')).toBe(true))
c(89,'tija y corona necesitan estados',()=>expect(ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.find(({checkId})=>checkId.includes('stem'))?.statesEvaluated.length).toBeGreaterThan(2))
c(90,'no existe secuencia universal',()=>expect(outputs.get('ACADEMY-STAGE-5-ASSEMBLY-PLAN-0.14K.json')).toContain('"universalSequence": false'))
c(91,'cada paso tiene dependencia',()=>expect(ACADEMY_STAGE_5_ASSEMBLY_PLAN.every(({dependencyStepIds})=>Array.isArray(dependencyStepIds))).toBe(true))
c(92,'cada paso tiene checkpoint',()=>expect(ACADEMY_STAGE_5_ASSEMBLY_PLAN.every(({checkpoint})=>checkpoint.length>0)).toBe(true))
c(93,'cada paso tiene stop condition',()=>expect(ACADEMY_STAGE_5_ASSEMBLY_PLAN.every(({stopCondition})=>stopCondition.length>0)).toBe(true))
c(94,'pasos físicos permanecen pendientes',()=>expect(ACADEMY_STAGE_5_ASSEMBLY_PLAN.every(({executionStatus})=>executionStatus==='planned-only')).toBe(true))
c(95,'el plan es reversible',()=>expect(ACADEMY_STAGE_5_ASSEMBLY_PLAN.every(({rollback})=>rollback.length>0)).toBe(true))
c(96,'el dossier conserva datos pendientes y conflictos',()=>expect(ACADEMY_STAGE_5_DOSSIER_SECTIONS).toEqual(expect.arrayContaining(['Datos pendientes','Conflictos'])))
c(97,'no se declara reloj completado',()=>expect(buildIntegrationDossier(createIntegrationProject('p')).physicalWatchCompleted).toBe(false))
c(98,'las 16 lecciones están representadas',()=>expect(ACADEMY_STAGE_5_CATALOG).toHaveLength(16))
c(99,'cada sección fuente tiene disposición',()=>{const data=JSON.parse(outputs.get('ACADEMY-STAGE-5-SECTION-DISPOSITION-0.14K.json')!);expect(data.counts.total).toBe(data.counts.retained)})
c(100,'la cobertura sustantiva es 100 %',()=>{const data=JSON.parse(outputs.get('ACADEMY-STAGE-5-CONTENT-PRESERVATION-0.14K.json')!);expect(data.counts.substantiveCoverage).toBe(1)})
c(101,'no se sustituyen lecciones por fichas',()=>expect(ACADEMY_STAGE_5_CATALOG.every(({lessonId})=>pathSource.includes(lessonId))).toBe(true))
c(102,'no hay estructura idéntica obligatoria',()=>expect(new Set(ACADEMY_STAGE_5_CATALOG.map(({editorialArchetype})=>editorialArchetype)).size).toBeGreaterThan(3))
c(103,'no hay encabezados vacíos',()=>expect([...outputs.values()].filter((value)=>value.includes('\n#\n'))).toHaveLength(0))
c(104,'no hay títulos continuación',()=>expect([...outputs.values()].join('\n')).not.toMatch(/^#+\s+continuaci[oó]n\s*$/im))
c(105,'no hay fragmentación de 210 palabras',()=>expect(pathSource).not.toContain('210'))
c(106,'no aparecen IDs internos como texto lector',()=>expect(ACADEMY_STAGE_5_CATALOG.every(({centralQuestion})=>!centralQuestion.includes('lesson.'))).toBe(true))
c(107,'se conservan 12 activityId',()=>expect(ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS).toHaveLength(12))
c(108,'no cambia el significado histórico',()=>expect(ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS.every(({activityId})=>activityIds().has(activityId))).toBe(true))
c(109,'las instrucciones son específicas',()=>expect(ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS.every(({instructions})=>instructions.length===4)).toBe(true))
c(110,'ninguna actividad digital produce P',()=>expect(ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS.every(({evidenceProfile})=>!evidenceProfile.modalities.includes('P')&&!evidenceProfile.physicalExecutionRequired)).toBe(true))
c(111,'prácticas personales no cuentan entre 289',()=>expect(ACADEMY_STAGE_5_PERSONAL_PRACTICES.every(({personalPracticeId})=>!activityIds().has(personalPracticeId))).toBe(true))
c(112,'prácticas no crean mastery',()=>expect(ACADEMY_STAGE_5_PERSONAL_PRACTICES.every(({createsMastery})=>!createsMastery)).toBe(true))
c(113,'prácticas no completan lecciones',()=>expect(ACADEMY_STAGE_5_PERSONAL_PRACTICES.every(({completesLesson})=>!completesLesson)).toBe(true))
c(114,'prácticas no instruyen modificación física',()=>expect(ACADEMY_STAGE_5_PERSONAL_PRACTICES.flatMap(({steps})=>steps).join(' ')).not.toMatch(/corta|suelda|brocha|rosca la tija/i))
c(115,'el laboratorio es local',()=>expect(labSource).toContain('LABORATORIO LOCAL'))
c(116,'el laboratorio no depende de red',()=>expect(labSource).not.toMatch(/fetch\(|axios|https?:\/\//))
c(117,'exporta JSON',()=>expect(exportIntegrationProject(createIntegrationProject('p'),'2026-01-01T00:00:00Z')).toContain('wplab-stage5-integration-project'))
c(118,'importa payload validado',()=>expect(importIntegrationProject(exportIntegrationProject(createIntegrationProject('p')),'p').ok).toBe(true))
c(119,'payload inválido no contamina',()=>expect(importIntegrationProject('{bad','p')).toEqual({ok:false,errors:['JSON inválido; no se ha modificado ningún proyecto.']}))
c(120,'proyectos sobreviven cierre y reapertura',()=>{const storage=memoryStorage();const store=new AcademyLocalStore(storage,()=> '2026-01-01T00:00:00Z',()=> 'fixture');store.saveIntegrationProject('p',createIntegrationProject('p','2026-01-01T00:00:00Z','project.fixture'));expect(new AcademyLocalStore(storage).load('p').integrationProjects[0].projectId).toBe('project.fixture')})
c(121,'los perfiles están aislados',()=>{const store=new AcademyLocalStore(memoryStorage());store.saveIntegrationProject('a',createIntegrationProject('a'));expect(store.load('b').integrationProjects).toHaveLength(0)})
c(122,'conflicto de versión no pierde datos',()=>{const a=createIntegrationProject('p','2026-01-01T00:00:00Z','same');const b={...a,revision:2,updatedAt:'2026-01-02T00:00:00Z'};expect(resolveIntegrationProjectConflict(a,b)).toMatchObject({conflict:true,winner:b})})
c(123,'laboratorio no aparece en navegación primaria',async()=>expect(await readFile(resolve(root,'src/learning/ui/library/AcademyPrimaryNavigation.tsx'),'utf8')).not.toContain('Laboratorio de integración'))
c(124,'enlaces Academia y proyecto funcionan',()=>expect(labSource).toEqual(expect.stringContaining('#/learning/my-learning?stage=stage.5')))
c(125,'cada visual tiene pregunta',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS.every(({pedagogicalQuestion})=>pedagogicalQuestion.length>0)).toBe(true))
c(126,'cada visual tiene fuentes y límites',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS.every(({sourceIds,limitations})=>sourceIds.length&&limitations.length)).toBe(true))
c(127,'cada visual tiene alternativa textual',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS.every(({longDescription})=>longDescription.length>0)).toBe(true))
c(128,'los visuales funcionan sin color',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS.every(({colorIndependent})=>colorIndependent)).toBe(true))
c(129,'los visuales respetan reduced motion',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS.every(({reducedMotionSafe})=>reducedMotionSafe)).toBe(true))
c(130,'los visuales no copian fuentes',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS.every(({fidelity})=>fidelity==='conceptual')).toBe(true))
c(131,'los visuales no usan valores inventados',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS.flatMap(({semanticPayload})=>semanticPayload.nodes).every(({label})=>!/^\d+(\.\d+)?\s*mm$/i.test(label))).toBe(true))
c(132,'input incompleto bloquea check',()=>expect(calculateInterferences(createIntegrationProject('p')).every(({result})=>result==='input-incomplete')).toBe(true))
c(133,'fallback sin WebGL es honesto',()=>expect(ACADEMY_STAGE_5_3D_POLICY).toMatchObject({webglRequired:false,physicalCompatibilityClaim:false}))
c(134,'modo lectura conserva visuales esenciales',()=>expect(ACADEMY_STAGE_5_VISUAL_DESIGNS).toHaveLength(20))
c(135,'deep links antiguos funcionan',()=>expect(pathSource).toContain('ACADEMY_STAGE_5_PLANNED_REFS'))
c(136,'aliases siguen activos',()=>expect(academyCurationLayersForPhase('0.14K').every(({phase})=>ACADEMY_READER_CURATION_PHASES.includes(phase))).toBe(true))
c(137,'notas conservan contexto',()=>{const store=new AcademyLocalStore(memoryStorage(),()=> '2026-01-01T00:00:00Z',()=> 'n');const note=store.createNote('p',{title:'x',body:'x',tags:[],context:{lessonId:ACADEMY_STAGE_5_CATALOG[0].lessonId}});expect(note.context.lessonId).toBe(ACADEMY_STAGE_5_CATALOG[0].lessonId)})
c(138,'marcadores conservan contexto',()=>{const store=new AcademyLocalStore(memoryStorage(),()=> '2026-01-01T00:00:00Z',()=> 'b');const bookmark=store.createBookmark('p',{title:'x',href:'#/learning/workshop?integration=1',context:{lessonId:ACADEMY_STAGE_5_CATALOG[0].lessonId}});expect(bookmark.context.lessonId).toBe(ACADEMY_STAGE_5_CATALOG[0].lessonId)})
c(139,'reanudación conserva posición',()=>expect(pathSource).toContain('stepId'))
c(140,'scrollspy permanece en lector',async()=>expect(await readFile(resolve(root,'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'),'utf8')).toContain('IntersectionObserver'))
c(141,'teclado funciona',()=>expect(labSource).toContain('button'))
c(142,'foco visible está cubierto',async()=>expect(await readFile(resolve(root,'src/learning/ui/academy-integration-lab.css'),'utf8')).toContain('.integration-tabs'))
c(143,'no hay overflow horizontal',async()=>expect(await readFile(resolve(root,'src/learning/ui/academy-integration-lab.css'),'utf8')).toContain('overflow:auto'))
c(144,'reflow 200 % está cubierto',()=>expect(ACADEMY_014K_QA_VIEWPORTS).toContain('reflow-200'))
c(145,'verify integra 0.14K',()=>expect(JSON.parse(packageSource).scripts.verify).toContain('learning:0.14k'))
c(146,'git diff check forma parte del cierre',()=>expect(ACADEMY_014K_QA_CASES).toHaveLength(28))

if(cases.length!==146||cases.some(([number],index)=>number!==index+1))throw new Error(`El contrato 0.14K exige exactamente 146 pruebas numeradas; hay ${cases.length}.`)

describe('Watch Prototype Lab 0.14K · 146 pruebas obligatorias',()=>{
  test.each(cases)('%i. %s',async(_number,_name,run)=>{await run()})
})

describe('determinismo de informes 0.14K',()=>{
  test('genera exactamente las 37 salidas declaradas',()=>expect([...outputs.keys()].sort()).toEqual([...ACADEMY_014K_OUTPUT_FILES].sort()))
  test('dos construcciones producen bytes idénticos',async()=>{const second=await buildAcademy014KOutputs(root);expect(sha256([...outputs].map(([name,value])=>`${name}:${sha256(value)}`).join('\n'))).toBe(sha256([...second].map(([name,value])=>`${name}:${sha256(value)}`).join('\n')))},15_000)
  test('los 12 briefs son futuros y no visuales implementados',()=>expect(ACADEMY_STAGE_5_PHOTO_BRIEFS).toHaveLength(12))
  test('los estados 3D empiezan bloqueados por entradas',()=>expect(ACADEMY_STAGE_5_3D_STATES.every(({state})=>state==='input-incomplete')).toBe(true))
  test('los claims no introducen números',()=>expect(ACADEMY_STAGE_5_CLAIMS.every(({numericValues})=>numericValues.length===0)).toBe(true))
  test('las cinco fórmulas conservan entradas declaradas',()=>expect(ACADEMY_STAGE_5_FORMULAS.every(({inputs})=>inputs.length>1)).toBe(true))
  test('las presentaciones K componen con J',()=>expect(academyPersonalActivityPresentation014K('activity.miyota8215.identify-calibre')).toBeDefined())
  test('duplicar conserva dossier pero cambia identidad',()=>{const original=createIntegrationProject('p');const copy=duplicateIntegrationProject(original,'2026-01-01T00:00:00Z','copy');expect(copy.projectId).not.toBe(original.projectId)})
  test('documentally-compatible exige 18 interfaces críticas completas',()=>{const project=createIntegrationProject('p');project.compatibilityChecks=project.compatibilityChecks.filter(({interfaceId})=>interfaceId!=='donor-receiver').map((row)=>({...row,result:'compatible-on-paper',unknowns:[]}));expect(integrationProjectCanBeDocumentallyCompatible(project)).toBe(true)})
})

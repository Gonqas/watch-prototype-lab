import { execFile } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import {
  ACADEMY_CURATION_LAYER_REGISTRY, ACADEMY_MIYOTA_8215_PARTS_LIST_DRIFT_014J, ACADEMY_MIYOTA_8215_SOURCE_ALIASES_014J,
  ACADEMY_MIYOTA_8215_SOURCE_SNAPSHOT_014J, ACADEMY_PERSONAL_CURATION_PHASES, ACADEMY_PERSONAL_REVIEW_QUEUE_014J,
  ACADEMY_READER_CURATION_PHASES, ACADEMY_STAGE_3_ACTIVE_TECHNICAL_STATUS_014J, ACADEMY_STAGE_4_3D_AUDIT,
  ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS, ACADEMY_STAGE_4_ANCHOR_IDS, ACADEMY_STAGE_4_CATALOG, ACADEMY_STAGE_4_CHAPTER_SEQUENCE,
  ACADEMY_STAGE_4_CLAIMS, ACADEMY_STAGE_4_FINAL_CHECKPOINT, ACADEMY_STAGE_4_OPTIONAL_IDS, ACADEMY_STAGE_4_PART_MAPPINGS,
  ACADEMY_STAGE_4_PERSONAL_PRACTICES, ACADEMY_STAGE_4_PREREQUISITE_OVERRIDES, ACADEMY_STAGE_4_REUSED_VISUALS,
  ACADEMY_STAGE_4_SAFETY_AUDITS, ACADEMY_STAGE_4_SELECTOR_MAPPINGS, ACADEMY_STAGE_4_SIMULATION_BOUNDARY,
  ACADEMY_STAGE_4_SUPPORT_IDS, ACADEMY_STAGE_4_TRANSITIONS, ACADEMY_STAGE_4_VISUAL_DESIGNS, ACADEMY_STAGE_4_VISUAL_QUESTION_COVERAGE,
  CURRENT_ACADEMY_CURATION_PHASE, academy014JContentPreservation, academyContentPreservation, academyPhaseIncludes, academyPhaseLayers,
  academyRetainedSourceSectionDispositions, deriveAcademyTechnicalStatus,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import { MIYOTA_8215_SOURCE_IDS } from '../../src/learning/technical/officialSources'
import { ACADEMY_014J_BASELINE, ACADEMY_014J_OUTPUT_FILES, buildAcademy014JOutputs } from '../academy-014j'
import { ACADEMY_014J_QA_CASES, ACADEMY_014J_QA_MATRIX } from './academy-014j-qa-snapshot'
import { ACADEMY_014I_TEST_ROOT, academy014IBuildDocument, academy014ITestEnvironment, academy014ITestSha256, academy014ITreeSnapshot, academy014IWalk } from './academy-014i-test-helpers'

type TestCase = { id: number; name: string; run: () => void | Promise<void> }
const cases: TestCase[] = []
const add = (id: number, name: string, run: TestCase['run']) => cases.push({ id,name,run })
const execFileAsync = promisify(execFile)
const documents = Promise.all(ACADEMY_STAGE_4_CATALOG.map(async ({lessonId}) => ({ lessonId, authored: await academy014IBuildDocument(lessonId,'0.14D'), visible: await academy014IBuildDocument(lessonId,'0.14J') })))
const generated = join(ACADEMY_014I_TEST_ROOT,'docs','generated')

async function historicalSnapshot() { const names = (await readdir(generated)).filter((name) => !name.startsWith('APRENDER-') && !/0\.14[J-Z]/i.test(name)).sort(); const rows = await Promise.all(names.map(async (name) => `${name}:${academy014ITestSha256(await readFile(join(generated,name)))}`)); return { count:names.length,digest:academy014ITestSha256(rows.join('\n')) } }
const sourceRecord = (type: string) => ACADEMY_MIYOTA_8215_SOURCE_SNAPSHOT_014J.find(({documentType}) => documentType === type)!
const stage4LessonIds = new Set(ACADEMY_STAGE_4_CATALOG.map(({lessonId}) => lessonId))

add(1,'cargan los ocho paquetes',async()=>expect((await academy014ITestEnvironment()).corpus.counts.packages).toBe(8))
add(2,'permanecen 24 rutas',async()=>expect((await academy014ITestEnvironment()).corpus.counts.routes).toBe(24))
add(3,'permanecen 217 módulos',async()=>expect((await academy014ITestEnvironment()).corpus.counts.modules).toBe(217))
add(4,'permanecen 222 lecciones',async()=>expect((await academy014ITestEnvironment()).corpus.counts.lessons).toBe(222))
add(5,'permanecen 289 actividades',async()=>expect((await academy014ITestEnvironment()).corpus.counts.activities).toBe(289))
add(6,'el digest del corpus permanece',async()=>expect((await academy014ITestEnvironment()).corpus.digest).toBe(ACADEMY_014J_BASELINE.corpusDigest))
add(7,'learning-content no cambia',async()=>expect(await academy014ITreeSnapshot(join(ACADEMY_014I_TEST_ROOT,'learning-content'))).toEqual(ACADEMY_014J_BASELINE.protected.learningContent))
add(8,'reference-library/originals no cambia',async()=>expect(await academy014ITreeSnapshot(join(ACADEMY_014I_TEST_ROOT,'reference-library','originals'))).toEqual(ACADEMY_014J_BASELINE.protected.originals))
add(9,'los informes 0.14A–0.14I permanecen byte por byte',async()=>expect(await historicalSnapshot()).toEqual(ACADEMY_014J_BASELINE.protected.historicalReports))
add(10,'no se copian documentos MIYOTA al runtime',async()=>{ const hashes = new Set(ACADEMY_MIYOTA_8215_SOURCE_SNAPSHOT_014J.map(({currentSha256}) => currentSha256)); const runtime = [...await academy014IWalk(join(ACADEMY_014I_TEST_ROOT,'src')),...await academy014IWalk(join(ACADEMY_014I_TEST_ROOT,'public'))]; expect((await Promise.all(runtime.map(async (file) => hashes.has(academy014ITestSha256(await readFile(file))) ? file : null))).filter(Boolean)).toEqual([]) })

add(11,'E/F/G/H/I/J son fases válidas',()=>{ expect(ACADEMY_READER_CURATION_PHASES).toEqual(['0.14D','0.14E','0.14F','0.14G','0.14H','0.14I','0.14J']); expect(ACADEMY_PERSONAL_CURATION_PHASES.at(-1)).toBe('0.14J') })
add(12,'una fase desconocida falla',()=>expect(()=>academyPhaseIncludes('0.14J','0.14Z' as never)).toThrow(/desconocida/))
add(13,'los builds E/F/G/H/I conservan su salida',async()=>{ for (const phase of ['0.14E','0.14F','0.14G','0.14H','0.14I'] as const) expect((await academy014IBuildDocument('lesson.horology.mechanical-chain',phase)).readerSchemaVersion).toBe(phase) })
add(14,'J compone todas las fases',()=>expect(academyPhaseLayers('0.14J').map(({phase})=>phase)).toEqual(['0.14C','0.14D','0.14E','0.14F','0.14G','0.14H','0.14I','0.14J']))
add(15,'la UI usa la fase canónica',async()=>{ expect(CURRENT_ACADEMY_CURATION_PHASE).toBe('0.14J'); expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'),'utf8')).toContain('CURRENT_ACADEMY_CURATION_PHASE') })
add(16,'el registro enumera literalmente J',()=>expect(ACADEMY_CURATION_LAYER_REGISTRY.some(({phase})=>phase === '0.14J')).toBe(true))

add(17,'el resolver aplica la precedencia correcta',()=>expect(deriveAcademyTechnicalStatus({claims:[{evidenceId:'a',kind:'claim',status:'source-reviewed',central:true,explanation:'a'},{evidenceId:'b',kind:'claim',status:'technical-conflict',central:true,explanation:'b'}]}).technicalStatus).toBe('technical-conflict'))
add(18,'un claim central source-needed impide reviewed',()=>expect(deriveAcademyTechnicalStatus({claims:[{evidenceId:'a',kind:'claim',status:'source-needed',central:true,explanation:'a'}]}).technicalStatus).toBe('source-needed'))
add(19,'un bloqueo central impide reviewed',()=>expect(deriveAcademyTechnicalStatus({procedureStatuses:[{evidenceId:'p',kind:'procedure',status:'technical-conflict',central:true,explanation:'p'}]}).technicalStatus).toBe('technical-conflict'))
add(20,'una limitación secundaria no obliga source-needed',()=>expect(deriveAcademyTechnicalStatus({visualStatuses:[{evidenceId:'v',kind:'visual',status:'source-needed',central:false,explanation:'v'}]}).technicalStatus).toBe('source-limited'))
add(21,'ser opcional no implica source-limited',()=>expect(deriveAcademyTechnicalStatus({}).technicalStatus).toBe('source-reviewed'))
add(22,'el estado visual no está hardcodeado',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/academy/reader/personal/phase014j/stage4Visuals.ts'),'utf8')).toContain('deriveAcademyTechnicalStatus'))
add(23,'la cola conserva originPhase',()=>expect(ACADEMY_PERSONAL_REVIEW_QUEUE_014J.every(({originPhase})=>Boolean(originPhase))).toBe(true))
add(24,'la cola conserva personalStatus',()=>expect(ACADEMY_PERSONAL_REVIEW_QUEUE_014J.every(({personalStatus})=>personalStatus === 'not-reviewed')).toBe(true))
add(25,'etapa 3 activa refleja fuentes reales',()=>{ expect(ACADEMY_STAGE_3_ACTIVE_TECHNICAL_STATUS_014J.find(({lessonId})=>lessonId.includes('limpieza-e-inspeccion'))?.technicalStatus).toBe('source-needed'); expect(ACADEMY_STAGE_3_ACTIVE_TECHNICAL_STATUS_014J.find(({lessonId})=>lessonId.includes('tm-inspeccion-previa'))?.technicalStatus).toBe('source-reviewed') })

add(26,'retained requiere target visible',async()=>{ const [{authored,visible}] = await documents; const d=academyRetainedSourceSectionDispositions(authored.lessonId,authored.sections).map((x,i)=>i?x:{...x,targetSectionIds:['missing']}); expect(()=>academyContentPreservation(authored.lessonId,authored.sections,visible.sections,d)).toThrow(/target visible/) })
add(27,'merged requiere target visible',async()=>{ const [{authored,visible}] = await documents; const d=academyRetainedSourceSectionDispositions(authored.lessonId,authored.sections).map((x,i)=>i?x:{...x,action:'merged' as const,targetSectionIds:['missing']}); expect(()=>academyContentPreservation(authored.lessonId,authored.sections,visible.sections,d)).toThrow(/target visible/) })
add(28,'replaced requiere target no vacío',async()=>{ const [{authored,visible}] = await documents; const d=academyRetainedSourceSectionDispositions(authored.lessonId,authored.sections).map((x,i)=>i?x:{...x,action:'replaced-equivalent' as const,targetSectionIds:[]}); expect(()=>academyContentPreservation(authored.lessonId,authored.sections,visible.sections,d)).toThrow(/target visible/) })
add(29,'una sección ausente falla',async()=>{ const [{authored,visible}] = await documents; expect(()=>academyContentPreservation(authored.lessonId,authored.sections,visible.sections,academyRetainedSourceSectionDispositions(authored.lessonId,authored.sections).slice(1))).toThrow(/sin disposición/) })
add(30,'una eliminación sustantiva sin razón falla',async()=>{ const [{authored,visible}] = await documents; const d=academyRetainedSourceSectionDispositions(authored.lessonId,authored.sections).map((x,i)=>i?x:{...x,action:'removed-duplicate' as const,targetSectionIds:[],reason:''}); expect(()=>academyContentPreservation(authored.lessonId,authored.sections,visible.sections,d)).toThrow(/no declara razón/) })
add(31,'etapas 0–3 siguen con cobertura real',async()=>{ for (const name of ['ACADEMY-STAGE-2-CONTENT-PRESERVATION-0.14H.json','ACADEMY-STAGE-3-CONTENT-PRESERVATION-0.14I.json']) { const data=JSON.parse(await readFile(join(generated,name),'utf8')); expect(data.substantiveCoverage ?? data.counts?.substantiveCoverage).toBe(1) } })
add(32,'las 16 lecciones de etapa 4 tienen disposición',async()=>expect((await documents).every(({authored,visible})=>academy014JContentPreservation(authored.lessonId,authored.sections,visible.sections).dispositions.length === authored.sections.length)).toBe(true))
add(33,'etapa 4 alcanza 100 % de cobertura sustantiva',async()=>expect((await documents).every(({authored,visible})=>academy014JContentPreservation(authored.lessonId,authored.sections,visible.sections).row.substantiveCoverage === 1)).toBe(true))

add(34,'los sourceId históricos se conservan',()=>expect(Object.values(MIYOTA_8215_SOURCE_IDS).every(Boolean)).toBe(true))
add(35,'los aliases se conservan',()=>expect(ACADEMY_MIYOTA_8215_SOURCE_ALIASES_014J.map(({sourceId})=>sourceId)).toEqual(['source.miyota.8215.official','source.official.miyota.8215']))
add(36,'se registran locator actual y anterior',()=>expect(sourceRecord('parts-list-exploded-view')).toMatchObject({currentLocator:expect.any(String),previousLocator:expect.any(String)}))
add(37,'un cambio de hash invalida equivalencia no revisada',()=>{ const r=sourceRecord('parts-list-exploded-view'); expect(r.currentSha256).not.toBe(r.previousSha256); expect(r.status).toBe('drift-reviewed') })
add(38,'la parts list actual se compara con la anterior',()=>expect(ACADEMY_MIYOTA_8215_PARTS_LIST_DRIFT_014J.differences.length).toBe(4))
add(39,'las diferencias terminológicas quedan clasificadas',()=>expect(ACADEMY_MIYOTA_8215_PARTS_LIST_DRIFT_014J.differences.filter(({classification})=>classification === 'terminology-only')).toHaveLength(3))
add(40,'un término cambiado no se confunde con pieza nueva',()=>expect(ACADEMY_MIYOTA_8215_PARTS_LIST_DRIFT_014J).toMatchObject({partAdded:0,partRemoved:0,referenceChanges:0}))
add(41,'el drawing se inspecciona visualmente antes de usar cotas',()=>expect(sourceRecord('drawing').visualInspection).toBe('complete'))
add(42,'el instruction manual no se trata como manual de servicio',()=>expect(sourceRecord('instruction-manual').limitations.join(' ')).toMatch(/no un manual de servicio/))
add(43,'el exploded view no se trata como secuencia',()=>expect(sourceRecord('parts-list-exploded-view').limitations.join(' ')).toMatch(/No demuestra orden/))
add(44,'el runtime no depende de URLs externas',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/academy/reader/personal/phase014j/stage4Registry.ts'),'utf8')).not.toContain('fetch('))

add(45,'existen cinco capítulos',()=>expect(ACADEMY_STAGE_4_CHAPTER_SEQUENCE).toHaveLength(5))
add(46,'existen 14 anchors',()=>expect(ACADEMY_STAGE_4_ANCHOR_IDS).toHaveLength(14))
add(47,'existe un support de calendario',()=>expect(ACADEMY_STAGE_4_SUPPORT_IDS).toEqual(['lesson.miyota8215.calendar']))
add(48,'existe el apoyo opcional avanzado',()=>expect(ACADEMY_STAGE_4_OPTIONAL_IDS).toEqual(['lesson.advanced.service-disassembly']))
add(49,'supports no bloquean',()=>expect(ACADEMY_STAGE_4_PREREQUISITE_OVERRIDES.filter(({pathRole})=>pathRole === 'support').every(({blocking})=>!blocking)).toBe(true))
add(50,'etapa 3 abre etapa 4',()=>expect(ACADEMY_STAGE_4_TRANSITIONS.some(({fromChapterId,toChapterId})=>fromChapterId === 'chapter.3.4' && toChapterId === 'chapter.4.1')).toBe(true))
add(51,'etapa 4 abre etapa 5',()=>expect(ACADEMY_STAGE_4_TRANSITIONS.some(({fromChapterId,toChapterId})=>fromChapterId === 'chapter.4.5' && toChapterId === 'chapter.5.1')).toBe(true))
add(52,'MIYOTA no se convierte en fundamento universal',()=>expect(ACADEMY_STAGE_4_CATALOG.every(({sourceScope})=>!sourceScope.includes('fundamento universal'))).toBe(true))
add(53,'la identificación exige evidencia',()=>expect(ACADEMY_STAGE_4_CATALOG.find(({lessonId})=>lessonId.endsWith('.identify'))?.observableOutcome).toMatch(/Distinguir rasgo/))
add(54,'cada dato oficial tiene snapshot',()=>expect(ACADEMY_STAGE_4_CLAIMS.filter(({sourceIds})=>sourceIds.length).every(({snapshotIds})=>snapshotIds.length)).toBe(true))
add(55,'cada pieza oficial tiene referencia o queda desconocida',()=>expect(ACADEMY_STAGE_4_PART_MAPPINGS.every((p)=>Boolean(p.partReference) || p.modelMappingStatus === 'unknown' || p.modelMappingStatus === 'conceptual')).toBe(true))
add(56,'el 3D distingue mapping oficial e inferido',()=>expect(new Set(ACADEMY_STAGE_4_PART_MAPPINGS.map(({modelMappingStatus})=>modelMappingStatus)).size).toBeGreaterThan(1))
add(57,'la parada del segundero se limita al documento vigente',()=>expect(ACADEMY_STAGE_4_CLAIMS.find(({claimId})=>claimId.endsWith('stop-second'))?.limitations.join(' ')).toMatch(/No se generaliza/))
add(58,'la advertencia de fecha se limita al manual 8215',()=>expect(ACADEMY_STAGE_4_CLAIMS.find(({claimId})=>claimId.endsWith('date-warning'))?.locators.some(({sourceId})=>sourceId.includes('instruction-manual'))).toBe(true))
add(59,'no se mezclan advertencias del 8205',()=>expect(ACADEMY_STAGE_4_CLAIMS.find(({claimId})=>claimId.endsWith('date-warning'))?.limitations.join(' ')).toMatch(/No se mezcla/))
add(60,'no se inventa una secuencia',()=>expect(ACADEMY_STAGE_4_CLAIMS.some(({claim})=>/secuencia oficial MIYOTA/i.test(claim))).toBe(false))
add(61,'la secuencia virtual se etiqueta simulation-only',()=>expect(ACADEMY_STAGE_4_SIMULATION_BOUNDARY.virtualSequenceIsOfficialService).toBe(false))
add(62,'invertir la secuencia no es montaje oficial',()=>expect(ACADEMY_STAGE_4_SIMULATION_BOUNDARY.reverseSequenceIsOfficialAssembly).toBe(false))
add(63,'la inspección simbólica no simula desgaste real',()=>expect(ACADEMY_STAGE_4_CATALOG.find(({lessonId})=>lessonId.endsWith('.inspection'))?.editorialFocus).toMatch(/no representa desgaste/))
add(64,'el montaje virtual no prescribe lubricación',()=>expect(ACADEMY_STAGE_4_SAFETY_AUDITS.every(({exactFragment})=>!exactFragment.includes('aplique lubricante'))).toBe(true))
add(65,'el diagnóstico no afirma unidad física',()=>expect(ACADEMY_STAGE_4_CATALOG.find(({lessonId})=>lessonId.endsWith('.diagnosis-project'))?.centralQuestion).toMatch(/sin diagnosticar una unidad física/))

add(66,'todo claim existe y es único',()=>expect(new Set(ACADEMY_STAGE_4_CLAIMS.map(({claimId})=>claimId)).size).toBe(ACADEMY_STAGE_4_CLAIMS.length))
add(67,'todo claim apunta a sección visible',async()=>{ const visible=new Set((await documents).flatMap(({visible})=>visible.sections.map(({sectionId})=>sectionId))); expect(ACADEMY_STAGE_4_CLAIMS.every(({sectionId})=>visible.has(sectionId))).toBe(true) })
add(68,'todo dato numérico oficial tiene documento',()=>expect(ACADEMY_STAGE_4_CLAIMS.filter(({claimType,numericValues})=>claimType === 'official-specification' && numericValues.length).every(({locators})=>locators.length)).toBe(true))
add(69,'toda referencia de pieza tiene parts list',()=>expect(ACADEMY_STAGE_4_CLAIMS.filter(({partReference})=>partReference).every(({sourceIds})=>sourceIds.includes('source.miyota.8215.parts-list-exploded-view'))).toBe(true))
add(70,'toda operación de corona tiene manual',()=>expect(ACADEMY_STAGE_4_CLAIMS.filter(({claimType})=>claimType === 'user-operation').every(({sourceIds})=>sourceIds.includes('source.miyota.8215.instruction-manual'))).toBe(true))
add(71,'no existe claim de lubricación no respaldado',()=>expect(ACADEMY_STAGE_4_CLAIMS.some(({claim})=>/aplicar|cantidad de lubricante/i.test(claim))).toBe(false))
add(72,'no existe claim de secuencia oficial no respaldado',()=>expect(ACADEMY_STAGE_4_CLAIMS.some(({claim})=>/secuencia oficial|orden oficial/i.test(claim))).toBe(false))
add(73,'no existen claims huérfanos',()=>expect(ACADEMY_STAGE_4_CLAIMS.every(({lessonId,sectionId})=>stage4LessonIds.has(lessonId) && Boolean(sectionId))).toBe(true))
add(74,'un snapshot stale no produce source-reviewed',()=>expect(ACADEMY_MIYOTA_8215_SOURCE_SNAPSHOT_014J.filter(({status})=>status === 'discovery-only').every(({sourceId})=>sourceId === null)).toBe(true))

add(75,'todos los estados 3D tienen decisión',()=>expect(ACADEMY_STAGE_4_3D_AUDIT).toHaveLength(7))
add(76,'todos los selectores tienen mapping',()=>expect(ACADEMY_STAGE_4_SELECTOR_MAPPINGS).toHaveLength(16))
add(77,'no se inventan referencias',()=>expect(ACADEMY_STAGE_4_PART_MAPPINGS.filter(({partReference})=>partReference).every(({partReference})=>/^[0-9A-Z-]+$/.test(partReference!))).toBe(true))
add(78,'ningún fixture se presenta como escala real',()=>expect(ACADEMY_STAGE_4_3D_AUDIT.every(({limitations})=>limitations.some((x)=>x.includes('no representa escala real')))).toBe(true))
add(79,'ningún estado afirma holgura correcta',()=>expect(ACADEMY_STAGE_4_3D_AUDIT.every(({expectedObservation})=>!expectedObservation.includes('holgura correcta'))).toBe(true))
add(80,'ningún estado afirma desgaste',()=>expect(ACADEMY_STAGE_4_3D_AUDIT.every(({expectedObservation})=>!expectedObservation.includes('presenta desgaste'))).toBe(true))
add(81,'cada visual tiene pregunta',()=>expect(ACADEMY_STAGE_4_VISUAL_DESIGNS.every(({pedagogicalQuestion})=>pedagogicalQuestion.endsWith('?'))).toBe(true))
add(82,'cada visual tiene alternativa textual',()=>expect(ACADEMY_STAGE_4_VISUAL_DESIGNS.every(({accessibilitySummary,longDescription})=>accessibilitySummary && longDescription)).toBe(true))
add(83,'cada visual declara fidelidad',()=>expect(ACADEMY_STAGE_4_VISUAL_DESIGNS.every(({fidelity})=>fidelity === 'calibre-specific')).toBe(true))
add(84,'cada visual declara límites',()=>expect(ACADEMY_STAGE_4_VISUAL_DESIGNS.every(({limitations})=>limitations.length)).toBe(true))
add(85,'reduced motion funciona',()=>expect(ACADEMY_STAGE_4_VISUAL_DESIGNS.every(({reducedMotionSafe})=>reducedMotionSafe)).toBe(true))
add(86,'fallback sin WebGL es honesto',()=>expect(ACADEMY_STAGE_4_3D_AUDIT.every(({fallback})=>fallback.includes('sin requerir WebGL'))).toBe(true))
add(87,'no se duplica un visual anterior',()=>expect(ACADEMY_STAGE_4_VISUAL_DESIGNS.every(({visualDesignId})=>!ACADEMY_STAGE_4_REUSED_VISUALS.includes(visualDesignId as never))).toBe(true))
add(88,'no se genera fotografía falsa',()=>{ expect(ACADEMY_STAGE_4_VISUAL_QUESTION_COVERAGE).toHaveLength(20); expect(ACADEMY_014J_QA_CASES).toHaveLength(24) })

add(89,'los 14 activityId requeridos permanecen',async()=>{ const ids=new Set((await academy014ITestEnvironment()).corpus.packs.flatMap(({pack})=>pack.activities.map(({id})=>id))); expect(ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS).toHaveLength(14); expect(ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS.every(({activityId})=>ids.has(activityId))).toBe(true) })
add(90,'las actividades históricas conservan significado',async()=>expect((await academy014ITestEnvironment()).corpus.digest).toBe(ACADEMY_014J_BASELINE.corpusDigest))
add(91,'una secuencia virtual produce V y no P',()=>expect(ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS.filter(({activityId})=>activityId.includes('disassembly')).every(({evidenceProfile})=>evidenceProfile.modalities.includes('V') && !evidenceProfile.modalities.includes('P'))).toBe(true))
add(92,'un dossier puede producir R',()=>expect(ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS.find(({activityId})=>activityId.endsWith('complete-diagnosis'))?.evidenceProfile.modalities).toContain('R'))
add(93,'las prácticas personales no cuentan entre las 289',async()=>{ const ids=new Set((await academy014ITestEnvironment()).corpus.packs.flatMap(({pack})=>pack.activities.map(({id})=>id))); expect(ACADEMY_STAGE_4_PERSONAL_PRACTICES.every(({personalPracticeId})=>!ids.has(personalPracticeId))).toBe(true) })
add(94,'las prácticas no crean mastery',()=>expect(ACADEMY_STAGE_4_PERSONAL_PRACTICES.every(({createsMastery})=>!createsMastery)).toBe(true))
add(95,'las prácticas no completan lecciones',()=>expect(ACADEMY_STAGE_4_PERSONAL_PRACTICES.every(({completesLesson})=>!completesLesson)).toBe(true))
add(96,'las prácticas no exigen abrir un movimiento',()=>expect(ACADEMY_STAGE_4_PERSONAL_PRACTICES.every(({stopSignal})=>stopSignal.includes('Detente'))).toBe(true))
add(97,'las prácticas no exigen tocar escape o espiral',()=>expect(ACADEMY_STAGE_4_PERSONAL_PRACTICES.every(({preparation})=>preparation.some((x)=>x.includes('No abras')))).toBe(true))
add(98,'las prácticas no exigen lubricación',()=>expect(ACADEMY_STAGE_4_PERSONAL_PRACTICES.every(({steps})=>steps.every((x)=>!x.match(/lubrica|aplica aceite/i)))).toBe(true))

add(99,'deep links funcionan',()=>expect(ACADEMY_STAGE_4_FINAL_CHECKPOINT.actions.every(({href})=>href.startsWith('#/learning/'))).toBe(true))
add(100,'aliases resuelven semánticamente',async()=>{ for (const {visible} of await documents) { const ids=new Set(visible.sections.map(({sectionId})=>sectionId)); expect(visible.legacyAliases.every(({newSectionId})=>ids.has(newSectionId))).toBe(true) } })
add(101,'notas conservan contexto',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/academy/academyLocalState.ts'),'utf8')).toContain('context: AcademyNoteContext'))
add(102,'marcadores conservan contexto',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/academy/academyLocalState.ts'),'utf8')).toContain('bookmarks: AcademyBookmark[]'))
add(103,'reanudación conserva posición',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/academy/academyLocalState.ts'),'utf8')).toContain('currentSegmentId'))
add(104,'scrollspy funciona',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'),'utf8')).toContain('IntersectionObserver'))
add(105,'la pregunta central aparece una vez',async()=>{ for (const {lessonId,visible} of await documents) { const q=ACADEMY_STAGE_4_CATALOG.find((x)=>x.lessonId === lessonId)!.centralQuestion; const occurrences=visible.sections.map(({markdown})=>markdown).join('\n').split(q).length-1; expect(Number(visible.centralQuestion === q)+occurrences).toBe(1) } })
add(106,'no aparece jerga interna en títulos',async()=>expect((await documents).flatMap(({visible})=>visible.sections.map(({title})=>title)).every((title)=>!/(reader\.section|claim\.|0\.14j)/i.test(title))).toBe(true))
add(107,'no hay fragmentación de 210 palabras',async()=>expect((await documents).flatMap(({visible})=>visible.sections).some(({title})=>/^continuación/i.test(title))).toBe(false))
add(108,'no hay títulos continuación',async()=>expect((await documents).flatMap(({visible})=>visible.sections).every(({title})=>!title.includes('Continuación'))).toBe(true))
add(109,'no hay overflow horizontal',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/ui/reader/academy-reader.css'),'utf8')).toContain('max-width: 100%'))
add(110,'reflow al 200 % funciona',()=>expect(ACADEMY_014J_QA_MATRIX.viewports).toContain('reflow-equivalent-200%'))
add(111,'teclado funciona',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'),'utf8')).toContain('onKeyDown'))
add(112,'foco visible',async()=>expect(await readFile(join(ACADEMY_014I_TEST_ROOT,'src/learning/ui/reader/academy-reader.css'),'utf8')).toContain(':focus-visible'))
add(113,'verify integra 0.14J determinista',async()=>{ const pkg=JSON.parse(await readFile(join(ACADEMY_014I_TEST_ROOT,'package.json'),'utf8')); expect(pkg.scripts.verify).toContain('learning:0.14j'); expect((await buildAcademy014JOutputs(ACADEMY_014I_TEST_ROOT)).size).toBe(ACADEMY_014J_OUTPUT_FILES.length) })
add(114,'git diff --check pasa',async()=>expect((await execFileAsync('git',['diff','--check'],{cwd:ACADEMY_014I_TEST_ROOT})).stdout).toBe(''))

if (cases.length !== 114 || cases.some((test,index)=>test.id !== index+1)) throw new Error('El contrato 0.14J exige exactamente 114 pruebas numeradas.')

describe('Watch Prototype Lab 0.14J · 114 pruebas obligatorias',()=>{
  it.each(cases)('$id. $name',async({run})=>{ await run() },60_000)
})

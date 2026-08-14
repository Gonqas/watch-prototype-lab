import type {
  CurriculumStage,
  ExecutionTier,
  LearningArchetype,
} from '../../src/learning/governance/editorialGovernance'

export const ACADEMY_PACKAGE_NAMES = [
  'horology-foundations',
  'quartz-miyota2035',
  'mechanical-foundations',
  'miyota8215',
  'inspection-metrology',
  'advanced-watchmaking',
  'watchmaking-capstone',
  'watchmaking-encyclopedia',
] as const

export const ORIGINAL_SOURCE_FILES = [
  {
    fileName: 'Chicago CD.iso',
    sourceId: 'source.private.chicago.volume',
    title: 'Chicago School of Watchmaking CD',
    authorOrEntity: 'Chicago School of Watchmaking',
    sourceType: 'archival-course',
    languages: ['en'],
    ocrQuality: 'mixed',
    imageAvailability: 'yes',
    pages: null,
  },
  {
    fileName: 'Horologia_completa_OCR_ligera_100MB.pdf',
    sourceId: 'source.private.daniels.watchmaking-volume',
    title: 'George Daniels - Watchmaking - searchable OCR edition',
    authorOrEntity: 'George Daniels',
    sourceType: 'private-book',
    languages: ['en'],
    ocrQuality: 'mixed',
    imageAvailability: 'yes',
    pages: 425,
  },
  {
    fileName: 'horologia_sistema4b_blueprint_v0.1.zip',
    sourceId: 'source.project.system4b-blueprint',
    title: 'Horologia sistema 4B blueprint v0.1',
    authorOrEntity: 'Watch Prototype Lab',
    sourceType: 'original-educational-content',
    languages: ['es'],
    ocrQuality: 'native-text',
    imageAvailability: 'partial',
    pages: null,
  },
  {
    fileName: 'Joseph Bulova School of Watch Making.pdf',
    sourceId: 'source.private.bulova.volume',
    title: 'Joseph Bulova School of Watch Making',
    authorOrEntity: 'Joseph Bulova School of Watchmaking',
    sourceType: 'historical-training-manual',
    languages: ['en'],
    ocrQuality: 'unknown',
    imageAvailability: 'yes',
    pages: 283,
  },
  {
    fileName: 'Theory of Horology-20260809T132232Z-1-001.zip',
    sourceId: 'source.private.theory-of-horology.volume',
    title: 'Theory of Horology - local chapter archive',
    authorOrEntity: 'Swiss watchmaking training corpus',
    sourceType: 'institutional-textbook',
    languages: ['en'],
    ocrQuality: 'unknown',
    imageAvailability: 'yes',
    pages: null,
  },
  {
    fileName: 'TM 9-1575.pdf',
    sourceId: 'source.private.tm9-1575.volume',
    title: 'TM 9-1575 - Ordnance Maintenance: Wrist Watches, Pocket Watches, Stop Watches, and Clocks',
    authorOrEntity: 'United States War Department',
    sourceType: 'official-historical-manual',
    languages: ['en'],
    ocrQuality: 'unknown',
    imageAvailability: 'yes',
    pages: 227,
  },
  {
    fileName: 'VBAUhrentechnik.zip',
    sourceId: 'source.private.vba-uhrentechnik-volume',
    title: 'VBA Uhrentechnik calculation corpus',
    authorOrEntity: 'Horological calculation corpus',
    sourceType: 'technical-reference',
    languages: ['de', 'fr'],
    ocrQuality: 'native-text',
    imageAvailability: 'partial',
    pages: null,
  },
] as const

export interface ChicagoInventoryEntry {
  lessonNumber: string
  fileName: string
  title: string
  pages: number
  textExtractionQuality: 'good' | 'mixed' | 'poor'
  imagePresence: 'yes'
  subjects: string[]
  probableArchetype: LearningArchetype
  historicalRisks: string[]
  recommendedStage: CurriculumStage
  recommendedUse: string
  manualReviewRequired: true
}

const chicagoRows = [
  ['1', 'chicago lesson 1.PDF', 'Fundamental Principles, Equipment, Casing', 33],
  ['2', 'chicago lesson 2.PDF', 'Crowns, Stems, Sleeves, and Bows', 23],
  ['3', 'chicago lesson 3.PDF', 'Fitting Watch Crystals and Watch Attachments for Practice and Profit', 19],
  ['4', 'chicago lesson 4.PDF', 'Nomenclature and Sizes of Watches', 20],
  ['5', 'chicago lesson 5.PDF', 'Mainspring in Watches', 18],
  ['6', 'chicago lesson 6.PDF', 'Motor and Jeweled Barrels', 16],
  ['7', 'chicago lesson 7.PDF', 'Selecting the Mainspring', 20],
  ['8', 'chicago lesson 8.PDF', 'Assembling Watches', 14],
  ['9', 'chicago lesson 9.PDF', 'Winding and Setting Mechanisms', 25],
  ['10', 'chicago lesson 10.PDF', 'Cleaning Watches', 18],
  ['11', 'chicago lesson 11.PDF', 'Timing, Rating and Regulation', 16],
  ['12', 'chicago lesson 12.PDF', 'Factory Set Train Jewels', 11],
  ['13', 'chicago lesson 13.PDF', 'Factory Balance Hole Jewels and Roller Jewels', 11],
  ['14', 'chicago lesson 14.PDF', 'Friction Jeweling', 27],
  ['15', 'chicago lesson 15.PDF', 'Replacing Factory Balance Staffs', 16],
  ['16', 'chicago lesson 16.PDF', 'Truing Balance Wheels', 11],
  ['17', 'chicago lesson 17.PDF', 'Poising Balance Wheels', 24],
  ['18', 'chicago lesson 18.PDF', 'Truing Hairsprings', 17],
  ['19', 'chicago lesson 19.PDF', 'Colleting Hairsprings', 17],
  ['20', 'chicago lesson 20.PDF', 'The Overcoil Hairspring', 14],
  ['21', 'chicago lesson 21.PDF', 'Principles of the Lever Escapement', 15],
  ['22', 'chicago lesson 22.PDF', 'Principles of the Lever Escapement (continued)', 14],
  ['23', 'chicago lesson 23.PDF', 'Types of Escapements', 11],
  ['24', 'chicago lesson 24.PDF', 'Drawing the Lever Escapement', 22],
  ['25', 'chicago lesson 25.PDF', 'Drawing the Lever Escapement (continued)', 15],
  ['26', 'chicago lesson 26.PDF', 'Matching the Escapement', 20],
  ['27', 'chicago lesson 27.PDF', 'Tools - Hardening and Tempering', 10],
  ['28', 'chicago lesson 28.PDF', 'The Lathe', 13],
  ['29', 'chicago lesson 29.PDF', 'Lathe Work', 16],
  ['30', 'chicago lesson 30.PDF', 'Lathe Work (continued)', 21],
  ['31', 'chicago lesson 31.PDF', 'Advanced Lathe Work', 36],
  ['32a', 'chicago lesson 32 Part 1.pdf', 'Fitting Hairsprings to Watches', 21],
  ['32b', 'chicago lesson 32 Part 2.PDF', 'Modern Shop Methods', 13],
  ['33', 'chicago lesson 33.PDF', 'Electronic Timing Machines - Watch Master', 17],
  ['34', 'chicago lesson 34.PDF', 'Electronic Timing Machines - Time-O-Graph', 17],
  ['35', 'chicago lesson 35.PDF', 'Problems and Solutions', 30],
] as const

function chicagoStage(number: string): CurriculumStage {
  const numeric = Number.parseInt(number, 10)
  if (numeric === 1) return '0-prepare-bench-and-control'
  if (numeric <= 4) return numeric === 4 ? '1-understand-watch-as-system' : '4-work-on-real-calibre'
  if (numeric <= 9) return '2-understand-mechanical-systems'
  if (numeric <= 11 || numeric >= 33) return '3-observe-measure-diagnose'
  if (numeric <= 20 || (numeric >= 27 && numeric <= 32)) return '6-repair-adapt-manufacture-components'
  if (numeric <= 23) return '2-understand-mechanical-systems'
  return '7-design-validate-own-watch-or-movement'
}

function chicagoArchetype(number: string): LearningArchetype {
  const numeric = Number.parseInt(number, 10)
  if (numeric === 1) return 'bench-procedure'
  if (numeric === 4) return 'visual-anatomy'
  if (numeric === 10) return 'bench-procedure'
  if (numeric === 11 || numeric === 33 || numeric === 34) return 'measurement'
  if (numeric === 35) return 'diagnosis-case'
  if ((numeric >= 12 && numeric <= 20) || (numeric >= 28 && numeric <= 32)) return 'psychomotor-skill'
  if (numeric >= 24 && numeric <= 26) return 'design'
  if (numeric === 27) return 'manufacturing'
  if (numeric === 2 || numeric === 3 || numeric === 8) return 'bench-procedure'
  return 'mechanism-explanation'
}

function chicagoSubjects(title: string): string[] {
  const normalized = title.toLocaleLowerCase('en')
  const subjects: string[] = []
  if (/tool|equipment|lathe|hardening|tempering/.test(normalized)) subjects.push('tools-and-workshop')
  if (/case|crown|stem|sleeve|bow|crystal|attachment/.test(normalized)) subjects.push('case-and-exterior')
  if (/mainspring|barrel|winding|setting|assembling/.test(normalized)) subjects.push('energy-and-assembly')
  if (/jewel/.test(normalized)) subjects.push('jewelling')
  if (/balance|hairspring|overcoil|poising|timing|rating/.test(normalized)) subjects.push('oscillator-and-regulation')
  if (/escapement/.test(normalized)) subjects.push('escapement')
  if (/timing machine/.test(normalized)) subjects.push('measurement-and-diagnosis')
  if (/problem|solution/.test(normalized)) subjects.push('repair-cases')
  return subjects.length > 0 ? subjects : ['general-watch-repair']
}

function chicagoRisks(number: string): string[] {
  if (number === '10') return ['cyanide', 'carbon-tetrachloride', 'volatile-solvents', 'unknown-chemical']
  if (number === '27') return ['open-flame-heat', 'strong-acid', 'rotating-machinery']
  if (number === '32b') return ['unknown-chemical', 'historical-shop-practice']
  if (number === '35') return ['volatile-solvents', 'radioactive-luminous-material', 'lead-heavy-metal']
  const numeric = Number.parseInt(number, 10)
  if (numeric >= 28 && numeric <= 31) return ['rotating-machinery']
  if (numeric >= 5 && numeric <= 9) return ['stored-energy']
  return ['historical-procedure-requires-current-review']
}

export const CHICAGO_INVENTORY: ChicagoInventoryEntry[] = chicagoRows.map(([lessonNumber, fileName, title, pages]) => ({
  lessonNumber,
  fileName,
  title,
  pages,
  textExtractionQuality: lessonNumber === '32a' ? 'poor' : ['19', '20', '21'].includes(lessonNumber) ? 'mixed' : 'good',
  imagePresence: 'yes',
  subjects: chicagoSubjects(title),
  probableArchetype: chicagoArchetype(lessonNumber),
  historicalRisks: chicagoRisks(lessonNumber),
  recommendedStage: chicagoStage(lessonNumber),
  recommendedUse: ['10', '27', '32b', '35'].includes(lessonNumber)
    ? 'historical-case-only; do not convert the procedure into actionable instruction'
    : 'worksheet, sequence, review-question, or historical-case seed after technical verification',
  manualReviewRequired: true,
}))

export const CHICAGO_SUPPORTING_DOCUMENTS = [
  {
    fileName: 'Chicago School Lesson Index.doc',
    title: 'Lesson Index - Chicago School of Watchmaking',
    pages: 1,
    textExtractionQuality: 'good',
    verifiedUse: 'Verifies the 35 numbered lessons, the split Lesson 32, and Tools and Materials of the Trade.',
  },
  {
    fileName: 'Chicago School of Watchmaking Read Me First.doc',
    title: 'Chicago School of Watchmaking CD - Read Me First',
    pages: 1,
    textExtractionQuality: 'good',
    verifiedUse: 'Verifies the distribution context of the CD; it is not technical authority.',
  },
  {
    fileName: 'Tools & Materials of the Trade.PDF',
    title: 'Tools and Materials of the Trade',
    pages: 58,
    textExtractionQuality: 'good',
    verifiedUse: 'Historical tools/materials reference; chemical, flame, and machinery content requires modern review.',
  },
] as const

export interface DanielsChapterInventory {
  chapter: number | 'appendices'
  title: string
  approximatePdfPages: string
  subjects: string[]
  applicableStages: CurriculumStage[]
  formulaPages: number
  tablePages: number
  relevantFigures: string
  workshopOperations: string[]
  executionTier: ExecutionTier
  risks: string[]
  corroboration: string
  visualInspiration: string[]
  manualReviewRequired: true
}

export const DANIELS_CHAPTERS: DanielsChapterInventory[] = [
  { chapter: 1, title: 'Workshop and Equipment', approximatePdfPages: '26-48', subjects: ['workshop-layout', 'drawing', 'lathes', 'visual-aids'], applicableStages: ['0-prepare-bench-and-control', '6-repair-adapt-manufacture-components'], formulaPages: 3, tablePages: 2, relevantFigures: 'Figure references begin at Fig. 1; later figures are cross-referenced.', workshopOperations: ['workshop-planning', 'technical-drawing', 'workholding'], executionTier: 'specialist-workshop', risks: ['fire', 'acids', 'toxic-chemicals', 'rotating-machinery'], corroboration: 'Modern workshop, fire, chemical, and machinery guidance required.', visualInspiration: ['workshop-layout', 'annotated-tooling', 'geometric-construction'], manualReviewRequired: true },
  { chapter: 2, title: 'Hand Tools', approximatePdfPages: '49-72', subjects: ['gravering', 'files', 'drills', 'measuring-tools'], applicableStages: ['0-prepare-bench-and-control', '6-repair-adapt-manufacture-components'], formulaPages: 2, tablePages: 3, relevantFigures: 'Primary sequence approximately Figs. 21-63; cross-references also occur.', workshopOperations: ['sharpening', 'filing', 'drilling', 'hand-tool-control'], executionTier: 'home-bench', risks: ['sharp-tools', 'small-part-projectiles'], corroboration: 'Current PPE and tool-use guidance required for execution.', visualInspiration: ['tool-anatomy', 'hand-position-diagram', 'edge-geometry'], manualReviewRequired: true },
  { chapter: 3, title: 'Finishing Steel and Brass', approximatePdfPages: '73-90', subjects: ['surface-finishing', 'polishing', 'heat-treatment', 'bluing'], applicableStages: ['6-repair-adapt-manufacture-components'], formulaPages: 2, tablePages: 0, relevantFigures: 'Primary sequence approximately Figs. 64-87; cross-references also occur.', workshopOperations: ['flattening', 'polishing', 'heat-finishing'], executionTier: 'specialist-workshop', risks: ['open-flame-heat', 'abrasives', 'chemical-finishing'], corroboration: 'Modern chemical, ventilation, heat, and PPE sources required.', visualInspiration: ['surface-finish-comparison', 'tool-path-diagram', 'process-state-sequence'], manualReviewRequired: true },
  { chapter: 4, title: 'Turning', approximatePdfPages: '91-122', subjects: ['lathe', 'turning', 'workholding', 'pivot-making'], applicableStages: ['6-repair-adapt-manufacture-components'], formulaPages: 4, tablePages: 0, relevantFigures: 'Primary sequence approximately Figs. 88-185; cross-references also occur.', workshopOperations: ['lathe-turning', 'centering', 'pivot-turning'], executionTier: 'specialist-workshop', risks: ['rotating-machinery', 'sharp-tools', 'small-part-projectiles'], corroboration: 'Current lathe guarding, eye-protection, and safe-workholding guidance required.', visualInspiration: ['lathe-setup', 'workholding-section', 'tool-path-animation'], manualReviewRequired: true },
  { chapter: 5, title: 'Wheels and Pinions', approximatePdfPages: '123-167', subjects: ['tooth-geometry', 'ratios', 'wheel-cutting', 'pinion-making'], applicableStages: ['2-understand-mechanical-systems', '6-repair-adapt-manufacture-components', '7-design-validate-own-watch-or-movement'], formulaPages: 25, tablePages: 1, relevantFigures: 'Primary sequence approximately Figs. 186-270; cross-references also occur.', workshopOperations: ['gear-calculation', 'wheel-cutting', 'pinion-finishing'], executionTier: 'specialist-workshop', risks: ['rotating-machinery', 'sharp-cutters', 'ocr-formula-error'], corroboration: 'Every formula, symbol, dimension, and table must be visually verified before use.', visualInspiration: ['tooth-geometry', 'ratio-diagram', 'cutting-setup'], manualReviewRequired: true },
  { chapter: 6, title: 'Making Small Components', approximatePdfPages: '168-194', subjects: ['screws', 'springs', 'arbors', 'small-parts'], applicableStages: ['6-repair-adapt-manufacture-components'], formulaPages: 3, tablePages: 1, relevantFigures: 'Primary sequence approximately Figs. 271-384; cross-references also occur.', workshopOperations: ['small-part-turning', 'threading', 'forming', 'heat-treatment'], executionTier: 'specialist-workshop', risks: ['rotating-machinery', 'open-flame-heat', 'stored-energy'], corroboration: 'Current machinery, heat-treatment, and material guidance required.', visualInspiration: ['component-progression', 'dimensioned-sketch', 'workholding-sequence'], manualReviewRequired: true },
  { chapter: 7, title: 'Jewelling', approximatePdfPages: '195-213', subjects: ['jewel-setting', 'holes', 'endshake', 'friction-setting'], applicableStages: ['3-observe-measure-diagnose', '6-repair-adapt-manufacture-components'], formulaPages: 3, tablePages: 10, relevantFigures: 'Primary sequence approximately Figs. 385-428; cross-references also occur.', workshopOperations: ['jewel-setting', 'measuring', 'burnishing'], executionTier: 'specialist-workshop', risks: ['pressing-tools', 'small-part-projectiles', 'ocr-table-error'], corroboration: 'Tables and dimensions require visual verification and modern material/tool corroboration.', visualInspiration: ['jewel-seat-section', 'endshake-diagram', 'defect-comparison'], manualReviewRequired: true },
  { chapter: 8, title: 'Escapements', approximatePdfPages: '214-271', subjects: ['escapement-principles', 'geometry', 'detent', 'co-axial'], applicableStages: ['2-understand-mechanical-systems', '6-repair-adapt-manufacture-components', '7-design-validate-own-watch-or-movement'], formulaPages: 17, tablePages: 1, relevantFigures: 'Primary sequence approximately Figs. 429-490; cross-references also occur.', workshopOperations: ['escapement-drawing', 'geometry-checking', 'component-making'], executionTier: 'specialist-workshop', risks: ['stored-energy', 'sharp-tools', 'ocr-formula-error'], corroboration: 'Geometry, symbols, formulae, and dimensions require page-image verification.', visualInspiration: ['escapement-state-diagram', 'locking-and-impulse-geometry', 'phase-animation'], manualReviewRequired: true },
  { chapter: 9, title: 'Mainsprings and Accessories', approximatePdfPages: '272-297', subjects: ['mainsprings', 'barrels', 'torque', 'winding-accessories'], applicableStages: ['2-understand-mechanical-systems', '4-work-on-real-calibre', '6-repair-adapt-manufacture-components'], formulaPages: 13, tablePages: 1, relevantFigures: 'Primary sequence approximately Figs. 491-527; cross-references also occur.', workshopOperations: ['spring-selection', 'barrel-work', 'spring-making'], executionTier: 'specialist-workshop', risks: ['stored-energy', 'sharp-spring-ends', 'ocr-formula-error'], corroboration: 'Modern spring handling and material guidance required; formulas need visual verification.', visualInspiration: ['barrel-section', 'torque-curve', 'spring-state-sequence'], manualReviewRequired: true },
  { chapter: 10, title: 'Movement Design', approximatePdfPages: '298-332', subjects: ['layout', 'train-design', 'plate-and-bridge-design', 'power-budget'], applicableStages: ['5-build-complete-watch', '7-design-validate-own-watch-or-movement'], formulaPages: 10, tablePages: 3, relevantFigures: 'Primary sequence approximately Figs. 528-593; cross-references also occur.', workshopOperations: ['movement-layout', 'calculation', 'drawing', 'design-review'], executionTier: 'specialist-workshop', risks: ['ocr-formula-error', 'design-assumption'], corroboration: 'All equations, dimensions, and design rules require visual and engineering verification.', visualInspiration: ['movement-layout', 'dependency-graph', 'dimension-chain'], manualReviewRequired: true },
  { chapter: 11, title: 'The Balance and Spring', approximatePdfPages: '333-370', subjects: ['balance', 'hairspring', 'poising', 'terminal-curves'], applicableStages: ['2-understand-mechanical-systems', '3-observe-measure-diagnose', '6-repair-adapt-manufacture-components'], formulaPages: 10, tablePages: 0, relevantFigures: 'Primary sequence approximately Figs. 594-669; cross-references also occur.', workshopOperations: ['poising', 'spring-forming', 'regulation', 'measurement'], executionTier: 'specialist-workshop', risks: ['stored-energy', 'delicate-components', 'ocr-formula-error'], corroboration: 'Formulae and geometry require visual verification; physical work requires supervision.', visualInspiration: ['balance-spring-anatomy', 'terminal-curve-geometry', 'error-pattern-comparison'], manualReviewRequired: true },
  { chapter: 12, title: 'Casemaking', approximatePdfPages: '371-386', subjects: ['case-construction', 'hinges', 'fittings', 'metal-forming'], applicableStages: ['6-repair-adapt-manufacture-components'], formulaPages: 3, tablePages: 0, relevantFigures: 'Primary sequence approximately Figs. 670-709; cross-references also occur.', workshopOperations: ['case-turning', 'forming', 'soldering', 'fitting'], executionTier: 'specialist-workshop', risks: ['open-flame-heat', 'rotating-machinery', 'chemical-cleaning'], corroboration: 'Current heat, soldering, alloy, ventilation, and machinery guidance required.', visualInspiration: ['case-section', 'fit-and-clearance-diagram', 'construction-sequence'], manualReviewRequired: true },
  { chapter: 13, title: 'Engine-Turned Cases and Dials', approximatePdfPages: '387-419', subjects: ['engine-turning', 'dial-making', 'engraving', 'gilding'], applicableStages: ['6-repair-adapt-manufacture-components', '7-design-validate-own-watch-or-movement'], formulaPages: 6, tablePages: 0, relevantFigures: 'Primary sequence approximately Figs. 710-777; cross-references also occur.', workshopOperations: ['engine-turning', 'engraving', 'dial-finishing', 'historical-gilding'], executionTier: 'professional-or-outsourced', risks: ['mercury', 'strong-acid', 'open-flame-heat', 'electroplating', 'rotating-machinery'], corroboration: 'Historical chemical and thermal procedures are non-actionable; modern professional guidance is mandatory.', visualInspiration: ['guilloche-pattern', 'dial-layer-construction', 'historical-process-comparison'], manualReviewRequired: true },
  { chapter: 'appendices', title: 'Appendices', approximatePdfPages: '421-425', subjects: ['co-axial-escapement-layout', 'geometric-construction'], applicableStages: ['7-design-validate-own-watch-or-movement', 'reference-only'], formulaPages: 2, tablePages: 0, relevantFigures: 'Appendices I-III contain full-page geometric constructions.', workshopOperations: ['geometric-layout', 'design-checking'], executionTier: 'specialist-workshop', risks: ['ocr-symbol-error', 'unverified-dimension'], corroboration: 'Every line, angle, symbol, and dimension requires direct page-image verification.', visualInspiration: ['full-page-geometric-construction', 'annotated-angle-diagram'], manualReviewRequired: true },
]

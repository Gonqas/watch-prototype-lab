export const ACADEMY_STAGE_4_SIMULATION_FOUNDATIONS = [
  'official-user-operation',
  'official-part-identity',
  'official-structural-relation',
  'fixture-dependency',
  'pedagogical-choice',
  'unsupported',
] as const

export const ACADEMY_STAGE_4_SIMULATION_SCOPES = ['document-reading', 'simulation-only', 'physical-procedure-source-needed'] as const

export const ACADEMY_STAGE_4_SIMULATION_BOUNDARY = {
  virtualEvidence: 'V',
  dossierEvidence: 'R',
  explanationEvidence: 'K',
  physicalEvidenceGranted: false,
  virtualSequenceIsOfficialService: false,
  reverseSequenceIsOfficialAssembly: false,
  fixtureFidelity: 'structural-normalized',
  forbiddenClaims: ['destreza física', 'servicio profesional', 'lubricación validada', 'regulación', 'desgaste real', 'holgura correcta'],
  statement: 'La reversibilidad del simulador no demuestra que el montaje físico correcto sea simplemente el desmontaje invertido.',
} as const

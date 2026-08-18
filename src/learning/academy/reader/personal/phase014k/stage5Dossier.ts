import type { WatchIntegrationProject } from './stage5ComponentModel'

export const ACADEMY_STAGE_5_DOSSIER_SECTIONS = [
  'Pliego de requisitos','Movimiento seleccionado','Inventario de componentes','Documentos','Afirmaciones','Dimensiones','Referencias geométricas','Mediciones',
  'Matriz de compatibilidad','Cadena radial','Cadena de mando','Cadena axial','Holgura posterior','Interferencias','Donantes',
  'Plan de montaje','Plan de verificación','Riesgos','Datos pendientes','Conflictos','Decisiones','Pruebas físicas pendientes','Conclusión',
] as const

export interface IntegrationDossierSummary {
  projectId: string
  title: string
  sectionCoverage: Record<(typeof ACADEMY_STAGE_5_DOSSIER_SECTIONS)[number], 'present' | 'empty' | 'pending'>
  conclusion: string
  physicalWatchCompleted: false
}

export function buildIntegrationDossier(project: WatchIntegrationProject): IntegrationDossierSummary {
  const populated = new Set<string>()
  if (project.requirements.length) populated.add('Pliego de requisitos')
  if (project.movement) populated.add('Movimiento seleccionado')
  if (project.components.length) populated.add('Inventario de componentes')
  if (project.documents.length) populated.add('Documentos')
  if (project.claims.length) populated.add('Afirmaciones')
  if (project.dimensions.length) { populated.add('Dimensiones'); populated.add('Referencias geométricas') }
  if (project.measurements.length) populated.add('Mediciones')
  if (project.compatibilityChecks.length) populated.add('Matriz de compatibilidad')
  if (project.dimensionalChains.some(({chainId}) => chainId === 'chain.radial')) populated.add('Cadena radial')
  if (project.dimensionalChains.some(({chainId}) => chainId === 'chain.control')) populated.add('Cadena de mando')
  if (project.dimensionalChains.some(({chainId}) => chainId === 'chain.indication')) populated.add('Cadena axial')
  if (project.dimensionalChains.some(({chainId}) => chainId === 'chain.rear')) populated.add('Holgura posterior')
  if (project.interferenceChecks.length) populated.add('Interferencias')
  if (project.donorComponents.length) populated.add('Donantes')
  if (project.assemblyPlan.length) populated.add('Plan de montaje')
  if (project.verificationPlan.length) populated.add('Plan de verificación')
  populated.add('Riesgos'); populated.add('Datos pendientes'); populated.add('Conflictos'); populated.add('Decisiones'); populated.add('Pruebas físicas pendientes'); populated.add('Conclusión')
  return {
    projectId:project.projectId,title:project.title,
    sectionCoverage:Object.fromEntries(ACADEMY_STAGE_5_DOSSIER_SECTIONS.map((section) => [section,populated.has(section) ? 'present' : 'pending'])) as IntegrationDossierSummary['sectionCoverage'],
    conclusion: project.status === 'documentally-compatible'
      ? 'Compatibilidad documental condicionada; permanece pendiente toda validación física.'
      : 'Los datos pendientes y los conflictos limitan la conclusión del proyecto.',
    physicalWatchCompleted:false,
  }
}

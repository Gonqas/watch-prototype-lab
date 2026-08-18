import { ACADEMY_STAGE_5_ASSEMBLY_PLAN } from './stage5AssemblyPlan'
import { buildEmptyCompatibilityMatrix } from './stage5Compatibility'
import { ACADEMY_STAGE_5_CHAIN_TEMPLATES } from './stage5DimensionalChains'
import { ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES } from './stage5Interferences'
import { createEmptyIntegrationProject, deriveIntegrationProjectStatus, type WatchIntegrationProject } from './stage5ComponentModel'

export interface IntegrationProjectEnvelope {
  format:'wplab-stage5-integration-project'
  formatVersion:1
  exportedAt:string
  project:WatchIntegrationProject
}
export type IntegrationImportResult = {ok:true;project:WatchIntegrationProject;warnings:string[]}|{ok:false;errors:string[]}

const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
const bounded=(value:unknown,max=4000)=>typeof value==='string'?value.slice(0,max):''
export function createIntegrationProject(profileId:string,now=new Date().toISOString(),projectId?:string):WatchIntegrationProject{
  const project=createEmptyIntegrationProject(profileId,now,projectId)
  project.compatibilityChecks=buildEmptyCompatibilityMatrix()
  project.interfaces=structuredClone(project.compatibilityChecks)
  project.dimensionalChains=structuredClone([...ACADEMY_STAGE_5_CHAIN_TEMPLATES])
  project.interferenceChecks=structuredClone([...ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES])
  project.assemblyPlan=structuredClone([...ACADEMY_STAGE_5_ASSEMBLY_PLAN])
  project.verificationPlan=['Revisar la documentación aplicable.','Cerrar las interfaces críticas en papel.','Preparar una disposición física provisional futura con condiciones de parada.','Documentar un ensayo real solo cuando exista.']
  return project
}

export function normalizeIntegrationProject(value:unknown,profileId:string,now=new Date().toISOString()):WatchIntegrationProject|undefined{
  if(!isRecord(value)||value.schemaVersion!==1||typeof value.projectId!=='string'||typeof value.title!=='string')return undefined
  const seed=createIntegrationProject(profileId,typeof value.createdAt==='string'?value.createdAt:now,value.projectId.slice(0,160))
  const arrays=['donorComponents','components','documents','dimensions','measurements','requirements','interfaces','compatibilityChecks','dimensionalChains','interferenceChecks','assemblyPlan','verificationPlan','claims','unknowns','conflicts','decisions'] as const
  const next={...seed,title:bounded(value.title,200)||seed.title,revision:typeof value.revision==='number'&&Number.isInteger(value.revision)?Math.max(1,value.revision):1,updatedAt:typeof value.updatedAt==='string'?value.updatedAt:now,linkedWatchProjectId:typeof value.linkedWatchProjectId==='string'?value.linkedWatchProjectId.slice(0,160):undefined} as WatchIntegrationProject
  for(const key of arrays) if(Array.isArray(value[key])) (next as unknown as Record<string,unknown>)[key]=structuredClone(value[key]).slice(0,key==='dimensions'?1000:500)
  next.dimensions=next.dimensions.flatMap((raw)=>{
    if(!isRecord(raw)||typeof raw.dimensionId!=='string'||typeof raw.componentId!=='string'||typeof raw.name!=='string')return[]
    const valueNumber=typeof raw.value==='number'&&Number.isFinite(raw.value)?raw.value:undefined
    const authority=next.components.find(({componentId})=>componentId===raw.componentId)?.sourceType
    const tolerance=authority==='measured-own-component'?undefined:isRecord(raw.tolerance)&&typeof raw.tolerance.minus==='number'&&typeof raw.tolerance.plus==='number'?{minus:raw.tolerance.minus,plus:raw.tolerance.plus}:undefined
    return[{...raw,dimensionId:raw.dimensionId.slice(0,200),componentId:raw.componentId.slice(0,200),name:raw.name.slice(0,240),value:valueNumber,unit:['mm','deg','count','unknown'].includes(String(raw.unit))?raw.unit as 'mm'|'deg'|'count'|'unknown':'unknown',tolerance,applicability:bounded(raw.applicability,500)||'unknown',verificationStatus:['verified-primary','visually-verified','measured','derived','estimated','unknown'].includes(String(raw.verificationStatus))?raw.verificationStatus as 'verified-primary'|'visually-verified'|'measured'|'derived'|'estimated'|'unknown':'unknown',notes:bounded(raw.notes,2000)}]
  })
  next.profileId=profileId
  next.waterResistanceStatus=['not-verified','test-pending','documented-test-result'].includes(String(value.waterResistanceStatus))?value.waterResistanceStatus as WatchIntegrationProject['waterResistanceStatus']:'not-verified'
  next.status=deriveIntegrationProjectStatus(next)
  return next
}

export function exportIntegrationProject(project:WatchIntegrationProject,exportedAt=new Date().toISOString()):string{
  const envelope:IntegrationProjectEnvelope={format:'wplab-stage5-integration-project',formatVersion:1,exportedAt,project}
  return `${JSON.stringify(envelope,null,2)}\n`
}

export function importIntegrationProject(payload:string,profileId:string,now=new Date().toISOString()):IntegrationImportResult{
  if(payload.length>2_000_000)return{ok:false,errors:['El archivo supera el límite local de 2 MB.']}
  let parsed:unknown
  try{parsed=JSON.parse(payload)}catch{return{ok:false,errors:['JSON inválido; no se ha modificado ningún proyecto.']}}
  if(!isRecord(parsed)||parsed.format!=='wplab-stage5-integration-project'||parsed.formatVersion!==1)return{ok:false,errors:['Formato o versión de importación no compatible.']}
  const project=normalizeIntegrationProject(parsed.project,profileId,now)
  if(!project)return{ok:false,errors:['El proyecto no cumple el contrato 0.14K.']}
  return{ok:true,project:{...project,projectId:`${project.projectId}.imported.${now.replaceAll(/\D/g,'').slice(0,14)}`,revision:1,createdAt:now,updatedAt:now},warnings:project.profileId===profileId?[]:['El proyecto se ha reasignado al perfil local activo.']}
}

export function duplicateIntegrationProject(project:WatchIntegrationProject,now=new Date().toISOString(),projectId=`${project.projectId}.copy`):WatchIntegrationProject{
  return{...structuredClone(project),projectId,title:`${project.title} · copia`,revision:1,createdAt:now,updatedAt:now,status:deriveIntegrationProjectStatus(project)}
}

export function resolveIntegrationProjectConflict(local:WatchIntegrationProject,incoming:WatchIntegrationProject):{winner:WatchIntegrationProject;preserved:WatchIntegrationProject;conflict:boolean}{
  if(local.projectId!==incoming.projectId)return{winner:incoming,preserved:local,conflict:false}
  if(local.revision===incoming.revision&&local.updatedAt===incoming.updatedAt)return{winner:local,preserved:incoming,conflict:false}
  const winner=Date.parse(incoming.updatedAt)>Date.parse(local.updatedAt)?incoming:local
  const preserved=winner===local?incoming:local
  return{winner,preserved:{...structuredClone(preserved),projectId:`${preserved.projectId}.conflict.${preserved.revision}`,title:`${preserved.title} · copia en conflicto`},conflict:true}
}

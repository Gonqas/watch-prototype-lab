export interface ExternalSourcePolicy {
  id: string
  label: string
  hosts: readonly string[]
  allowSubdomains?: boolean
}

export const EXTERNAL_SOURCE_REGISTRY: readonly ExternalSourcePolicy[] = [
  { id: 'miyota-official', label: 'MIYOTA oficial', hosts: ['miyotamovement.com', 'www.miyotamovement.com'] },
  { id: 'citizen-official', label: 'Citizen oficial', hosts: ['citizen.co.jp', 'www.citizen.co.jp'], allowSubdomains: true },
  { id: 'eta-official', label: 'ETA oficial', hosts: ['eta.ch', 'www.eta.ch'], allowSubdomains: true },
  { id: 'sellita-official', label: 'Sellita oficial', hosts: ['sellita.ch', 'www.sellita.ch'], allowSubdomains: true },
  { id: 'seiko-official', label: 'Seiko oficial', hosts: ['seikowatches.com', 'www.seikowatches.com'], allowSubdomains: true },
  { id: 'bipm-official', label: 'BIPM oficial', hosts: ['bipm.org', 'www.bipm.org'], allowSubdomains: true },
  { id: 'nist-official', label: 'NIST oficial', hosts: ['nist.gov', 'www.nist.gov', 'nvlpubs.nist.gov'], allowSubdomains: true },
] as const

function policyFor(sourceId: string): ExternalSourcePolicy {
  const policy = EXTERNAL_SOURCE_REGISTRY.find(({ id }) => id === sourceId)
  if (!policy) throw new Error('La fuente externa no está registrada.')
  return policy
}

export function authorizeExternalSourceUrl(rawUrl: string, sourceId: string): URL {
  const policy = policyFor(sourceId)
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('La dirección externa no es válida.')
  }
  if (url.protocol !== 'https:') throw new Error('Solo se permiten fuentes externas mediante HTTPS.')
  if (url.username || url.password) throw new Error('No se permiten credenciales incrustadas en una dirección externa.')
  if (url.port && url.port !== '443') throw new Error('El puerto externo no está permitido.')
  const hostname = url.hostname.toLowerCase().replace(/\.$/u, '')
  const allowed = policy.hosts.some((host) => hostname === host || (policy.allowSubdomains && hostname.endsWith(`.${host}`)))
  if (!allowed) throw new Error(`El dominio no pertenece a ${policy.label}.`)
  return url
}

export async function openRegisteredExternalSource(rawUrl: string, sourceId: string): Promise<void> {
  const url = authorizeExternalSourceUrl(rawUrl, sourceId)
  if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url.toString())
    return
  }
  const opened = window.open(url.toString(), '_blank', 'noopener,noreferrer')
  if (!opened) throw new Error('El navegador ha bloqueado la apertura de la fuente.')
}

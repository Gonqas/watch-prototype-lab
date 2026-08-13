import type { EngineeringSource } from './model'

export const ENGINEERING_SOURCES: EngineeringSource[] = [
  {
    id: 'source.nist.weibull',
    title: 'NIST/SEMATECH e-Handbook of Statistical Methods — Weibull',
    publisherOrAuthor: 'National Institute of Standards and Technology',
    url: 'https://www.itl.nist.gov/div898/handbook/apr/section1/apr162.htm',
    locator: '8.1.6.2',
    role: 'definition',
  },
  {
    id: 'source.nist.capability',
    title: 'NIST/SEMATECH e-Handbook — Process capability',
    publisherOrAuthor: 'National Institute of Standards and Technology',
    url: 'https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm',
    locator: '6.1.6',
    role: 'definition',
  },
  {
    id: 'source.watchmaking.vba',
    title: 'VBA Uhrentechnik 7.0',
    publisherOrAuthor: 'Kilian Eisenegger',
    url: 'https://www.watchmaking.com/vbadownload.htm',
    locator: 'Paquete verificado por SHA-256; fórmulas reimplementadas, no ejecutadas',
    retrievedAt: '2026-07-29',
    contentHash: 'sha256:67324954824F482958A0BF6E0FCD3598DD3567D0AD010299476192FB103ECF8C',
    role: 'comparison',
  },
]

export function engineeringSource(sourceId: string): EngineeringSource | undefined {
  return ENGINEERING_SOURCES.find(({ id }) => id === sourceId)
}

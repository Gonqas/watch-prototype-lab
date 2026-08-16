import type { DataAuthority } from './stage5ComponentModel'

export const ACADEMY_STAGE_5_DOCUMENT_AUTHORITY = {
  movement:['official-manufacturer','manufacturer-drawing','secondary-reference','unknown'],
  commercialComponents:['official-component-supplier','supplier-technical-sheet','measured-own-component','derived-from-verified-inputs','estimated','unknown'],
  prohibitedElevations:[
    {from:'visual-match-only',to:'compatible-on-paper',reason:'La semejanza no verifica identidad ni interfaces.'},
    {from:'estimated',to:'official-manufacturer',reason:'Una estimación conserva su incertidumbre.'},
    {from:'measured-own-component',to:'manufacturer-tolerance',reason:'Una medición propia no define tolerancia de fabricación.'},
    {from:'secondary-reference',to:'official-manufacturer',reason:'Una base secundaria no se vuelve oficial por posición.'},
  ],
  runtimeNetworkRequired:false,
} as const

export function authorityRank(authority:DataAuthority,component:'movement'|'commercial'):number{
  const list:readonly string[]=component==='movement'?['official-manufacturer','manufacturer-drawing','measured-own-component','secondary-reference','estimated','visual-match-only','unknown']:['official-component-supplier','supplier-technical-sheet','measured-own-component','derived-from-verified-inputs','secondary-reference','estimated','visual-match-only','unknown']
  const rank=list.indexOf(authority);return rank<0?list.length:rank
}
export function authorityCanValidateCompatibility(authority:DataAuthority):boolean{return!['visual-match-only','estimated','unknown'].includes(authority)}


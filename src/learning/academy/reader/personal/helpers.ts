export interface AcademyPersonalSectionPatch {
  sectionId: string
  title?: string
  markdown: string
}

export const academyPersonalSectionId = (blockId: string, suffix: string) => `reader.section.${blockId}.${suffix}`


type AcademySourceFigureDialog = Pick<HTMLDialogElement, 'open' | 'showModal' | 'close'>
type AcademySourceFigureFocusTarget = Pick<HTMLButtonElement, 'focus'>

/** Abre únicamente un diálogo modal nativo; nunca degrada a un panel sin confinamiento de foco. */
export function openAcademySourceFigureDialog(
  dialog: AcademySourceFigureDialog | null,
  initialFocus: AcademySourceFigureFocusTarget | null,
  onOpen?: () => void,
) {
  if (!dialog || dialog.open || typeof dialog.showModal !== 'function') return false
  dialog.showModal()
  initialFocus?.focus({ preventScroll: true })
  onOpen?.()
  return true
}

export function closeAcademySourceFigureDialog(dialog: AcademySourceFigureDialog | null) {
  if (!dialog || !dialog.open || typeof dialog.close !== 'function') return false
  dialog.close()
  return true
}

export function restoreAcademySourceFigureFocus(trigger: AcademySourceFigureFocusTarget | null) {
  trigger?.focus({ preventScroll: true })
}

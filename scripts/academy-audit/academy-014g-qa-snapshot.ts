export const ACADEMY_014G_QA_CASES = [
  { caseId: 'desktop-light', viewport: '1440x1000', theme: 'light', reducedMotion: false, status: 'manual-pass', notes: 'Lector, visual específico, índice y texto alternativo inspeccionados en el navegador de la aplicación.' },
  { caseId: 'desktop-dark', viewport: '1440x1000', theme: 'dark', reducedMotion: true, status: 'manual-pass', notes: 'Contraste, diagrama estático y preferencia de movimiento reducido inspeccionados; la preferencia se restauró al terminar.' },
  { caseId: 'tablet', viewport: '1024x768', theme: 'system-dark', reducedMotion: false, status: 'manual-pass', notes: 'La pregunta central y el documento continuo permanecen disponibles sin navegación nueva.' },
  { caseId: 'narrow-tablet', viewport: '760x900', theme: 'system-dark', reducedMotion: false, status: 'manual-pass', notes: 'El índice pasa al control compacto y el contenido mantiene el orden de lectura.' },
  { caseId: 'mobile', viewport: '480x900', theme: 'system-dark', reducedMotion: false, status: 'manual-pass', notes: 'Visual integrado, descripción y navegación inferior inspeccionados sin desbordamiento visible.' },
  { caseId: 'reflow-200', viewport: '720x900', theme: 'system-dark', reducedMotion: false, status: 'manual-pass', notes: 'Equivalente geométrico al 200 % inspeccionado con índice compacto y contenido refluido.' },
  { caseId: 'conflict-recovery-fixture', viewport: '1440x1000', theme: 'system-dark', reducedMotion: false, status: 'manual-pass', notes: 'El aviso se identifica explícitamente como fixture; no representa pérdida ni contiene datos personales.' },
  { caseId: 'keyboard', viewport: '1440x1000', theme: 'system-dark', reducedMotion: false, status: 'automated-pass', notes: 'Roles, nombres accesibles y activación se cubren por pruebas; el dispatcher Tab del navegador integrado no permitió certificar manualmente la secuencia completa.' },
  { caseId: 'fallback-no-webgl', viewport: 'all', theme: 'all', reducedMotion: true, status: 'automated-pass', notes: 'Los seis visuales esenciales son SVG semántico estático y no dependen de WebGL.' },
  { caseId: 'profile-switch-close-reopen', viewport: 'n/a', theme: 'n/a', reducedMotion: false, status: 'automated-pass', notes: 'Flush, aislamiento por perfil, reapertura y recuperación se validan con adaptadores deterministas; no se declara sesión manual.' },
] as const

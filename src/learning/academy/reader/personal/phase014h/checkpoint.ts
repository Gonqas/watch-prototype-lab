export const ACADEMY_STAGE_2_FINAL_CHECKPOINT = {
  checkpointId: 'checkpoint.academy.stage2-complete',
  fromStageId: 'stage.2', toStageId: 'stage.3', blocking: false, affectsProgress: false,
  title: 'Cierre personal de sistemas mecánicos',
  questions: [
    '¿Puedo seguir la energía desde el muelle hasta el escape?',
    '¿Distingo energía, par, potencia y velocidad?',
    '¿Puedo explicar cuerda y marcha del barrilete?',
    '¿Predigo sentido y relación de una pareja ideal?',
    '¿Reconozco ejes e interfaces de un tren?',
    '¿Ordeno bloqueo, desbloqueo, impulso y caída?',
    '¿Distingo frecuencia de amplitud?',
    '¿Explico las dos direcciones del bucle escape–oscilador?',
    '¿Separo tren de rodaje, minutería y sistema sin llave?',
    '¿Sigo la ruta de carga automática?',
    '¿Explico un cambio de fecha sin inventar una ventana de corrección?',
  ],
  actions: [
    'revisar el mapa de energía', 'reconstruir un tren virtual', 'repasar el ciclo del escape',
    'comparar frecuencia y amplitud', 'reconstruir los estados de corona', 'integrar automático y calendario', 'continuar a inspección y diagnóstico',
  ],
  evidence: 'Autocomprobación K/V/R local; no crea mastery ni acredita P.',
} as const

const checkedAt = '2026-08-09'

const historicalContext = (note, hazardTopics = []) => ({
  status: 'historical-context-only',
  operationalUse: 'contextual-only',
  hazardTopics,
  reviewedAgainstModernGuidance: false,
  note,
})

const blockedHistorical = (note, hazardTopics) => ({
  status: 'prohibited-instruction',
  operationalUse: 'blocked',
  hazardTopics,
  reviewedAgainstModernGuidance: false,
  note,
})

const theoryFiles = {
  '1-3': ['ToH ch 1-3.pdf', 'b8d78de3e95eee0ae7a7232288267b599973208e78b926b7c8b37a64b50696ae'],
  '4-5': ['ToH ch 4&5.pdf', '354cbf219f61c4d764fc6420c16c20193a858d1a04d2c955bc5589fca9513f92'],
  '6': ['ToH ch 6.pdf', '5d6179b89ca3ca2e6f003da75737e408d3bfccca9b9cfd3815191776e9f059c6'],
  '7': ['ToH ch 7.pdf', 'f3fc6d9f51098fadec86399a1ad40a1c5478bc0baa738dc6e0a3876516bbe894'],
  '8': ['ToH ch 8.pdf', '4d97bd1650f085b44aadeddf61dc9a661f133d0ff14a2e087745d9a827761e22'],
  '9': ['ToH ch 9.pdf', '87e9ea754bb624a4bd6de4795934cb9f62e7fc4734dc82161f19aeaa57e86ee6'],
  '10': ['ToH ch 10.pdf', '7a99432a63f29939c76f280693d23cca5bd7c0f528e2fee6698b2b8ea94e5a74'],
  '11': ['ToH ch 11.pdf', 'c07a2f525f91b71eb884298785b7b294e8865ba418c2f30aa42db233cd3392ce'],
  '12': ['ToH ch 12.pdf', '761a9ba5084c71c603e855c46508944338788e289fea429167032dab4f13488c'],
  '13': ['ToH ch 13.pdf', '8ef9d24aeb069a79ac5fa87a3376c8cada4fb08483b721fffaadf79f00ea53a6'],
  '14': ['ToH ch 13.5 & 14full.pdf', 'd0cb46519dc70794a024c57e0171c061b6bdc2b7a6e4619daf168a2967d12cc7'],
  '15': ['TOH chap. 15.pdf', '2920e83b3019e2dcaf74462bcae4c56466ce209c750449cb08ab59e6f1e22c12'],
}

const theoryChapters = [
  ['01', '1', 'The Concept of Time', '1-3', '1-20', ['tiempo', 'astronomía', 'calendario', 'zonas horarias']],
  ['02', '2', 'Instruments for Measuring Time', '1-3', '21-31', ['historia', 'instrumentos', 'arquitecturas']],
  ['03', '3', 'The Simple Mechanical Movement', '1-3', '32-44', ['movimiento mecánico', 'cadena funcional']],
  ['04', '4', 'The Driving Force in a Mechanical Watch', '4-5', '45-62', ['muelle real', 'barrilete', 'par', 'energía']],
  ['05', '5', 'The Geared Transmission System', '4-5', '63-99', ['engranajes', 'trenes', 'relaciones', 'normas']],
  ['06', '6', 'Escapements', '6', '100-129', ['escape', 'áncora', 'bloqueo', 'impulso']],
  ['07', '7', 'Regulating Organs', '7', '130-169', ['volante', 'espiral', 'isocronismo', 'regulación']],
  ['08', '8', 'Self-winding Watches', '8', '170-189', ['automático', 'rotor', 'reversores']],
  ['09', '9', 'Calendar Mechanisms', '9', '190-217', ['calendario', 'fecha', 'perpetuo']],
  ['10', '10', 'Striking Mechanisms', '10', '218-225', ['sonería', 'alarma', 'repetición']],
  ['11', '11', 'Chronograph Mechanisms', '11', '226-253', ['cronógrafo', 'embrague', 'puesta a cero']],
  ['12', '12', 'The Exterior of the Watch', '12', '254-275', ['caja', 'esfera', 'agujas', 'cristal']],
  ['13', '13', 'Tribology', '13', '276-299', ['fricción', 'desgaste', 'limpieza', 'lubricación']],
  ['14', '14', 'Clockmaking', '14', '300-337', ['relojería gruesa', 'Atmos', 'sonería']],
  ['15', '15', 'The Electronic Watch', '15', '338-372', ['cuarzo', 'circuito', 'motor paso a paso']],
]

export const THEORY_OF_HOROLOGY_SOURCES = theoryChapters.map(([slug, chapter, title, fileKey, page, topics]) => {
  const [fileName, sha256] = theoryFiles[fileKey]
  const tribology = slug === '13'
  return {
    id: `source.private.toh.ch${slug}`,
    authority: 'technical-training',
    usage: 'private-local',
    resource: {
      kind: 'archive',
      title: `Theory of Horology · ${title}`,
      locator: `reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#${fileName}`,
      sha256,
    },
    authorOrManufacturer: 'Swiss Federation of Technical Colleges / WOSTEP educational environment',
    edition: 'English edition', year: 1999, sourceType: 'institutional-textbook', chapter, page,
    retrievedAt: checkedAt, privateUse: true, authorityTier: 'B', sourceClass: 'institutional-training',
    languages: ['en'], topics, pedagogicalUses: ['theory', 'worked-example', 'visual-reference'],
    availability: 'local', checkedAt, rights: 'user-supplied', offlineReady: true, currency: 'mixed',
    historicalSafety: tribology
      ? blockedHistorical('Los principios tribológicos se estudian; cualquier producto o proceso de limpieza y lubricación requiere una fuente moderna aplicable.', ['unknown-chemical'])
      : historicalContext('Referencia teórica de 1999: comprobar normas, materiales y soluciones aparecidas posteriormente.'),
    validationPolicy: 'Usar como teoría relojera sistemática. Conservar la imagen original para ecuaciones, tablas y geometría y contrastar toda aplicación de calibre.',
    limitations: ['No es manual de servicio de un calibre concreto.', 'La edición no cubre por sí sola todas las tecnologías posteriores a 1999.'],
    supportedClaim: `Teoría, vocabulario, ecuaciones y diagramas del capítulo ${chapter}; la aplicación concreta conserva fuente, hipótesis y vigencia.`,
    derivedLayer: 'source',
  }
})

const bulovaSha = 'b13229157e4839d81285d9069f991f6e8c85c59536955f562298bffb7fe2c981'
const bulovaUnits = [
  ['preliminary', 'Preliminary training: finger dexterity', '1-8', ['banco', 'lupa', 'pinzas', 'destornillador']],
  ['01', 'Staking balance staffs', '9-20', ['botador', 'eje de volante']],
  ['02', 'Truing balance wheels', '21-36', ['volante', 'centrado', 'alabeo']],
  ['03', 'Basic turning', '37-52', ['torno', 'buril', 'concentricidad']],
  ['03a', 'Turning balance staffs', '53-76', ['torno', 'eje de volante', 'pivotes']],
  ['03b', 'Stem making', '77-96', ['tija', 'rosca', 'ajuste']],
  ['04', 'Burnishing balance pivots', '97-112', ['bruñido', 'pivote', 'acabado']],
  ['05', 'Poising balance wheels', '113-128', ['poising', 'equilibrado', 'volante']],
  ['06', 'Hairspring truing', '129-156', ['espiral', 'plano', 'centrado']],
  ['07', 'Hairspring vibration', '157-168', ['vibrado', 'frecuencia', 'longitud activa']],
  ['08', 'Overcoiling', '169-184', ['sobreespiral', 'curva terminal']],
  ['09', 'Watch assembly', '185-196', ['montaje', 'inspección', 'secuencia']],
  ['09a', 'Mainspring barrel assembly', '197-224', ['barrilete', 'muelle real', 'energía almacenada']],
  ['09b', 'Friction jeweling', '225-238', ['rubí', 'ajuste', 'juego axial']],
  ['10', 'Escapement examination', '239-260', ['escape', 'caída', 'bloqueo']],
  ['10a', 'Escapement repair', '261-276', ['escape', 'goma laca', 'reparación']],
  ['11', 'Finishing', '277-296', ['acabado', 'pulido', 'superficie']],
  ['supplement', 'Escapement supplements', '297-304', ['escape', 'diagnóstico']],
  ['general-repair', 'General repair information', '305-314', ['reparación', 'diagnóstico']],
  ['additional', 'Additional escapement supplements', '315-316', ['escape', 'ajuste']],
]

export const BULOVA_SOURCES = bulovaUnits.map(([slug, title, page, topics]) => {
  const blocked = ['10a', '11', 'general-repair'].includes(slug)
  return {
    id: `source.private.bulova.${slug}`,
    authority: 'technical-training', usage: 'private-local',
    resource: { kind: 'book', title: `Joseph Bulova School of Watch Making · ${title}`, locator: 'reference-library/originals/Joseph Bulova School of Watch Making.pdf', sha256: bulovaSha },
    authorOrManufacturer: 'Joseph Bulova School of Watchmaking', edition: 'Seventh edition', year: 1945,
    sourceType: 'historical-training-manual', chapter: title, page, retrievedAt: checkedAt, privateUse: true,
    authorityTier: 'B', sourceClass: 'historical-training', languages: ['en'], topics,
    pedagogicalUses: ['theory', 'worked-example', 'procedure-contrast', 'visual-reference'], availability: 'local', checkedAt,
    rights: 'user-supplied', offlineReady: true, currency: 'historical',
    historicalSafety: blocked
      ? blockedHistorical('El procedimiento histórico no se ofrece como instrucción operativa. Requiere sustituto moderno, evaluación de riesgos y supervisión.', ['open-flame-heat', 'unknown-chemical'])
      : historicalContext('Se utiliza como modelo de progresión y criterio observable; herramientas, tolerancias y procedimiento deben revisarse antes de la práctica.', ['stored-energy']),
    validationPolicy: 'Convertir objetivos, repeticiones y defectos observables en competencias; no conceder destreza física sin evidencia y revisión humana.',
    limitations: ['Curso histórico: no sustituye seguridad ni documentación moderna.', 'Las horas y métodos orientan una progresión, no garantizan dominio.'],
    supportedClaim: `Progresión práctica y criterios históricos descritos en ${title}.`, derivedLayer: 'source',
  }
})

const chicagoTitles = {
  '1': 'Fundamental principles, equipment and casing', '2': 'Crowns, stems, sleeves and bows',
  '3': 'Fitting watch crystals and attachments', '4': 'Nomenclature and sizes', '5': 'Mainsprings',
  '6': 'Motor and jeweled barrels', '7': 'Selecting a mainspring', '8': 'Assembling',
  '9': 'Winding and setting', '10': 'Cleaning', '11': 'Timing, rating and regulation',
  '12': 'Factory-set train jewels', '13': 'Balance hole and roller jewels', '14': 'Friction jeweling',
  '15': 'Replacing factory balance staffs', '16': 'Truing balances', '17': 'Poising balances',
  '18': 'Truing hairsprings', '19': 'Colleting hairsprings', '20': 'Overcoil hairspring',
  '21': 'Lever escapement', '22': 'Lever escapement continued', '23': 'Types of escapements',
  '24': 'Drawing the lever escapement', '25': 'Drawing continued', '26': 'Matching the escapement',
  '27': 'Tools, hardening and tempering', '28': 'Lathe foundations', '29': 'Lathe work',
  '30': 'Lathe work continued', '31': 'Advanced lathe work', '32a': 'Fitting hairsprings',
  '32b': 'Modern shop methods', '33': 'Watch Master timing machine', '34': 'Time-O-Graph',
  '35': 'Problems and solutions', tools: 'Tools and Materials of the Trade',
}

const chicagoHashes = {
  '1':'c3edfa85b06a65c77c149ef2c581880f420ecc77c6ec27fd24880bf5819b420e','2':'5eec1edfc98a35120a5994611338cc72c5c278dd5061b87a9f9a7bf55d22d76c','3':'96970bcafac16e66423c6cd928ee233a2851919629d21d58456adc67bc766890','4':'90a53f97ba47c18357b227b59c8e9c8f4089575497c0dc495d8aecd34d5c2472','5':'7d3949150c65441ecb1a6595fbb0604fc7f93ced645e2cb84b782d46d7fbaeaa','6':'b4b80f757e989ac61e1c74254b8e13cf62d91c1a9885b85677bc2660c752c157','7':'d95d82aaf58aa13be4c5a7b271e4b631477264f01585839c0f2f6fe98009809d','8':'77b86de832925bd7037550a026345620789e464dc6cbccd5d2cd57c6dbb35247','9':'8624c14a1cdcf135bb94025f42aa51032f5252af1302e6bf1357fa379ad43e54','10':'d6cf6be1f45e4710194d9c08fd01c248cdea7edf5a647ecb4b1db9f120663b38','11':'aee5e8fdd6f4ccf5a09ea3a1a4dbf91bc902b0306cbe171137c00f8be8df45bf','12':'560419492e92325363c04473348ccab476cfee1b952ce02ff9ebe3bc32205fcb','13':'c79ae8017a6aac02e6c4344de401d3117db4b622ceff3cc625c2e0c4fe517fbe','14':'90c274f2c0227a497afe46399ea46c5afdef9709ae711800ff0b7a4fb57e9c9b','15':'a822170caf21f4f875cfad55130b334a455ae1407b3bfacc74a3421a2c843df7','16':'a4e5adfd7e54396d2849a827802a3a38fb8748008ef76b92da5706cc33d66531','17':'974fd889d8e0ee29befad915ccea9737003c773432b01dd251e6a9f4b959ec6b','18':'f36680bd5324898e8bfd174bf230fc82f1b44d56bba480aa3a3eb4e4625eac7a','19':'5daef74ac53488cf6aeef426f21298197f3f4825fb3f99c6d94e43d48847cb34','20':'9ed18b0e5c0c438685bf3d4442162ce474e61858adc11fb7da19e64438a9757a','21':'e60ff37636a21bbfd1164782f6e731476afbc6e4a52053eb8ff6fe26ffdeb9f1','22':'3921bf9c2ef990122ab85934cf41ace1095ba22e20bf0bba613f2a90f1526d0c','23':'e0e9901d49318db4085ee2e54851a0031f6c5e6d8919c443e45520151cca2e45','24':'c5adc75647cf61a8f4c4cbf519c9bb5325810470f30d707fec04c23055d7060b','25':'0b900e8090b9e77f53fd849e694b319537888ec872700a4f77973915135b6514','26':'57a4db6362e158fc5c44057c5b8538ff941ed4b0debce8660bcff79c78eca5f4','27':'fcea9ab856df0aeb421681842c8b31084cebf4df36653bf53c3882f7c6f501c1','28':'a2fe6c6c59fc13f5ee617cbc924d8111c1b2c8ec188c8d29e96ff2d72f10ce4c','29':'db2c14f36cc42becc2424f67c2a9a2a13e11bd50578bb96d03016e078905f60b','30':'1de2a1a9954683c6e3e5c730c4b30b0ad9fa1a6998238f4025cc1ab28f66ce6d','31':'1f38f1adf72584605742bba6f2d875da018c53c202e40997d983c5bb9bba0b02','32a':'b70fc7b2c7af03d0c7823ec337729a71f5a68f889c882495d4cf9a9c6715d421','32b':'c15d960606440ce1184a24f9c6fbe49c644716fb1d8ce2190d4ce2f0b600bea1','33':'5aa8b8b5bdc6efd013264a1f5c640fec29561b839e7d04af205342d3de330f56','34':'3713e26867863921487ecab8a852338e119fb2af52fde5e580835093eca78095','35':'b98542d1ac204b43acce84ab3c566a6ffcfb35e0f9494922c9014b81c36bd095','tools':'a68f804c6b50ef6b28a9d0d8c62026ed7747438c27e00da853f2aea8b1505a0e',
}

const chicagoBlocked = {
  '10': ['cyanide', 'carbon-tetrachloride', 'benzene-naphtha-gasoline', 'unknown-chemical'],
  '27': ['open-flame-heat', 'strong-acid'], '32b': ['unknown-chemical'],
  '35': ['benzene-naphtha-gasoline', 'radioactive-luminous-material', 'lead-heavy-metal'],
  tools: ['unknown-chemical', 'open-flame-heat', 'rotating-machinery'],
}

export const CHICAGO_SOURCES = Object.entries(chicagoTitles).map(([slug, title]) => {
  const file = slug === '32a' ? 'chicago lesson 32 Part 1.pdf'
    : slug === '32b' ? 'chicago lesson 32 Part 2.PDF'
      : slug === 'tools' ? 'Tools & Materials of the Trade.PDF' : `chicago lesson ${slug}.PDF`
  const hazardTopics = chicagoBlocked[slug] ?? []
  return {
    id: `source.private.chicago.${slug}`, authority: 'technical-training', usage: 'private-local',
    resource: { kind: 'archive', title: `Chicago School of Watchmaking · ${title}`, locator: `reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/${file}`, sha256: chicagoHashes[slug] },
    authorOrManufacturer: 'Chicago School of Watchmaking', sourceType: 'archival-course', chapter: title,
    retrievedAt: checkedAt, privateUse: true, authorityTier: 'B', sourceClass: 'historical-training', languages: ['en'],
    topics: title.toLowerCase().split(/[, ]+/).filter(Boolean).slice(0, 8), pedagogicalUses: ['theory', 'worked-example', 'procedure-contrast', 'visual-reference'],
    availability: 'local', checkedAt, rights: 'user-supplied', offlineReady: true, currency: 'historical',
    historicalSafety: hazardTopics.length
      ? blockedHistorical('Contiene materiales, sustancias, máquinas o prácticas históricas que quedan bloqueadas como instrucciones hasta existir sustituto y revisión moderna.', hazardTopics)
      : historicalContext('Se conserva como método y caso histórico. Antes de practicar hay que contrastar herramientas, tolerancias, protecciones y documentación aplicable.', ['stored-energy']),
    validationPolicy: 'Usar como expediente de método y diagnóstico; reordenar por prerrequisitos y separar observación, simulación y ejecución física.',
    limitations: ['Curso histórico; marcas, catálogos y productos pueden estar obsoletos.', 'No constituye procedimiento de fabricante para un calibre actual.'],
    supportedClaim: `Métodos, ejemplos y problemas históricos de ${title}.`, derivedLayer: 'source',
  }
})

const tmSha = '6277f0e31ab6d94a576a811afb6d6bdce8c631013355215bc46b1ea8de42af08'
const tmSections = [
  ['inspection', 'Inspection before disassembly and service records', '1-30', ['inspección', 'registro', 'línea base']],
  ['diagnosis', 'Troubleshooting, adjustment and repair', '31-83', ['diagnóstico', 'síntomas', 'pruebas']],
  ['hamilton-992b', 'Hamilton 992B', '84-116', ['Hamilton 992B', 'bolsillo', 'servicio']],
  ['elgin-waltham-pocket', 'Elgin and Waltham pocket watches', '117-144', ['Elgin', 'Waltham', 'bolsillo']],
  ['wristwatches', 'Hamilton, Elgin and Waltham wrist watches', '145-174', ['pulsera', 'servicio', 'comparación']],
  ['bulova-10ak', 'Bulova 10AK waterproof wrist watch', '175-183', ['Bulova 10AK', 'caja', 'estanqueidad histórica']],
  ['stopwatches', 'Elgin stop watches', '184-196', ['cronómetro', 'stopwatch']],
  ['clock-m1', 'Message Center Clock M1', '197-215', ['reloj militar', 'relojería gruesa']],
]

export const TM_9_1575_SOURCES = tmSections.map(([slug, title, page, topics]) => {
  const blocked = ['inspection', 'diagnosis'].includes(slug)
  return {
    id: `source.official.tm9-1575.${slug}`, authority: 'government-primary', usage: 'private-local',
    resource: { kind: 'pdf', title: `War Department TM 9-1575 · ${title}`, locator: 'reference-library/originals/TM 9-1575.pdf', sha256: tmSha },
    authorOrManufacturer: 'United States War Department', edition: 'TM 9-1575', year: 1945,
    sourceType: 'official-historical-manual', chapter: title, page, revision: '6 April 1945', retrievedAt: checkedAt,
    privateUse: true, authorityTier: 'A', sourceClass: 'official-historical-primary', languages: ['en'], topics,
    pedagogicalUses: ['procedure-contrast', 'calibre-identification', 'historical-context', 'visual-reference'],
    availability: 'local', checkedAt, rights: 'user-supplied', offlineReady: true, currency: 'historical',
    historicalSafety: blocked
      ? blockedHistorical('El manual contiene químicos y material luminiscente peligrosos. Solo se usa su lógica de inspección y diagnóstico; los procedimientos peligrosos quedan bloqueados.', ['benzene-naphtha-gasoline', 'radioactive-luminous-material', 'unknown-chemical'])
      : historicalContext('Fuente primaria exclusivamente para las referencias y la revisión militar indicadas; no generalizar como servicio moderno.', ['stored-energy']),
    validationPolicy: 'Autoridad primaria para los equipos enumerados y su revisión de 1945. Usar como caso, no como procedimiento universal ni actual.',
    limitations: ['No representa práctica moderna ni todas las variantes civiles.', 'Las tolerancias, productos y términos de estanqueidad son históricos.'],
    supportedClaim: `Procedimiento y configuración oficiales de 1945 para ${title}, dentro de su alcance documental.`, derivedLayer: 'source',
  }
})

export const CLASSICAL_CORPUS_SOURCES = [
  ...THEORY_OF_HOROLOGY_SOURCES,
  ...BULOVA_SOURCES,
  ...CHICAGO_SOURCES,
  ...TM_9_1575_SOURCES,
]

export const CLASSICAL_CORPUS_SOURCE_COUNTS = Object.freeze({
  theory: THEORY_OF_HOROLOGY_SOURCES.length,
  bulova: BULOVA_SOURCES.length,
  chicago: CHICAGO_SOURCES.length,
  tm: TM_9_1575_SOURCES.length,
  total: CLASSICAL_CORPUS_SOURCES.length,
})

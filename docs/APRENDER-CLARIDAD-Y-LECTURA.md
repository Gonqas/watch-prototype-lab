# Academia: claridad, lectura y divulgación progresiva

## Objetivo

La Academia conserva la profundidad teórica, los modelos visuales, la procedencia y los límites técnicos, pero deja de mostrarlos todos al mismo tiempo. La interfaz debe responder primero a una pregunta sencilla: **¿qué tengo que hacer ahora?**

La reorganización usa tres capas coherentes en todas las superficies:

1. **Acción inmediata.** Título comprensible, objetivo breve, estado y siguiente acción.
2. **Estudio.** Texto amplio, ejemplos, conceptos previos y navegación de lectura.
3. **Detalle consultable.** Fuentes, fidelidad, contratos, metodología, identificadores y diagnósticos.

Ninguna capa elimina información de las demás. Solo cambia su prioridad visual.

## Inicio

Inicio ya no intenta mostrar el catálogo completo, los laboratorios, el mapa profesional y todas las rutas a la vez.

- La primera zona permite continuar una sesión o retomar la ruta activa.
- La segunda ofrece tres entradas: estudiar, practicar y avanzar hacia un reloj propio.
- El catálogo completo vive en **Explorar**.
- La lista de rutas sigue disponible en Inicio mediante una vista rápida plegable.
- El panel lateral de contexto queda cerrado por defecto y puede abrirse cuando se necesita ayuda.

## Explorar y rutas

Explorar presenta nivel, propósito, volumen y progreso. Los nombres de movimientos, grupos de fuentes y metadatos técnicos dejan de competir con el título.

En una ruta, la vista principal explica cómo se estudia y muestra el temario. Recursos, fuentes, límites y el itinerario de evaluación quedan en controles desplegables. Los requisitos previos se reúnen en un único aviso y se eliminan duplicados.

## Lecciones

La vista predeterminada es **Teoría**. El usuario puede cambiar a modelo, teoría más modelo, lectura limpia o texto accesible.

- La teoría usa una columna de lectura de hasta 900 px, tipografía mayor y altura de línea configurable.
- El índice completo está plegado; los botones Anterior y Continuar bastan para la lectura lineal.
- Preparación, ciclo pedagógico, vocabulario y ayuda se reúnen en un único bloque consultable.
- Fuentes, glosario y descripción accesible permanecen disponibles al final del lector.
- La migración de claridad cambia a modo Teoría los perfiles que aún conservaban el antiguo valor predeterminado “Dividido”. Una elección posterior del usuario sí se conserva.

## Prácticas

La ficha previa responde en este orden:

1. qué se hará;
2. cuánto dura y qué base necesita;
3. cuáles son los pasos;
4. cómo comprobar y comenzar.

Contratos, recursos, alcance, criterios, tutor y advertencias permanecen en **Preparación, recursos y límites**. El botón principal está en el panel visible de inicio y utiliza verbos explícitos: **Comprobar y continuar** y **Empezar práctica**.

## Espacio de práctica

- El panel derecho de ayuda está cerrado por defecto.
- El panel izquierdo contiene el objetivo, la acción actual, los pasos y la respuesta.
- La ubicación dentro del curso y la cadena causal completa están plegadas.
- Los modos se nombran por lo que muestran: Instrucciones, Modelo, Instrucciones + modelo, Ayuda y Texto accesible.
- La ayuda empieza por “Qué hacer ahora” y “Fíjate en esto”. Pistas, fidelidad, fuentes y datos técnicos se abren bajo demanda.

## Lenguaje visible

Reglas de redacción para nuevas superficies:

- usar verbos concretos: leer, observar, elegir, comparar, medir, guardar;
- explicar primero la consecuencia práctica y después el término relojero;
- no mostrar nombres de esquemas, contratos, bases de datos o sistemas como títulos de producto;
- traducir `fixture`, `selector`, `canónico`, `trazable` y `reversible` cuando aparecen en zonas de aprendizaje;
- reservar G/K/P, IDs, diagnósticos y procedencia detallada para controles desplegables;
- no usar una advertencia técnica como instrucción principal;
- evitar repetir objetivo, alcance y siguiente paso en varios paneles.

## Persistencia y compatibilidad

La reorganización no cambia sesiones, progreso, resultados, notas, marcadores, capturas, proyectos técnicos ni paquetes de contenido. La migración solo añade una versión de preferencia visual y selecciona Teoría una vez para perfiles creados antes de esta revisión.

## Criterios de comprobación

- Inicio no renderiza las doce rutas ni el mapa profesional completos por defecto.
- Una lección permite llegar al primer párrafo sin atravesar paneles de metodología.
- La teoría es la vista inicial tras migrar preferencias antiguas.
- Una práctica muestra su acción principal sin exigir desplazamiento vertical.
- El espacio de práctica reserva el centro para el modelo o documento y mantiene la ayuda cerrada inicialmente.
- Toda información técnica retirada del primer plano sigue siendo accesible mediante `details` o una superficie de consulta.
- Los controles mantienen nombre accesible y navegación por teclado.

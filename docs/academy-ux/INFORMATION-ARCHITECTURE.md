# Arquitectura de información de Watchmaking Academy

## Contextos de nivel superior

| Contexto | Propósito | Estado compartido |
|---|---|---|
| Estudio | Diseñar y validar el reloj técnico | `WatchProject`, CAD, validación |
| Academia | Aprender, practicar y revisar | referencia de solo lectura al proyecto; sesiones, evidencia y preferencias propias |

El cambio de contexto no crea ni transforma proyectos. Al volver a Academia se restaura el último deep link educativo válido.

## Navegación de Academia

### Aprender

- Inicio
- Mi aprendizaje
- Explorar currículo
- Rutas, módulos y lecciones

### Practicar

- Taller virtual
- Atlas de movimientos y piezas
- Revisión y retención

### Consultar

- Buscar
- Cuaderno
- Glosario
- Fuentes

### Estado y gestión

- Progreso y evidencias
- Sesiones e historial
- Contenido local
- Perfil y preferencias

## Jerarquía curricular

```text
Academia
└── Ruta
    └── Módulo
        └── Lección
            ├── Bloques de lectura
            ├── Recursos visuales
            └── Actividades
                ├── Escena 3D
                ├── Banco virtual
                ├── Laboratorio mecánico
                └── Laboratorio de calibre
```

La navegación curricular deriva de `LearningProductIndex`; la lectura editorial deriva del `LearningPack` exacto. Ninguna pantalla replica prosa o currículo.

## Entidades transversales

- competencia;
- sesión e intento;
- evidencia;
- evaluación;
- recomendación;
- movimiento/fixture;
- pieza/instancia;
- término;
- fuente;
- nota local.

Cada entidad conserva un enlace estable. Los nombres visibles nunca sustituyen los IDs canónicos.

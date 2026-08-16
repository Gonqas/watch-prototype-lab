# Auditoría 3D · etapa 4 · 0.14J

| Estado | Decisión | Estado técnico | Motivo |
| --- | --- | --- | --- |
| reader.3d.miyota8215.overview | keep | source-limited | Localiza un ensamblaje y sus grupos sin afirmar escala o tolerancias. |
| reader.3d.miyota8215.train-isolated | keep | source-limited | Aísla piezas modeladas del tren; contactos y geometría permanecen inferidos. |
| reader.3d.miyota8215.automatic-isolated | correct | source-limited | La ruta completa, sentidos y eficiencia no se presentan como oficiales. |
| reader.3d.miyota8215.rotor-checkpoint | correct | source-limited | Muestra una fijación y dependencia, no herramienta, par, dirección ni primer paso. |
| reader.3d.miyota8215.barrel-bridge-checkpoint | source-needed | source-needed | Solo puede mostrar dependencia; el orden físico necesita fuente de servicio. |
| reader.3d.miyota8215.inspection-train | keep | source-limited | Localiza el tren sin representar desgaste, suciedad o holguras. |
| reader.3d.miyota8215.inspection-support | keep | source-limited | Localiza una interfaz sin declarar que la holgura sea correcta. |

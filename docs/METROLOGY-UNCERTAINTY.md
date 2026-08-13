# Incertidumbre y series

```mermaid
flowchart LR
  L["Lecturas originales"] --> S["Media, rango y s muestral"]
  R["Resolución"] --> U["Componentes declarados"]
  C["Verificación/calibración"] --> U
  S --> U
  U --> Q["Combinación cuadrática explícita"]
  Q --> E["Incertidumbre expandida solo si k está documentado"]
```

El sistema diferencia resolución, exactitud, precisión, repetibilidad, error, dispersión, incertidumbre y tolerancia. La resolución aporta una componente rectangular `resolución/√12`; la repetición y la calibración se incorporan solo si existen. Cada resultado conserva fórmula, entradas, unidades, redondeo, supuestos y límites.

No se afirma conformidad formal con GUM/ISO: falta un presupuesto validado para cada mensurando, correlaciones, grados efectivos de libertad y trazabilidad acreditada. `gumCompliant` permanece `false`. La tolerancia pertenece al diseño o fuente nominal y nunca se deriva de la incertidumbre.

```mermaid
flowchart TD
  A["Lectura capturada"] --> D{"¿Descartada?"}
  D -->|No| K["Conservar en cálculo"]
  D -->|Sí, con motivo| E["Conservar como evidencia, excluir del cálculo"]
  D -->|Sí, sin motivo| X["Rechazar serie"]
  K --> V["Valor adoptado + razón"]
  E --> V
```

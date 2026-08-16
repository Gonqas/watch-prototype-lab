# Matriz de compatibilidad · etapa 5 · 0.14K

| Interfaz | Componentes | Método | Datos requeridos |
| --- | --- | --- | --- |
| movement-case | component.movement ↔ component.case | clearance | movement-envelope, case-cavity, axial-support |
| movement-holder | component.movement ↔ component.movement-holder | fit | movement-diameter, holder-inner-diameter, axial-support |
| holder-case | component.movement-holder ↔ component.case | fit | holder-outer-diameter, case-seat-diameter, anti-rotation |
| stem-movement | component.stem ↔ component.movement | document-comparison | stem-reference, movement-stem-interface |
| stem-crown | component.stem ↔ component.crown | fit | stem-thread, crown-thread, functional-length |
| crown-tube | component.crown ↔ component.tube | dynamic-envelope | crown-interface, tube-interface, travel-states |
| tube-case | component.tube ↔ component.case | alignment | tube-seat, case-tube-seat, axis-height |
| dial-movement | component.dial ↔ component.movement | clearance | dial-thickness, movement-dial-support, date-aperture |
| dial-seat | component.dial ↔ component.case | fit | dial-total-diameter, case-dial-seat, visible-opening |
| dial-feet | component.dial ↔ component.movement | document-comparison | foot-count, foot-radius, foot-angles, movement-foot-holes |
| hands-posts | component.hand-hour ↔ component.movement | fit | post-diameters, hand-hole-diameters, tube-lengths |
| hour-wheel-dial | component.movement ↔ component.dial | clearance | hour-wheel-height, dial-thickness, dial-gap |
| hands-dial | component.hand-hour ↔ component.dial | clearance | hour-hand-height, dial-surface-height, index-height |
| hands-hands | component.hand-hour ↔ component.hand-minute | dynamic-envelope | hour-hand-envelope, minute-hand-envelope, second-hand-envelope |
| hands-crystal | component.hand-minute ↔ component.crystal | dynamic-envelope | hand-stack-top, crystal-inner-height, rehaut-envelope |
| rotor-caseback | component.movement ↔ component.caseback | dynamic-envelope | rotor-envelope, caseback-inner-height, gasket-stack |
| crystal-bezel | component.crystal ↔ component.bezel | fit | crystal-seat, bezel-seat, retention-method |
| gasket-housing | component.gasket ↔ component.case | fit | gasket-section, housing-section, supplier-fit |
| donor-receiver | component.donor-part ↔ component.other | document-comparison | donor-identity, receiver-identity, applicable-interfaces |

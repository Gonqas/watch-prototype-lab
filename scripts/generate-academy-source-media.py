#!/usr/bin/env python3
"""Genera recortes didácticos trazables para las etapas 0–5 de la Academia.

Los originales privados se usan solo para estudio local. Cada derivado conserva
fuente, página, figura, caja de recorte y hash en ``manifest.json``. La carpeta
final no debe publicarse ni redistribuirse sin revisar los derechos de cada obra.
"""

from __future__ import annotations

import hashlib
import io
import json
import shutil
import subprocess
import urllib.request
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Final

try:
    from PIL import Image, ImageEnhance, ImageOps
except ModuleNotFoundError as error:
    raise SystemExit(
        "Falta Pillow para generar las figuras fuente. Ejecuta "
        "`npm run learning:source-media:setup` y vuelve a intentarlo."
    ) from error


ROOT: Final = Path(__file__).resolve().parents[1]
OUTPUT_DIR: Final = ROOT / "public" / "learning-media" / "source-figures"
RUNTIME_REGISTRY: Final = ROOT / "src" / "learning" / "academy" / "reader" / "personal" / "sourceFigures.generated.ts"
TMP_DIR: Final = ROOT / "tmp" / "pdfs" / "academy-source-media" / "build"
TOH_ZIP: Final = ROOT / "reference-library" / "originals" / "Theory of Horology-20260809T132232Z-1-001.zip"
RENDER_DPI: Final = 180
MAX_WIDTH: Final = 1800


@dataclass(frozen=True)
class Source:
    title: str
    locator: str
    rights: str
    private_use: bool
    author_or_manufacturer: str
    kind: str
    path: str | None = None
    zip_member: str | None = None
    url: str | None = None
    monochrome: bool = False


@dataclass(frozen=True)
class Asset:
    asset_id: str
    filename: str
    source_key: str
    page: int | None
    printed_page: str | None
    figure: str | None
    crop: tuple[float, float, float, float]
    alt: str
    caption: str
    what_to_look_for: str
    evidence: str
    does_not_show: str


SOURCES: Final[dict[str, Source]] = {
    "bulova": Source(
        title="Joseph Bulova School of Watch Making",
        locator="reference-library/originals/Joseph Bulova School of Watch Making.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="Joseph Bulova School of Watch Making",
        kind="pdf",
        path="reference-library/originals/Joseph Bulova School of Watch Making.pdf",
        monochrome=True,
    ),
    "daniels": Source(
        title="Horología completa / Watchmaking (copia de estudio)",
        locator="reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="George Daniels",
        kind="pdf",
        path="reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf",
        monochrome=True,
    ),
    "tm": Source(
        title="TM 9-1575 Ordnance Maintenance: Wrist Watches, Pocket Watches, Stop Watches, and Clocks",
        locator="reference-library/originals/TM 9-1575.pdf",
        rights="Documento histórico; derivado para estudio local. Revisar estado jurídico antes de distribuir.",
        private_use=True,
        author_or_manufacturer="U.S. War Department",
        kind="pdf",
        path="reference-library/originals/TM 9-1575.pdf",
        monochrome=True,
    ),
    "toh-1-3": Source(
        title="Theory of Horology, capítulos 1–3",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/ToH ch 1-3.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/ToH ch 1-3.pdf",
    ),
    "toh-4-5": Source(
        title="Theory of Horology, capítulos 4–5",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/ToH ch 4&5.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/ToH ch 4&5.pdf",
    ),
    "toh-6": Source(
        title="Theory of Horology, capítulo 6",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/ToH ch 6.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/ToH ch 6.pdf",
    ),
    "toh-7": Source(
        title="Theory of Horology, capítulo 7",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/ToH ch 7.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/ToH ch 7.pdf",
    ),
    "toh-8": Source(
        title="Theory of Horology, capítulo 8",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/ToH ch 8.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/ToH ch 8.pdf",
    ),
    "toh-9": Source(
        title="Theory of Horology, capítulo 9",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/ToH ch 9.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/ToH ch 9.pdf",
    ),
    "toh-12": Source(
        title="Theory of Horology, capítulo 12",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/ToH ch 12.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/ToH ch 12.pdf",
    ),
    "toh-15": Source(
        title="Theory of Horology, capítulo 15",
        locator="reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#Theory of Horology/TOH chap. 15.pdf",
        rights="Estudio personal local; revisar derechos antes de cualquier distribución.",
        private_use=True,
        author_or_manufacturer="The Watchmakers of Switzerland Training and Educational Program",
        kind="zip-pdf",
        zip_member="Theory of Horology/TOH chap. 15.pdf",
    ),
    "miyota-8215-train": Source(
        title="MIYOTA 8215 · vista explosionada, lado del tren",
        locator="https://miyotamovement.com/product/8215/",
        rights="Imagen oficial del fabricante incorporada para estudio local; revisar permiso antes de redistribuir.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="image",
        url="https://miyotamovement.com/uploads/product/product_moQeV8byx0JPUZStgs.jpg",
    ),
    "miyota-8215-dial": Source(
        title="MIYOTA 8215 · vista explosionada, lado de esfera",
        locator="https://miyotamovement.com/product/8215/",
        rights="Imagen oficial del fabricante incorporada para estudio local; revisar permiso antes de redistribuir.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="image",
        url="https://miyotamovement.com/uploads/product/product_Wu1JvB3PNYgbI5KRTs.jpg",
    ),
    "miyota-8215-drawing": Source(
        title="MIYOTA 8215 · plano oficial",
        locator="https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf",
        rights="Documento oficial marcado CONFIDENTIAL y provisional; copia derivada restringida al estudio personal local y no redistribuible sin permiso expreso.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="remote-pdf",
        url="https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf",
    ),
    "miyota-8215-specification": Source(
        title="MIYOTA 8215 · especificación oficial",
        locator="https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf",
        rights="Documento oficial enlazado; copia derivada solo para estudio local y con revisión previa a distribución.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="remote-pdf",
        url="https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf",
    ),
    "miyota-8215-manual": Source(
        title="MIYOTA 8215 · manual de uso oficial",
        locator="https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf",
        rights="Documento oficial enlazado; copia derivada solo para estudio local y con revisión previa a distribución.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="remote-pdf",
        url="https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf",
    ),
    "miyota-8215-parts": Source(
        title="MIYOTA 8215 · lista de piezas oficial",
        locator="https://miyotamovement.com/uploads/product/product_PveYk926HfOtdLJUux.pdf",
        rights="Documento oficial enlazado; copia derivada solo para estudio local y con revisión previa a distribución.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="remote-pdf",
        url="https://miyotamovement.com/uploads/product/product_PveYk926HfOtdLJUux.pdf",
    ),
    "miyota-2035-parts": Source(
        title="MIYOTA 2035 · lista de piezas y despiece oficial",
        locator="https://miyotamovement.com/uploads/product/product_j6P3s1O5naNRxHZWMK.pdf",
        rights="Documento oficial enlazado; copia derivada solo para estudio local y con revisión previa a distribución.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="remote-pdf",
        url="https://miyotamovement.com/uploads/product/product_j6P3s1O5naNRxHZWMK.pdf",
    ),
    "miyota-2035-train": Source(
        title="MIYOTA 2035 · vista explosionada, lado del tren",
        locator="https://miyotamovement.com/product/2035/",
        rights="Imagen oficial del fabricante incorporada para estudio local; revisar permiso antes de redistribuir.",
        private_use=True,
        author_or_manufacturer="MIYOTA",
        kind="image",
        url="https://miyotamovement.com/uploads/product/product_ksTEWH7PxYO6BRw0gM.jpg",
    ),
}


# Baseline verificada manualmente el 2026-08-18. El generador comprueba todos los
# binarios antes de escribir derivados: un cambio en una copia local o en una URL
# oficial obliga a revisar páginas, recortes y derechos antes de aceptar el hash.
EXPECTED_SOURCE_SHA256: Final[dict[str, str]] = {
    "bulova": "b13229157e4839d81285d9069f991f6e8c85c59536955f562298bffb7fe2c981",
    "daniels": "78cb0b2931e256f42e6f2843c21be86e47762c0e53f755eef04c86c798e348b2",
    "miyota-2035-parts": "8b7705b787c041d2f2224e8e1502f5c5f01a69b1dbddac42db44de74d2a7c4f7",
    "miyota-2035-train": "35fd84381f33dc7043335d32ac6ccf01584971880ad0db202c6619e6b6a52177",
    "miyota-8215-dial": "2f0712aad3d253e6edc1b52870a0816c2fb36f9b51b90895ddf08849600e7222",
    "miyota-8215-drawing": "95db183473b7372aad4f80665c23cdff32d5f64fdfe63b1cc3828811ef132c54",
    "miyota-8215-manual": "6286b8431619f825b6bfd2715be78891dd2cd7ba3dfbead3959d570b08e2afb9",
    "miyota-8215-parts": "fdafef819f8d0f3d91e4062072ce13a05beb20a4a61b96c6e2415500281657ad",
    "miyota-8215-specification": "bcb22d8e921b06165e67ffbbecfbcc444b8a67ccb4319d598c14bda6216418dc",
    "miyota-8215-train": "20fcc47f025fed60ec88f53e36ee68eefa76ba3bd3fe5a03465c82b70e5c5e7a",
    "tm": "6277f0e31ab6d94a576a811afb6d6bdce8c631013355215bc46b1ea8de42af08",
    "toh-1-3": "b8d78de3e95eee0ae7a7232288267b599973208e78b926b7c8b37a64b50696ae",
    "toh-12": "761a9ba5084c71c603e855c46508944338788e289fea429167032dab4f13488c",
    "toh-15": "2920e83b3019e2dcaf74462bcae4c56466ce209c750449cb08ab59e6f1e22c12",
    "toh-4-5": "354cbf219f61c4d764fc6420c16c20193a858d1a04d2c955bc5589fca9513f92",
    "toh-6": "5d6179b89ca3ca2e6f003da75737e408d3bfccca9b9cfd3815191776e9f059c6",
    "toh-7": "f3fc6d9f51098fadec86399a1ad40a1c5478bc0baa738dc6e0a3876516bbe894",
    "toh-8": "4d97bd1650f085b44aadeddf61dc9a661f133d0ff14a2e087745d9a827761e22",
    "toh-9": "87e9ea754bb624a4bd6de4795934cb9f62e7fc4734dc82161f19aeaa57e86ee6",
}


ASSETS: Final[list[Asset]] = [
    Asset("bulova-tool-family", "bulova-tool-family.webp", "bulova", 6, "4", "Fig. 1", (0.19, 0.38, 0.80, 0.70), "Lupa, dos destornilladores, pinzas, bloque de volante y soporte dispuestos como familia de herramientas.", "Familia mínima de herramientas en el manual formativo Bulova.", "Relaciona cada geometría con su función: observar, sujetar, girar, apoyar o contener.", "La selección se organiza por función y ajuste, no por acumular utensilios.", "No prescribe marcas actuales ni demuestra que una herramienta sirva para todas las piezas."),
    Asset("bulova-grips-bench", "bulova-grips-bench.webp", "bulova", 7, "5", "Figs. 2–4", (0.13, 0.40, 0.87, 0.91), "Cinco dibujos muestran cómo sostener pinzas, destornillador y lupa, y la posición de trabajo en el banco.", "Tomas y postura de banco propuestas por Bulova.", "Mira el apoyo de las manos, el ángulo de las herramientas y la cercanía del ojo a la tarea.", "La estabilidad nace de apoyos y alineación; apretar más no sustituye una buena postura.", "Es un ejemplo histórico, no una ergonomía universal ni una obligación de copiar exactamente la postura."),
    Asset("bulova-screw-condition", "bulova-screw-condition.webp", "bulova", 10, "8", "Comparación de cinco tornillos", (0.14, 0.58, 0.87, 0.83), "Cinco cabezas de tornillo comparan estado correcto, serrín, huella, ranura marcada y mancha de aceite.", "Comparación histórica de contaminación y daño visible en tornillos.", "Compara borde, ranura, reflejo y residuos; describe primero lo que ves.", "La inspección visual permite registrar diferencias y decidir si debes detenerte.", "La apariencia no identifica por sí sola la sustancia, la causa ni un método de limpieza."),
    Asset("daniels-historical-bench", "daniels-historical-bench.webp", "daniels", 12, "lámina XI", "Fotografía inferior", (0.15, 0.48, 0.86, 0.84), "Banco profesional histórico con superficie elevada, iluminación y zonas de apoyo.", "Ejemplo histórico de organización física de un banco de relojero.", "Busca separación de zonas, altura de trabajo, luz y contención de objetos pequeños.", "El entorno reduce pérdidas y posturas inestables cuando cada zona tiene una función.", "No define el equipo mínimo actual ni convierte una instalación profesional en requisito para aprender."),
    Asset("toh-watch-exploded", "toh-watch-exploded.webp", "toh-1-3", 33, "33", "Fig. 3-1", (0.45, 0.33, 0.95, 0.91), "Reloj completo descompuesto en caja, esfera, agujas, movimiento y elementos de cierre.", "Capas físicas de un reloj completo.", "Sigue el apilado desde el movimiento hasta la indicación y la envolvente exterior.", "Un reloj es un sistema de subsistemas conectados por interfaces, no una sola pieza.", "El despiece muestra ubicación aproximada, no orden seguro de desmontaje ni tolerancias."),
    Asset("toh-document-dimensioned", "toh-document-dimensioned.webp", "toh-1-3", 35, "35", "Fig. 3-6", (0.54, 0.055, 0.92, 0.18), "Sección esquemática de un movimiento con el diámetro de encajado y la altura total acotados.", "Fig. 3-6: diámetro de encajado y altura total de un movimiento.", "Distingue diámetro y altura; comprueba qué caras delimitan cada magnitud antes de reutilizarla.", "Una fuente acotada puede autorizar una dimensión concreta cuando revisión y variante aplican.", "Solo define dos dimensiones globales; no aporta tolerancias, secuencia de servicio ni el estado real de una pieza usada."),
    Asset("toh-mechanical-organs", "toh-mechanical-organs.webp", "toh-1-3", 36, "36", "Fig. 3-11", (0.05, 0.08, 0.96, 0.94), "Despiece funcional de un movimiento mecánico con sus órganos principales.", "Órganos físicos de un movimiento mecánico sencillo.", "Localiza acumulador, tren, escape, regulador e indicación sin confundir pieza con función.", "Las funciones se distribuyen entre conjuntos conectados.", "El dibujo no demuestra el sentido de todas las fuerzas ni una secuencia de desmontaje."),
    Asset("toh-mechanical-functions", "toh-mechanical-functions.webp", "toh-1-3", 38, "38", "Figs. 3-13–3-17", (0.48, 0.03, 0.97, 0.96), "Cinco dibujos muestran barrilete, tren, escape, volante-espiral e indicación.", "Cadena funcional mecánica representada por cinco conjuntos reales.", "Recorre de arriba abajo: almacenar, transmitir, distribuir, regular e indicar.", "La cadena permite separar flujo de energía y realimentación reguladora.", "Las miniaturas no muestran tolerancias, lubricación ni todas las interfaces."),
    Asset("toh-mechanical-energy-path", "toh-mechanical-energy-path.webp", "toh-1-3", 39, "39", "Fig. 3-18", (0.05, 0.08, 0.96, 0.94), "Esquema de un movimiento mecánico que relaciona barrilete, tren, escape, volante e indicación.", "Camino físico de energía y regulación en un reloj mecánico.", "Sigue la energía hacia la indicación y localiza dónde vuelve la información temporal.", "El escape enlaza la entrega de energía con el ritmo del oscilador.", "Es conceptual: no sustituye el análisis cinemático de un calibre concreto."),
    Asset("toh-quartz-block", "toh-quartz-block.webp", "toh-15", 3, "331", "Diagrama funcional", (0.53, 0.11, 0.88, 0.56), "Bloques de fuente de energía, acumulación, conteo y transmisión, distribución, regulación e indicación de un reloj de cuarzo.", "Cadena funcional de un reloj analógico de cuarzo.", "Observa que el control electrónico y la conversión electromecánica reparten la función temporal.", "El resonador de cuarzo no actúa solo: circuito, divisor, bobina, rotor y tren forman el sistema.", "La equivalencia con el reloj mecánico es funcional, no pieza por pieza."),
    Asset("toh-quartz-anatomy", "toh-quartz-anatomy.webp", "toh-15", 3, "331", "Fig. 15-6", (0.34, 0.53, 0.92, 0.94), "Planta de un movimiento de cuarzo analógico con batería, circuito, bobina, rotor y tren numerados.", "Anatomía real esquemática de un movimiento de cuarzo.", "Relaciona los números con alimentación, electrónica, conversión y transmisión.", "La cadena funcional se materializa en componentes distribuidos alrededor de la platina.", "No corresponde necesariamente al MIYOTA 2035 ni autoriza intercambiar piezas."),
    Asset("toh-barrel-exploded", "toh-barrel-exploded.webp", "toh-4-5", 2, "46", "Fig. 4-4", (0.55, 0.14, 0.96, 0.58), "Despiece del barrilete con tambor, muelle real, árbol y tapa numerados.", "Arquitectura básica del barrilete.", "Identifica qué contiene el muelle, qué lo centra y por dónde sale el par.", "Hay energía almacenada aunque el tren todavía no se mueva; la salida depende de interfaces y apoyos.", "La figura no aporta una curva de par ni tolerancias universales."),
    Asset("toh-pitch-circles", "toh-pitch-circles.webp", "toh-4-5", 9, "53", "Figs. 5-9 y 5-10", (0.48, 0.15, 0.95, 0.69), "Cilindros equivalentes y dos ruedas dentadas muestran sus círculos primitivos.", "Círculos primitivos y contacto de una pareja dentada.", "Distingue perfil del diente, círculo primitivo y distancia entre centros.", "La relación se razona con dientes o radios primitivos, no con el diámetro exterior visible.", "No basta para aceptar engrane real: faltan módulo, perfil, juego y estado."),
    Asset("toh-intermediate-train", "toh-intermediate-train.webp", "toh-4-5", 12, "56", "Figs. 5-14 y 5-15", (0.46, 0.12, 0.96, 0.62), "Diagramas de un tren con rueda intermedia y cálculo de relación por etapas.", "Relación de transmisión calculada eje por eje.", "Marca qué piezas engranan y cuáles comparten eje antes de multiplicar relaciones.", "Una rueda intermedia puede cambiar el sentido sin alterar la magnitud total de la relación en ciertos trenes.", "El ejemplo no autoriza aplicar sus números a otro tren."),
    Asset("toh-motion-works", "toh-motion-works.webp", "toh-4-5", 18, "62", "Fig. 5-26", (0.43, 0.08, 0.96, 0.51), "Diagrama de minutería y puesta en hora con ruedas y piñones conectados a las agujas.", "Rutas de marcha normal y corrección manual.", "Separa la ruta que mantiene las agujas en marcha de la que actúa al tirar y girar la corona.", "Tren de marcha, minutería y remontuar cumplen funciones distintas aunque se conecten.", "La figura es densa y no muestra por sí sola el estado de cada embrague en un calibre concreto."),
    Asset("toh-lever-escapement-anatomy", "toh-lever-escapement-anatomy.webp", "toh-6", 3, "101", "Figs. 6-6 y 6-7", (0.42, 0.08, 0.96, 0.91), "Vista superior y sección de escape de áncora suizo con rueda, paletas, áncora, rodillo y dardo.", "Anatomía y planos del escape de áncora suizo.", "Localiza superficies de bloqueo e impulso y la relación entre clavija, horquilla y dardo.", "El escape alterna bloqueo, liberación, impulso y seguridad mediante geometría coordinada.", "No fija tolerancias universales ni representa escapes coaxial, de retén o directo."),
    Asset("toh-lever-escapement-phases", "toh-lever-escapement-phases.webp", "toh-6", 12, "110", "Secuencia de fases", (0.32, 0.06, 0.98, 0.96), "Tres diagramas muestran posiciones sucesivas de rueda de escape, áncora y rodillo.", "Secuencia espacial del escape durante una alternancia.", "Sigue un mismo diente: bloqueo, liberación, impulso y caída hasta el siguiente bloqueo.", "Comprender la fase requiere seguir contactos y sentidos, no memorizar una lista de nombres.", "Los ángulos son ilustrativos y no son criterios de ajuste para cualquier calibre."),
    Asset("toh-balance-spring-states", "toh-balance-spring-states.webp", "toh-7", 5, "133", "Figs. 7-8–7-10", (0.44, 0.06, 0.97, 0.94), "Volante y espiral aparecen en sección y en estados extremo, equilibrio y extremo opuesto.", "Estados del oscilador volante-espiral.", "Compara posición angular, deformación del espiral y paso por el equilibrio.", "Amplitud describe extensión del movimiento; frecuencia describe cuántos ciclos ocurren por unidad de tiempo.", "El dibujo no es una medición temporal ni muestra pérdidas reales de amplitud."),
    Asset("toh-automatic-rotors", "toh-automatic-rotors.webp", "toh-8", 3, "171", "Figs. 8-6 y 8-7", (0.43, 0.18, 0.97, 0.94), "Dos dibujos comparan masa oscilante limitada y rotor de vuelta completa.", "Dos arquitecturas de masa oscilante automática.", "Compara recorrido, pivote y espacio ocupado; no confundas forma del rotor con todo el sistema de carga.", "La masa capta movimiento, pero inversión, reducción y transmisión hasta el barrilete requieren otros órganos.", "No muestra el mecanismo automático completo ni la reserva de marcha resultante."),
    Asset("toh-simple-calendar", "toh-simple-calendar.webp", "toh-9", 3, "191", "Fig. 9-5", (0.43, 0.10, 0.97, 0.64), "Tren de fecha simple con disco o estrella, rueda de arrastre y resorte de posicionamiento.", "Arquitectura de un calendario simple.", "Sigue la acumulación, liberación y posicionamiento que produce un salto de fecha.", "Un calendario es una secuencia temporizada de estados con retención y cambio.", "No sustenta calendarios anual o perpetuo ni un cronógrafo."),
    Asset("toh-exterior-exploded", "toh-exterior-exploded.webp", "toh-12", 1, "253", "Fig. 12-1", (0.45, 0.31, 0.96, 0.92), "Despiece del exterior de un reloj con cristal, bisel, caja, juntas, esfera, agujas, movimiento y fondo.", "Capas e interfaces del exterior del reloj.", "Sigue cada capa y pregunta si centra, apoya, retiene, sella o permite desmontar.", "La envolvente exterior es una cadena de interfaces, no una única cota de diámetro.", "El dibujo no define tolerancias ni demuestra hermeticidad."),
    Asset("toh-movement-casing", "toh-movement-casing.webp", "toh-12", 8, "260", "Figs. 12-20–12-23", (0.45, 0.14, 0.96, 0.94), "Varias secciones muestran anillos y tornillos que fijan el movimiento dentro de la caja.", "Formas de centrar y retener un movimiento en la caja.", "Distingue centrado radial, apoyo axial, retención y acceso para desmontar.", "Una misma pieza puede cumplir varias funciones, pero cada interfaz debe verificarse por separado.", "Son soluciones genéricas históricas, no el soporte 500-710 del MIYOTA 8215."),
    Asset("toh-case-architectures", "toh-case-architectures.webp", "toh-12", 9, "261", "Figs. 12-24–12-28", (0.49, 0.05, 0.97, 0.95), "Secciones comparan cajas de una, dos y tres piezas y distintos cierres de fondo.", "Comparación de arquitecturas de caja.", "Localiza carrura, bisel, fondo y superficies de unión en cada arquitectura.", "Cambiar la arquitectura cambia las rutas de montaje, acceso y posible fuga.", "La comparación no prescribe ajustes ni materiales actuales."),
    Asset("toh-sealed-case-section", "toh-sealed-case-section.webp", "toh-12", 10, "262", "Fig. 12-29", (0.08, 0.13, 0.95, 0.95), "Tres secciones longitudinales de una caja de tres piezas muestran bisel, cristal, corona y fondo.", "Sección axial de una caja y sus interfaces exteriores.", "Sigue las rutas desde exterior a interior por cristal, corona y fondo; no sumes márgenes que pertenecen a interfaces distintas.", "La sección permite razonar cadenas axiales y rutas de fuga separadas.", "No acredita estanqueidad ni sustituye la ficha de cristal, corona, tubo o junta."),
    Asset("toh-crowns-seals", "toh-crowns-seals.webp", "toh-12", 11, "263", "Figs. 12-30–12-34", (0.46, 0.13, 0.97, 0.94), "Secciones de coronas simples y selladas muestran tubo, tija y posibles juntas.", "Interfaces entre corona, tubo y tija.", "Separa alineación de ejes, longitud funcional, retención y sellado.", "La tija del movimiento solo resuelve una parte de la interfaz; corona y tubo exigen documentación propia.", "No autoriza una solución de estanqueidad moderna ni cotas de proveedor."),
    Asset("toh-crystal-seats", "toh-crystal-seats.webp", "toh-12", 13, "265", "Figs. 12-40–12-42", (0.47, 0.12, 0.97, 0.91), "Tres secciones muestran cristales sintéticos y naturales en distintos asientos de bisel.", "Asientos y geometrías de cristales.", "Identifica cara de apoyo, retención, solape y espacio sobre las agujas.", "El diámetro exterior del cristal no basta: perfil, asiento y altura condicionan el ajuste.", "No aporta tolerancias comerciales actuales ni demuestra resistencia al agua."),
    Asset("toh-gaskets-cement", "toh-gaskets-cement.webp", "toh-12", 14, "266", "Figs. 12-43–12-49", (0.46, 0.10, 0.97, 0.94), "Secciones y perfiles muestran juntas históricas y uniones cementadas alrededor de caja y cristal.", "Rutas de sellado mediante juntas y cementos.", "Mira continuidad, compresión prevista y posibles interrupciones del camino de sellado.", "Una ruta de fuga se analiza interfaz por interfaz; el material solo funciona dentro de una geometría definida.", "Es teoría histórica y no autoriza materiales, adhesivos, compresión ni ensayo actuales."),
    Asset("toh-dials-feet", "toh-dials-feet.webp", "toh-12", 15, "267", "Figs. 12-50–12-57", (0.46, 0.07, 0.97, 0.95), "Secciones de esfera, pies, fijaciones y disco de fecha muestran su relación con el movimiento.", "Arquitectura de esfera y fijación.", "Relaciona apertura visible, asiento, pies, ventana y espacio posterior con referencias comunes.", "La esfera es una interfaz geométrica entre movimiento, indicación y caja.", "Las figuras no dan cotas de las variantes 8215-33E o 8215-36E."),
    Asset("toh-hands-tubes", "toh-hands-tubes.webp", "toh-12", 16, "268", "Figs. 12-58–12-69", (0.46, 0.06, 0.97, 0.95), "Perfiles de agujas y secciones de tubos muestran distintas geometrías de ajuste.", "Geometría de agujas, tubos y postes.", "Compara agujero, tubo, hombro, longitud y planos de barrido.", "El ajuste de una aguja combina diámetro, asiento, altura y espacio dinámico.", "No contiene las cotas de los postes del movimiento adquirido ni autoriza montar sin medir."),
    Asset("tm-trace-baseline", "tm-trace-baseline.webp", "tm", 78, "73", "Fig. 35", (0.14, 0.12, 0.90, 0.49), "Registro histórico con cuatro trazas etiquetadas A–D para distintas marchas.", "Fig. 35: trazas históricas de referencia para comparar pendiente y escala.", "Mira separación, pendiente, continuidad y cambio entre trazas antes de atribuir causa.", "La forma de una traza aporta evidencia comparativa cuando el método y la escala están registrados.", "No es un criterio moderno de aceptación ni equivale directamente a la pantalla de un cronocomparador actual."),
    Asset("tm-trace-double-line", "tm-trace-double-line.webp", "tm", 80, "75", "Fig. 37", (0.14, 0.12, 0.90, 0.58), "Registro histórico de dos líneas en lugar de una.", "Fig. 37: ejemplo histórico de línea doble como síntoma observable.", "Describe primero que hay dos familias de marcas; luego contrasta hipótesis mecánicas.", "Un patrón permite formular pruebas discriminantes, no cerrar el diagnóstico por parecido.", "La figura no identifica por sí sola la causa ni autoriza una reparación."),
    Asset("tm-trace-rate-interference", "tm-trace-rate-interference.webp", "tm", 83, "78", "Figs. 41 y 42", (0.12, 0.10, 0.90, 0.94), "Dos registros históricos muestran un cambio de marcha y un patrón irregular por rozamiento o interferencia.", "Figs. 41 y 42: comparación histórica entre cambio de marcha e irregularidad.", "Compara pendiente suave frente a discontinuidad o ruido; separa dato, hipótesis y prueba siguiente.", "Patrones distintos pueden requerir comprobaciones diferentes aunque ambos produzcan mala marcha.", "Los textos históricos enumeran causas posibles, no veredictos automáticos ni límites actuales."),
    Asset("tm-trace-irregular-locking", "tm-trace-irregular-locking.webp", "tm", 86, "81", "Fig. 45", (0.14, 0.12, 0.90, 0.56), "Registro histórico irregular asociado en el manual a un bloqueo defectuoso de la rueda de escape.", "Fig. 45: traza irregular usada como pista diagnóstica histórica.", "Busca pérdida de continuidad y variación; formula una prueba del escape antes de decidir.", "Una pista causal gana valor cuando se confirma mediante una observación independiente.", "No demuestra que todo patrón similar tenga la misma causa."),
    Asset("daniels-jewel-concentricity", "daniels-jewel-concentricity.webp", "daniels", 196, "176", "Figs. 351 y 352", (0.04, 0.17, 0.43, 0.84), "Dos dibujos muestran comprobación de concentricidad y corrección de la cara de un útil para piedras.", "Concentricidad y apoyo durante trabajo de piedras.", "Observa eje, cara de apoyo y cómo un error de alineación se propaga al asiento.", "La geometría del apoyo condiciona concentricidad y altura; no basta con que la pieza entre.", "No prescribe una reparación para una piedra concreta ni sustituye práctica supervisada."),
    Asset("daniels-jewel-height", "daniels-jewel-height.webp", "daniels", 197, "177", "Fig. 353", (0.66, 0.14, 0.93, 0.41), "Empujador de una prensa de piedras apoyado en la platina mientras se ajusta su tope de profundidad.", "Fig. 353: ajuste de la altura del empujador antes de prensar una piedra.", "Localiza la cara de la platina usada como referencia, la cara del empujador y el tope que limita su recorrido.", "La profundidad prevista para la piedra se establece respecto de una cara declarada y depende de que la herramienta esté comprobada.", "Muestra el ajuste previo del empujador, no una piedra ya asentada; el valor histórico indicado en el texto no es una tolerancia universal."),
    Asset("daniels-oil-sink-geometry", "daniels-oil-sink-geometry.webp", "daniels", 201, "181", "Figs. 367–369", (0.05, 0.50, 0.94, 0.91), "Tres esquemas muestran formación de depósito, domo y separación entre depósito y domo en una piedra.", "Geometría del depósito de aceite alrededor de una piedra.", "Mira la forma de las superficies y la zona prevista para retener lubricante.", "La geometría influye en dónde puede permanecer el lubricante y en la contaminación del contacto.", "No especifica producto, cantidad ni tabla moderna de lubricación."),
    Asset("daniels-gear-ratio", "daniels-gear-ratio.webp", "daniels", 123, "103", "Figs. 186–188", (0.675, 0.28, 0.95, 0.88), "Tres esquemas comparan círculos de relación 4:1, una pareja de 32/8 dientes y una combinación geométricamente incorrecta.", "Figs. 186–188: del cociente ideal 4:1 a una pareja dentada coherente y otra incorrecta.", "Compara diámetro primitivo, número de dientes, cociente y distancia entre centros en los tres esquemas.", "Conservar el mismo cociente numérico no basta si paso y círculos primitivos no permiten el engrane.", "Los dibujos son ejemplos conceptuales; no fijan módulo, perfil, juego ni criterio de aceptación para otra pareja."),
    Asset("daniels-depthing-tool", "daniels-depthing-tool.webp", "daniels", 143, "123", "Fig. 220", (0.12, 0.48, 0.72, 0.70), "Herramienta de depthing con dos ejes ajustables que mantienen rueda y piñón paralelos mientras cambia su separación.", "Fig. 220: herramienta para comprobar físicamente la profundidad de engrane.", "Observa los dos ejes, su paralelismo y el ajuste de la distancia entre centros.", "Un cálculo nominal necesita validación geométrica y funcional del engrane.", "La figura no demuestra sensibilidad de uso, ausencia de caída o agarrotamiento ni un criterio universal de aceptación."),
    Asset("daniels-hands-clearance", "daniels-hands-clearance.webp", "daniels", 189, "168", "Figuras de agujas", (0.04, 0.12, 0.73, 0.92), "Esquemas de agujas y alturas muestran tubos, cañones y separaciones durante el barrido.", "Geometría axial de las agujas.", "Sigue desde el poste o cañón hasta el plano de cada aguja y su barrido.", "La compatibilidad exige diámetro y también altura, asiento, longitud y separación dinámica.", "No aporta cotas del movimiento adquirido ni permite fabricar sin medir."),
    Asset("daniels-hands-shaping", "daniels-hands-shaping.webp", "daniels", 190, "169", "Fig. 338", (0.645, 0.22, 0.96, 0.78), "Seis estados sucesivos muestran taladrado, escalones, tubo, bisel, forma y curvatura de una aguja.", "Fig. 338: seis estados de conformado de una aguja.", "Separa referencias y operaciones: orificio central, caras escalonadas, tubo, bisel, contorno y curvatura final.", "La forma final depende de una secuencia en la que cada operación conserva referencias para la siguiente.", "Es una secuencia histórica de fabricación especializada; no acredita destreza, tolerancias ni seguridad de ejecución."),
    Asset("daniels-hand-grip", "daniels-hand-grip.webp", "daniels", 191, "170", "Figs. 340 y 340a", (0.04, 0.08, 0.96, 0.30), "Una aguja larga se sujeta por el centro en un portabrocas manual y se apoya en una ranura durante el conformado.", "Figs. 340 y 340a: sujeción y apoyo de una aguja larga y delgada.", "Mira qué superficie sujeta el centro, qué ranura soporta el vástago y por dónde queda libre la zona de trabajo.", "Sujeción y apoyo reparten la carga y reducen flexión o marcas durante el conformado.", "No muestra la fuerza, abrasivo, tolerancia ni destreza necesarias; no autoriza ejecutar la operación sin práctica supervisada."),
    Asset("daniels-movement-template", "daniels-movement-template.webp", "daniels", 300, "281", "Figs. 526a y 526b", (0.47, 0.25, 0.96, 0.80), "Dos plantillas circulares muestran el reparto de ruedas y órganos por ambas caras de un movimiento.", "Plantilla de arquitectura de un movimiento.", "Busca centros, círculos de barrido, zonas ocupadas e interfaces entre caras.", "Diseñar empieza por reservar espacio y dependencias antes de definir componentes.", "Es un ejemplo histórico, no una plantilla reutilizable ni las dimensiones del proyecto personal."),
    Asset("daniels-dial-template", "daniels-dial-template.webp", "daniels", 302, "283", "Fig. 528", (0.22, 0.06, 0.61, 0.35), "Plantilla circular de esfera con centros, ventanas y zonas de indicación.", "Relación entre arquitectura del movimiento y diseño de esfera.", "Alinea centro de agujas, ventana, pies y apertura visible con referencias comunes.", "La esfera es una interfaz dimensional, no solo una superficie gráfica.", "La figura no aporta cotas aplicables al MIYOTA 8215 ni define método de fabricación."),
    Asset("daniels-axial-stack", "daniels-axial-stack.webp", "daniels", 304, "285", "Fig. 531", (0.05, 0.16, 0.96, 0.43), "Sección longitudinal acotada de un movimiento muestra alturas, espesores y holguras.", "Cadena dimensional axial de un movimiento.", "Sigue un datum común y suma espesores, apoyos y holguras hasta caja, esfera, agujas y cristal.", "Una incompatibilidad axial puede surgir aunque cada diámetro parezca correcto.", "Las cifras pertenecen al ejemplo de la fuente, no al proyecto ni al MIYOTA 8215."),
    Asset("daniels-case-sections", "daniels-case-sections.webp", "daniels", 378, "362", "Figs. 684 y 685", (0.05, 0.175, 0.92, 0.91), "Tres secciones muestran etapas de conformado de un bisel y otra sección ilustra cómo galgar la altura del fondo.", "Figs. 684 y 685: perfil interior del bisel y comprobación axial del fondo.", "En la Fig. 684 sigue las caras creadas en A, B y C; en la 685 identifica desde qué referencias se galga la altura del fondo.", "La geometría interior se obtiene y comprueba mediante referencias distintas de la silueta exterior.", "Es fabricación histórica especializada; no da tolerancias, método de sellado, hermeticidad ni presión admisible."),
    Asset("daniels-dial-feet", "daniels-dial-feet.webp", "daniels", 411, "395", "Figs. 763–766", (0.05, 0.04, 0.95, 0.495), "Cuatro dibujos muestran pies o alambres de esfera preparados para soldadura y dos formas de retención por tornillo.", "Figs. 763–766: opciones históricas de fijación de pies de esfera.", "Compara posición, superficie de apoyo, preparación del pie, dirección de retención y posibilidad de desmontaje.", "La fijación debe definirse como interfaz con posición y método, no como un punto genérico.", "Describe técnicas históricas de fabricación; no recomienda soldar ni modificar una esfera real sin proceso, material y práctica especializados."),
    Asset("miyota-8215-exploded-train", "miyota-8215-exploded-train.webp", "miyota-8215-train", None, None, "Vista oficial", (0.0, 0.0, 1.0, 1.0), "Vista explosionada oficial del MIYOTA 8215 por el lado del tren y del automático.", "Despiece oficial del MIYOTA 8215, lado del tren.", "Sigue puentes, rotor, automático, tren, barrilete, escape y órgano regulador usando las referencias del fabricante.", "La imagen sustenta identidad y relación espacial aproximada de piezas.", "Un despiece no es una secuencia de desmontaje, no muestra pares de apriete y puede variar por revisión."),
    Asset("miyota-8215-exploded-dial", "miyota-8215-exploded-dial.webp", "miyota-8215-dial", None, None, "Vista oficial", (0.0, 0.0, 1.0, 1.0), "Vista explosionada oficial del MIYOTA 8215 por el lado de la esfera, con calendario y remontuar.", "Despiece oficial del MIYOTA 8215, lado de esfera.", "Localiza tija, remontuar, minutería y componentes de calendario antes de relacionarlos con funciones.", "La vista permite ubicar conjuntos y referencias de pieza.", "No demuestra el orden seguro de desmontaje ni el estado de una variante concreta."),
    Asset("miyota-8215-drawing", "miyota-8215-drawing.webp", "miyota-8215-drawing", 1, "1", "Plano oficial confidencial y provisional", (0.015, 0.0, 0.985, 0.985), "Primera página del plano oficial confidencial y provisional MIYOTA 8215 con vistas y dimensiones nominales.", "Envolvente, eje de tija y postes de agujas del MIYOTA 8215.", "Lee primero la cabecera CONFIDENTIAL y la nota de provisionalidad; después distingue diámetro, altura, referencias de tija y vistas, conservando unidad y revisión junto a cada dato.", "El plano puede respaldar cotas publicadas para estudio personal cuando modelo y revisión aplican.", "El propio documento es confidencial, provisional y sujeto a cambio; no autoriza redistribución, no mide tu unidad ni demuestra compatibilidad física."),
    Asset("miyota-8215-dial-drawing", "miyota-8215-dial-drawing.webp", "miyota-8215-drawing", 2, "2", "Plano 8215-33E confidencial y provisional", (0.015, 0.0, 0.985, 0.985), "Segunda página del plano oficial confidencial y provisional MIYOTA 8215 con referencias de esfera 8215-33E.", "Referencias de esfera de una variante documentada.", "Lee primero la cabecera de confidencialidad y provisionalidad; después localiza centro, pies, ventana y referencias angulares sin mezclar variantes.", "Una variante de esfera debe tratarse como paquete coherente de cotas.", "No autoriza redistribución ni trasladar esas cotas a 36E o a una esfera real sin confirmar identidad y revisión."),
    Asset("miyota-8215-stem-drawing", "miyota-8215-stem-drawing.webp", "miyota-8215-drawing", 3, "3", "Tija 065-212 · plano confidencial y provisional", (0.015, 0.0, 0.985, 0.985), "Tercera página del plano oficial confidencial y provisional MIYOTA 8215 con la tija 065-212 y su rosca.", "Geometría documental de la tija 065-212.", "Lee primero la cabecera de confidencialidad y provisionalidad; después separa eje, longitud funcional, hombros y rosca S0.9 de paso 0,225 mm.", "La tija resuelve la interfaz del lado movimiento; corona y tubo requieren documentación adicional.", "No autoriza redistribución ni determina por sí sola la longitud final dentro de una caja concreta."),
    Asset("miyota-8215-holder-drawing", "miyota-8215-holder-drawing.webp", "miyota-8215-drawing", 4, "4", "Soporte 500-710 · plano confidencial y provisional", (0.015, 0.0, 0.985, 0.985), "Cuarta página del plano oficial confidencial y provisional MIYOTA 8215 con el soporte plástico 500-710.", "Soporte de encajado 500-710 y sus referencias.", "Lee primero la cabecera de confidencialidad y provisionalidad; después distingue diámetro interior, exterior, altura, orientación y superficies de apoyo.", "El soporte media entre movimiento y caja mediante interfaces radiales y axiales separadas.", "No autoriza redistribución ni demuestra compatibilidad con una caja de proveedor o sus tolerancias."),
    Asset("miyota-8215-specification", "miyota-8215-specification.webp", "miyota-8215-specification", 1, "1", "Especificación oficial", (0.03, 0.04, 0.97, 0.96), "Primera página de la especificación MIYOTA 8215 con dimensiones, frecuencia, rubíes, reserva y márgenes de espacio.", "Datos nominales y límites documentales del MIYOTA 8215.", "Lee cada número con unidad, condición y nota; separa margen sobre agujas y margen bajo movimiento.", "La especificación aporta entradas oficiales para el modelo documental.", "Los márgenes incluyen condiciones sobre vidrio, caja y agujas; no prueban el montaje elegido."),
    Asset("miyota-8215-user-manual", "miyota-8215-user-manual.webp", "miyota-8215-manual", 1, "1", "Manual oficial", (0.03, 0.04, 0.97, 0.96), "Manual oficial MIYOTA 8215 con posiciones de corona, puesta en hora, fecha y advertencia horaria.", "Estados externos de la corona y corrección de fecha.", "Relaciona posición 0, primera y segunda extracción con carga, fecha y hora.", "El manual autoriza el uso externo descrito y advierte sobre la franja de cambio de fecha.", "No muestra la cinemática interna completa ni un procedimiento de servicio."),
    Asset("miyota-8215-parts-list", "miyota-8215-parts-list.webp", "miyota-8215-parts", 1, "1", "Lista oficial vigente", (0.03, 0.04, 0.97, 0.96), "Lista oficial vigente de piezas MIYOTA 8215 con nombres, referencias y cantidades.", "Autoridad de identidad para piezas del MIYOTA 8215.", "Busca nombre vigente, referencia y cantidad; después localiza la pieza en el despiece separado.", "La lista respalda identidad documental de piezas cuando revisión y calibre aplican.", "No muestra ubicación, secuencia, cantidad de lubricante, técnica ni par de apriete."),
    Asset("miyota-2035-parts", "miyota-2035-parts.webp", "miyota-2035-parts", 1, "1", "Lista oficial", (0.03, 0.04, 0.97, 0.96), "Lista oficial MIYOTA 2035 con nombres y referencias de piezas.", "Autoridad de nombres y referencias para el MIYOTA 2035.", "Relaciona batería, circuito, bobina, rotor y tren por nombre y referencia; luego contrástalos con el despiece.", "La lista permite identificar documentalmente una pieza.", "No muestra anatomía, ubicación ni procedimiento de servicio."),
    Asset("miyota-2035-exploded-train", "miyota-2035-exploded-train.webp", "miyota-2035-train", None, None, "Vista oficial", (0.0, 0.0, 1.0, 1.0), "Vista explosionada oficial del MIYOTA 2035 por el lado del tren, con componentes electrónicos y mecánicos.", "Despiece oficial del MIYOTA 2035, lado del tren.", "Localiza batería, circuito, bobina, estator, rotor y ruedas; sigue la conversión de energía hasta las agujas.", "El despiece conecta la cadena funcional de cuarzo con piezas reales documentadas.", "No es una secuencia ejecutable de desmontaje ni autoriza manipular un movimiento energizado."),
]


def _safe_reset_tmp() -> None:
    resolved = TMP_DIR.resolve()
    allowed = (ROOT / "tmp" / "pdfs" / "academy-source-media").resolve()
    if allowed not in resolved.parents:
        raise RuntimeError(f"Ruta temporal fuera del ámbito permitido: {resolved}")
    if TMP_DIR.exists():
        shutil.rmtree(TMP_DIR)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _download(url: str, destination: Path) -> Path:
    request = urllib.request.Request(url, headers={"User-Agent": "RelojesAcademyMedia/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = response.read()
    if len(payload) < 1024:
        raise RuntimeError(f"Descarga inesperadamente pequeña: {url}")
    destination.write_bytes(payload)
    return destination


def _source_file(key: str, cache: dict[str, Path]) -> Path:
    cached = cache.get(key)
    if cached is not None:
        return cached
    source = SOURCES[key]
    extension = ".pdf" if source.kind in {"pdf", "zip-pdf", "remote-pdf"} else ".img"
    destination = TMP_DIR / f"source-{key}{extension}"
    if source.path:
        path = ROOT / source.path
        if not path.is_file():
            raise FileNotFoundError(path)
        resolved = path
    elif source.zip_member:
        if not TOH_ZIP.is_file():
            raise FileNotFoundError(TOH_ZIP)
        with zipfile.ZipFile(TOH_ZIP) as archive:
            destination.write_bytes(archive.read(source.zip_member))
        resolved = destination
    elif source.url:
        resolved = _download(source.url, destination)
    else:
        raise RuntimeError(f"Fuente sin archivo resoluble: {key}")
    cache[key] = resolved
    return resolved


def _pdftoppm() -> Path:
    executable = shutil.which("pdftoppm")
    if executable:
        return Path(executable)
    bundled = Path.home() / ".cache" / "codex-runtimes" / "codex-primary-runtime" / "dependencies" / "native" / "poppler" / "Library" / "bin" / "pdftoppm.exe"
    if bundled.is_file():
        return bundled
    raise FileNotFoundError(
        "No se encontró `pdftoppm`. Instala Poppler y añade su carpeta `bin` al PATH; "
        "Pillow por sí solo no renderiza las páginas PDF."
    )


def _render_pdf_page(pdf: Path, page: int, key: str) -> Image.Image:
    prefix = TMP_DIR / f"render-{key}-{page}"
    subprocess.run(
        [str(_pdftoppm()), "-f", str(page), "-l", str(page), "-r", str(RENDER_DPI), "-png", "-singlefile", str(pdf), str(prefix)],
        check=True,
        capture_output=True,
    )
    png = prefix.with_suffix(".png")
    if not png.is_file():
        raise RuntimeError(f"Poppler no produjo {png}")
    with Image.open(png) as image:
        return image.convert("RGB")


def _load_source_image(
    asset: Asset,
    image_cache: dict[tuple[str, int | None], Image.Image],
    source_file_cache: dict[str, Path],
) -> Image.Image:
    key = (asset.source_key, asset.page)
    cached = image_cache.get(key)
    if cached is not None:
        return cached.copy()
    source = SOURCES[asset.source_key]
    path = _source_file(asset.source_key, source_file_cache)
    if source.kind == "image":
        with Image.open(io.BytesIO(path.read_bytes())) as image:
            loaded = image.convert("RGB")
    else:
        if asset.page is None:
            raise ValueError(f"Falta página PDF para {asset.asset_id}")
        loaded = _render_pdf_page(path, asset.page, asset.source_key)
    image_cache[key] = loaded.copy()
    return loaded


def _crop(image: Image.Image, normalized: tuple[float, float, float, float]) -> Image.Image:
    left, top, right, bottom = normalized
    if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
        raise ValueError(f"Caja de recorte inválida: {normalized}")
    width, height = image.size
    box = (round(left * width), round(top * height), round(right * width), round(bottom * height))
    return image.crop(box)


def _prepare(image: Image.Image, monochrome: bool) -> Image.Image:
    if monochrome:
        image = ImageOps.autocontrast(image.convert("L"), cutoff=0.5).convert("RGB")
    else:
        image = ImageEnhance.Contrast(image.convert("RGB")).enhance(1.035)
    if image.width > MAX_WIDTH:
        height = round(image.height * MAX_WIDTH / image.width)
        image = image.resize((MAX_WIDTH, height), Image.Resampling.LANCZOS)
    return image


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def generate() -> dict[str, object]:
    _safe_reset_tmp()
    image_cache: dict[tuple[str, int | None], Image.Image] = {}
    source_file_cache: dict[str, Path] = {}
    source_hash_cache: dict[str, str] = {}
    records: list[dict[str, object]] = []
    required_source_keys = {asset.source_key for asset in ASSETS}
    baseline_source_keys = set(EXPECTED_SOURCE_SHA256)
    if required_source_keys != baseline_source_keys:
        missing = sorted(required_source_keys - baseline_source_keys)
        obsolete = sorted(baseline_source_keys - required_source_keys)
        raise RuntimeError(
            "El baseline SHA-256 no coincide con las fuentes utilizadas. "
            f"Sin baseline: {missing or 'ninguna'}; obsoletas: {obsolete or 'ninguna'}."
        )
    for source_key in sorted(required_source_keys):
        source_path = _source_file(source_key, source_file_cache)
        observed_hash = _sha256(source_path)
        expected_hash = EXPECTED_SOURCE_SHA256[source_key]
        if observed_hash != expected_hash:
            source = SOURCES[source_key]
            raise RuntimeError(
                f"Drift detectado en la fuente {source_key!r}.\n"
                f"Esperado:  {expected_hash}\n"
                f"Observado: {observed_hash}\n"
                f"Localizador: {source.locator}\n"
                "Revisa el documento, las páginas, los recortes y los derechos; "
                "actualiza EXPECTED_SOURCE_SHA256 solo después de validarlos."
            )
        source_hash_cache[source_key] = observed_hash
    for asset in ASSETS:
        source = SOURCES[asset.source_key]
        original = _load_source_image(asset, image_cache, source_file_cache)
        source_path = _source_file(asset.source_key, source_file_cache)
        source_sha256 = source_hash_cache.get(asset.source_key)
        if source_sha256 is None:
            source_sha256 = _sha256(source_path)
            source_hash_cache[asset.source_key] = source_sha256
        image = _prepare(_crop(original, asset.crop), source.monochrome)
        destination = OUTPUT_DIR / asset.filename
        image.save(destination, "WEBP", quality=90, method=6)
        if destination.stat().st_size < 4096:
            raise RuntimeError(f"Derivado inesperadamente pequeño: {destination}")
        record = {
            "assetId": asset.asset_id,
            "src": f"/learning-media/source-figures/{asset.filename}",
            "width": image.width,
            "height": image.height,
            "mimeType": "image/webp",
            "sha256": _sha256(destination),
            "sourceSha256": source_sha256,
            "sourceId": asset.source_key,
            "sourceTitle": source.title,
            "sourceLocator": source.locator,
            "sourcePage": asset.page,
            "printedPage": asset.printed_page,
            "sourceFigure": asset.figure,
            "crop": list(asset.crop),
            "alt": asset.alt,
            "caption": asset.caption,
            "whatToLookFor": asset.what_to_look_for,
            "evidence": asset.evidence,
            "doesNotShow": asset.does_not_show,
            "authorOrManufacturer": source.author_or_manufacturer,
            "rights": source.rights,
            "privateUse": source.private_use,
            "distributionReviewRequired": True,
        }
        records.append(record)
        print(f"generated {asset.asset_id}: {image.width}×{image.height}")
    expected_files = {asset.filename for asset in ASSETS}
    for stale in OUTPUT_DIR.glob("*.webp"):
        if stale.name not in expected_files:
            stale.unlink()
    manifest = {
        "schemaVersion": "academy-source-figures.v1",
        "generatedAt": "2026-08-18",
        "mode": "personal-local-study",
        "distributionReviewRequired": True,
        "assetCount": len(records),
        "assets": records,
    }
    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    runtime_assets: list[dict[str, object]] = []
    for record in records:
        left, top, right, bottom = record["crop"]
        page_parts = []
        if record["sourcePage"] is not None:
            page_parts.append(f"PDF {record['sourcePage']}")
        if record["printedPage"]:
            page_parts.append(f"impresa {record['printedPage']}")
        source = {
            "sourceId": record["sourceId"],
            "title": record["sourceTitle"],
            "locator": record["sourceLocator"],
        }
        if page_parts:
            source["page"] = " · ".join(page_parts)
        if record["sourceFigure"]:
            source["figure"] = record["sourceFigure"]
        runtime_assets.append({
            "assetId": record["assetId"],
            "src": record["src"],
            "width": record["width"],
            "height": record["height"],
            "alt": record["alt"],
            "caption": record["caption"],
            "source": source,
            "crop": {
                "unit": "normalized",
                "x": left,
                "y": top,
                "width": round(right - left, 6),
                "height": round(bottom - top, 6),
            },
            "contentHash": record["sha256"],
            "sourceSha256": record["sourceSha256"],
            "rights": {
                "status": "personal-study-only",
                "distribution": "restricted",
                "attribution": f"{record['authorOrManufacturer']} · reproducción local para estudio personal.",
                "notes": [record["rights"]],
            },
            "whatToLookFor": record["whatToLookFor"],
            "evidence": record["evidence"],
            "limitation": record["doesNotShow"],
        })
    registry_json = json.dumps(runtime_assets, ensure_ascii=False, indent=2)
    RUNTIME_REGISTRY.write_text(
        "// Generado por scripts/generate-academy-source-media.py. No editar a mano.\n"
        "import type { AcademySourceFigureAsset } from '../academyReaderModel'\n\n"
        f"export const ACADEMY_SOURCE_FIGURES = {registry_json} as const satisfies readonly AcademySourceFigureAsset[]\n\n"
        "export const ACADEMY_SOURCE_FIGURE_BY_ID: ReadonlyMap<string, AcademySourceFigureAsset> = new Map(ACADEMY_SOURCE_FIGURES.map((asset) => [asset.assetId, asset]))\n",
        encoding="utf-8",
    )
    shutil.rmtree(TMP_DIR)
    return manifest


if __name__ == "__main__":
    result = generate()
    print(f"manifest: {OUTPUT_DIR / 'manifest.json'} ({result['assetCount']} assets)")

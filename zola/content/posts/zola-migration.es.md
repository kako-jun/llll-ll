+++
title = "Migrar llll-ll de Next.js a Zola"
date = 2026-06-09

[extra]
tags = ["zola", "btop", "meta"]
+++

Durante mucho tiempo este portafolio funcionó con Next.js. Funcionaba, pero cada visita enviaba un runtime de React para renderizar una página que casi nunca cambia. Para un portafolio —una lista de cosas que hice— eso se sentía más pesado de lo necesario.

Así que lo migré a **Zola**, un generador de sitios estáticos escrito en Rust. Un solo binario, sin `node_modules`, una compilación completa en bastante menos de un segundo. Lo que produce es HTML y CSS planos; el JavaScript solo aparece donde se gana su lugar: el filtro de apps, el contador de visitas, la imagen del día.

### Probar mi propio tema

La paleta base viene de **avel**, el tema de Zola que escribí. llll-ll no hereda las plantillas de avel directamente —el portal es un diseño btop a medida— pero la estética en negro y verde y el pipeline de compilación son compartidos. Construir mi propio sitio sobre mi propio tema es la forma más rápida de encontrar las asperezas de avel.

### Lo que se mantuvo

- Una sola página. Sin cambios de ruta para ver las apps.
- Mobile first, centrado en escritorio.
- Cuatro idiomas (en / ja / zh / es), cada uno como una URL de primera clase.

La migración ocurrió por fases: andamiaje, i18n, los paneles interactivos y luego esto: el blog. Entradas como esta son la última pieza: un lugar donde anotar lo que construyo mientras lo construyo.

> Si un binario estático puede hacer el trabajo, prefiero enviar el binario estático.

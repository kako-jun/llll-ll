+++
title = "Construir un portafolio con la estética de btop"
date = 2026-06-10

[extra]
tags = ["btop", "design", "css"]
+++

Si alguna vez ejecutaste **btop**, el monitor de sistema, conoces el aspecto: paneles dibujados con caracteres de líneas, un borde verde, una etiqueta encajada en la esquina superior izquierda, todo monoespaciado sobre un fondo casi negro. Me parece genuinamente hermoso, y resulta ser un marco estupendo para un portafolio.

### Por qué encaja

Un portafolio es un tablero. Muestra estado: lo que hice, cuánta gente visitó, el dibujo de hoy. btop es _la_ estética de tablero: densa pero legible, técnica pero cálida. Tomar prestada su gramática significó que no tuve que inventar un lenguaje visual; solo tuve que ser disciplinado con él.

Las reglas que mantuve:

1. **Una sola paleta.** Fondo `#121212`, paneles `#1e1e1e`, el verde de acento `#34d058` para cada borde y etiqueta.
2. **Etiquetas encajadas.** Cada panel tiene una pequeña etiqueta —`apps`, `visits`, `mypace`, `blog`— posada en su borde superior, igual que las ventanas de btop.
3. **Monoespaciado en todas partes**, con respaldos por idioma para que el CJK se renderice limpio.

> La restricción es una característica. Con la paleta y el panel fijos, cada sección nueva ya sabe cómo se ve.

### Famicom más cyberpunk

El encargo que me puse fue "nostalgia de Famicom con cyberpunk". Oscuro, un poco juguetón, un poco retro: un slime que salta, Tetris apilándose en la cabecera, un dibujo de píxeles diario. Nada llamativo. Apenas el movimiento justo para sentirse vivo, nunca tanto como para estorbar.

El marco de btop lo mantiene todo unido. Incluso esta entrada del blog vive dentro del mismo panel de borde verde que todo lo demás.

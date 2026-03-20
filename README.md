# 🌙 SOMNIUM — El Ultimo Soñador

> *"El sueño es el último refugio. Las pesadillas han llegado a reclamarlo."*

Un juego de acción y supervivencia por oleadas ambientado en un **mundo onírico surrealista**, desarrollado completamente en HTML5 Canvas, CSS3 y JavaScript vanilla. Sin frameworks, sin dependencias externas.

---

## 🎮 ¿De qué trata?

Eres el **Guardián de los Sueños**, el último soñador consciente en un universo mental que se desmorona. Oleada tras oleada, distintas **Pesadillas** emergen desde los bordes de tu mente para consumirte.

Tu objetivo: sobrevivir las 30 oleadas, destruir a las Pesadillas, acumular **Fragmentos Oníricos** y hacerte más poderoso antes de que te derroten.

---

## 🕹️ Controles

| Acción | Tecla / Input |
|---|---|
| Mover al personaje | `W A S D` o flechas del teclado |
| Disparar | `Clic izquierdo` o `Barra espaciadora` |
| Apuntar | El cursor del ratón |

---

## ⚔️ Mecánicas de juego

### Sistema de oleadas
El juego se divide en **30 oleadas** de dificultad progresiva. Cada oleada spawna un número creciente de enemigos desde los bordes del mapa. Al eliminar a todos los enemigos, la oleada termina y aparece el menú de descanso.

En las **oleadas 10, 20 y 30** aparece un **Jefe** (Pesadilla Mayor): un enemigo enorme con cientos de puntos de vida que dispara proyectiles en abanico.

### Tipos de enemigos

| Enemigo | Descripción | Peculiaridad |
|---|---|---|
| **Pesadilla Normal** ✕ | Enemigo base, persigue al jugador | Aparece desde la oleada 1 |
| **Pesadilla Rápida** ⚡ | Pequeña y ágil, poco HP | Aumenta en frecuencia con las oleadas |
| **Pesadilla Tanque** ⬡ | Lenta pero muy resistente, alto daño | Aparece a partir de oleada 5 |
| **Pesadilla Mayor** ☠ | Jefe enorme, dispara 5 proyectiles | Oleadas 10, 20 y 30 |

Todos los enemigos escalan en **vida, velocidad y daño** con cada oleada, de forma progresivamente más agresiva.

### Sistema de combate
- El jugador dispara **proyectiles** en la dirección del cursor
- Los enemigos hacen daño por **contacto directo** y los jefes también disparan
- Hay un breve período de **invencibilidad** tras recibir daño
- Los enemigos eliminados sueltan **Fragmentos Oníricos** (moneda del juego)

---

## 🏪 La Encrucijada Onírica (Tienda)

Al terminar cada oleada puedes visitar la tienda para gastar tus Fragmentos en mejoras permanentes:

| Mejora | Efecto | Niveles máx. |
|---|---|---|
| 💨 Pasos del Éter | +10% velocidad de movimiento | 10 |
| ⚡ Ritmo del Sueño | +15% velocidad de ataque | 10 |
| ⚔ Furia Onírica | +8 daño por proyectil | 10 |
| 💠 Esencia Vital | +25 HP máximo y cura 25 | 10 |
| ✦ Eco Astral | Dispara proyectiles adicionales | 3 |
| 🌙 Rocío Lunar | Cura 5 HP cada pocos segundos | 5 |
| 🔮 Campo Mental | +15% radio y daño de proyectil | 5 |
| ↩ Mente Elástica | Los proyectiles rebotan una vez más | 3 |

El precio de cada mejora **aumenta con el nivel**, por lo que hay que decidir bien en qué invertir.

---

## 🎱 Cristal del Destino (Sistema Gacha)

El sistema gacha ofrece recompensas aleatorias en forma de **habilidades especiales** e ítems únicos. Al invocar, se activa una **animación de ruleta** que va pasando por los posibles premios y frena suavemente en el resultado.

### Tipos de invocación

| Invocación | Coste | Rareza posible |
|---|---|---|
| Simple | ◈ 30 Fragmentos | Común ~ Poco Común |
| Profunda | ◈ 80 Fragmentos | Poco Común ~ Épico |
| Gran Invocación | ◈ 200 Fragmentos | Épico ~ Legendario |

### Rarezas y ejemplos de recompensas

**Común** — Pequeñas mejoras pasivas de stats (HP, velocidad, daño)

**Poco Común** — Habilidades especiales activas:
- 🪶 **VIENTO** — +30% velocidad de movimiento permanente
- ❄ **HIELO** — Los proyectiles ralentizan a los enemigos
- 🔥 **FUEGO** — Proyectiles de fuego con mayor daño
- 🛡 **ESCUDO** — Reduce el daño recibido a la mitad

**Épico** — Habilidades de alto impacto:
- ⚡ **RAYO** — Proyectiles de rayo + velocidad de ataque x2
- 🌑 **DRENAJE** — Roba 5 HP por cada enemigo eliminado
- 🌐 **LENTITUD** — Todos los enemigos se mueven al 60%

**Legendario** — Poderes que cambian el juego:
- 👁 **EL OJO QUE TODO LO VE** — Triplica el daño permanentemente
- 🌊 **FORMA EFÍMERA** — Máxima velocidad y cadencia para siempre
- 💠 **CORAZÓN DEL COSMOS** — +200 HP y cura total instantánea
- ∞ **SUEÑO ETERNO** — Activa todas las habilidades especiales a la vez

---

## 📊 Progresión y dificultad

El juego está diseñado para que la curva de dificultad sea equilibrada con las mejoras del jugador:

- La **vida** de los enemigos sube un 18% por oleada, con bonus extra cada 5 oleadas
- La **velocidad** de los enemigos crece gradualmente hasta un máximo por tipo
- El **daño** enemigo sube un 10% por oleada
- La **proporción** de enemigos rápidos y tanques aumenta con las oleadas
- Los **Fragmentos** que sueltan los enemigos también escalan, dando más capacidad de mejora

---

## 🗂️ Estructura del proyecto

```
somnium/
├── index.html      # Estructura HTML: landing, canvas, overlays UI
├── estilo.css      # Todos los estilos: landing, HUD, tienda, gacha, animaciones
└── juego.js        # Motor completo: clases, lógica, combat, oleadas, tienda, gacha
```

No hay dependencias externas ni librerías. Solo HTML5, CSS3 y JavaScript ES6+ vanilla.

---

## 🚀 Cómo ejecutar

1. Clona o descarga el repositorio
2. Abre `index.html` en cualquier navegador moderno (Chrome, Firefox, Edge, Safari)
3. No requiere servidor local ni instalación

```bash
git clone https://github.com/tu-usuario/somnium.git
cd somnium
# Abre index.html en tu navegador
```

---

## 🛠️ Tecnologías usadas

- **HTML5 Canvas** — renderizado del juego (jugador, enemigos, proyectiles, efectos)
- **CSS3** — animaciones, overlays, HUD, efectos de partículas en la landing
- **JavaScript ES6+** — lógica de juego, clases, sistema de oleadas, IA enemiga, tienda, gacha
- **Google Fonts** — tipografías *Cinzel Decorative* y *Raleway*

---

## ✨ Características destacadas

- 🎨 Temática 100% original: mundo onírico surrealista, sin temáticas genéricas
- 🌊 Trail de movimiento y partículas en el jugador
- 💥 Números de daño flotantes y flash de impacto en enemigos
- 🎰 Animación de ruleta real en el gacha (easing suavizado, no instantáneo)
- 📈 Escalado progresivo de dificultad con curva no lineal
- 🔮 Sistema de habilidades especiales que cambian visualmente los proyectiles
- 📱 Diseño responsive que se adapta al tamaño de pantalla

---

*Hecho con JavaScript vanilla y demasiadas horas de sueño perdidas.*

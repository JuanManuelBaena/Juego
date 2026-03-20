/* ═══════════════════════════════════════════════════════
   SOMNIUM — El Último Soñador
   Motor de juego completo: combate, oleadas, tienda, gacha
   ═══════════════════════════════════════════════════════ */

"use strict";

// ═══════════════════════════════════════════
// LANDING: partículas decorativas
// ═══════════════════════════════════════════
(function crearParticulas() {
    const cont = document.getElementById("particles");
    for (let i = 0; i < 60; i++) {
        const p = document.createElement("div");
        p.classList.add("particle");
        const dur  = 6 + Math.random() * 12;
        const delay = Math.random() * 10;
        const left  = Math.random() * 100;
        const drift = (Math.random() - 0.5) * 200;
        p.style.cssText = `
            left: ${left}%;
            bottom: 0;
            animation-duration: ${dur}s;
            animation-delay: ${-delay}s;
            --drift: ${drift}px;
            width: ${1 + Math.random() * 2}px;
            height: ${1 + Math.random() * 2}px;
            opacity: ${0.3 + Math.random() * 0.7};
        `;
        cont.appendChild(p);
    }
})();

// ═══════════════════════════════════════════
// BOTÓN JUGAR
// ═══════════════════════════════════════════
document.getElementById("btnJugar").addEventListener("click", () => {
    document.getElementById("landing").classList.add("oculto");
    document.getElementById("juego").classList.remove("oculto");
    juego.iniciar();
});

// ═══════════════════════════════════════════
// CONSTANTES Y CONFIGURACIÓN
// ═══════════════════════════════════════════
const CONFIG = {
    TILE: 32,                  // Tamaño de celda en píxeles
    FILAS: 20,
    COLS: 32,
    FPS_OBJETIVO: 60,
    OLEADAS_TOTALES: 30,
    OLEADAS_JEFE: [10, 20, 30],// Oleadas con jefe final
};

// Paleta de colores del canvas
const COLOR = {
    FONDO: "#03050f",
    CELDA: "#060a1c",
    CELDA_CLARA: "#080d24",
    OBSTACULO: "#1a1f45",
    OBSTACULO_BORDE: "#2d3566",
    JUGADOR: "#00e5ff",
    JUGADOR_NUCLEO: "#ffffff",
    ENEMIGO: "#ff1744",
    ENEMIGO_BORDE: "#ff6b6b",
    JEFE: "#ff6d00",
    JEFE_BORDE: "#ffd54f",
    PROYECTIL_J: "#00e5ff",
    PROYECTIL_E: "#ff1744",
    MONEDA: "#ffd54f",
    OBSTACULO_GLOW: "rgba(45,53,102,0.4)",
};

// ═══════════════════════════════════════════
// CLASE: Jugador
// ═══════════════════════════════════════════
class Jugador {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radio = 10;
        this.velocidad = 2.5;
        this.vidaMax = 100;
        this.vida = 100;
        this.ataque = 20;
        this.velAtaque = 1;       // ataques/seg multiplicador
        this.cooldownAtaque = 0;
        this.cooldownMax = 45;
        this.invencible = 0;      // frames de invencibilidad tras daño
        this.particulas = [];
        this.nivel = 1;
        this.xp = 0;
        this.xpSiguiente = 100;

        // Habilidades gacha activas
        this.habilidades = new Set();

        // Visual
        this.anguloBrazo = 0;
        this.pulso = 0;
        this.trailPos = [];
    }

    actualizar(teclas, cursor, obstaculos, lienzoCols, lienzoFilas, tileSize) {
        // Movimiento
        let dx = 0, dy = 0;
        if (teclas["ArrowLeft"]  || teclas["a"] || teclas["A"]) dx -= 1;
        if (teclas["ArrowRight"] || teclas["d"] || teclas["D"]) dx += 1;
        if (teclas["ArrowUp"]    || teclas["w"] || teclas["W"]) dy -= 1;
        if (teclas["ArrowDown"]  || teclas["s"] || teclas["S"]) dy += 1;

        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

        const vel = this.velocidad * (this.habilidades.has("VIENTO") ? 1.3 : 1);
        const nx = this.x + dx * vel;
        const ny = this.y + dy * vel;

        // Colisión con bordes
        const minX = this.radio, maxX = lienzoCols * tileSize - this.radio;
        const minY = this.radio + 60, maxY = lienzoFilas * tileSize - this.radio + 60;

        if (!this._colisionaConObstaculo(nx, this.y, obstaculos, tileSize))
            this.x = Math.max(minX, Math.min(maxX, nx));
        if (!this._colisionaConObstaculo(this.x, ny, obstaculos, tileSize))
            this.y = Math.max(minY, Math.min(maxY, ny));

        // Trail
        this.trailPos.unshift({ x: this.x, y: this.y });
        if (this.trailPos.length > 8) this.trailPos.pop();

        // Cooldown ataque
        if (this.cooldownAtaque > 0) this.cooldownAtaque--;

        // Invencibilidad
        if (this.invencible > 0) this.invencible--;

        // Pulso visual
        this.pulso = (this.pulso + 0.08) % (Math.PI * 2);

        // Ángulo hacia cursor
        this.anguloBrazo = Math.atan2(cursor.y - this.y, cursor.x - this.x);

        // Partículas del jugador
        this._actualizarParticulas();
    }

    _colisionaConObstaculo(px, py, obstaculos, ts) {
        for (const obs of obstaculos) {
            const ox = obs.col * ts, oy = obs.fila * ts + 60;
            if (px + this.radio > ox + 2 && px - this.radio < ox + ts - 2 &&
                py + this.radio > oy + 2 && py - this.radio < oy + ts - 2) return true;
        }
        return false;
    }

    _actualizarParticulas() {
        // Añadir partícula aleatoria
        if (Math.random() < 0.3) {
            const ang = Math.random() * Math.PI * 2;
            this.particulas.push({
                x: this.x + Math.cos(ang) * this.radio,
                y: this.y + Math.sin(ang) * this.radio,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                vida: 25,
                vidaMax: 25,
            });
        }
        this.particulas = this.particulas.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vida--;
            return p.vida > 0;
        });
    }

    puedeAtacar() {
        return this.cooldownAtaque <= 0;
    }

    atacar() {
        this.cooldownMax = Math.max(8, Math.floor(45 / this.velAtaque));
        this.cooldownAtaque = this.cooldownMax;
    }

    recibirDaño(cantidad) {
        if (this.invencible > 0) return false;
        const escudo = this.habilidades.has("ESCUDO");
        const daño = escudo ? Math.floor(cantidad * 0.5) : cantidad;
        this.vida = Math.max(0, this.vida - daño);
        this.invencible = 45;
        return true;
    }

    curar(cantidad) {
        this.vida = Math.min(this.vidaMax, this.vida + cantidad);
    }

    dibujar(ctx) {
        // Trail
        for (let i = 0; i < this.trailPos.length; i++) {
            const tp = this.trailPos[i];
            const alfa = (1 - i / this.trailPos.length) * 0.18;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, this.radio * (1 - i * 0.08), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,229,255,${alfa})`;
            ctx.fill();
        }

        // Partículas orbitales
        for (const p of this.particulas) {
            const alfa = p.vida / p.vidaMax;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,229,255,${alfa * 0.6})`;
            ctx.fill();
        }

        // Aura pulsante
        const pulsoR = this.radio + 4 + Math.sin(this.pulso) * 2;
        const gradAura = ctx.createRadialGradient(this.x, this.y, this.radio, this.x, this.y, pulsoR + 10);
        const invAlfa = this.invencible > 0 ? 0.2 : 0.15;
        gradAura.addColorStop(0, `rgba(0,229,255,${invAlfa})`);
        gradAura.addColorStop(1, "rgba(0,229,255,0)");
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulsoR + 10, 0, Math.PI * 2);
        ctx.fillStyle = gradAura;
        ctx.fill();

        // Cuerpo principal
        const invParpadeo = this.invencible > 0 && Math.floor(this.invencible / 5) % 2 === 0;
        if (!invParpadeo) {
            const grad = ctx.createRadialGradient(this.x - 3, this.y - 3, 2, this.x, this.y, this.radio);
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.4, COLOR.JUGADOR);
            grad.addColorStop(1, "#0088aa");
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Anillo exterior
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0,229,255,0.8)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Indicador de dirección (arma/brazo)
            const bx = this.x + Math.cos(this.anguloBrazo) * (this.radio + 8);
            const by = this.y + Math.sin(this.anguloBrazo) * (this.radio + 8);
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(this.anguloBrazo) * this.radio,
                       this.y + Math.sin(this.anguloBrazo) * this.radio);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.stroke();

            // Punta del arma
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
        }

        // Halo especial si tiene habilidades
        if (this.habilidades.has("FUEGO")) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radio + 6 + Math.sin(this.pulso * 2) * 3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,140,0,${0.3 + Math.sin(this.pulso) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        if (this.habilidades.has("HIELO")) {
            for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI * 2 + this.pulso * 0.5;
                const rx = this.x + Math.cos(ang) * (this.radio + 10);
                const ry = this.y + Math.sin(ang) * (this.radio + 10);
                ctx.beginPath();
                ctx.arc(rx, ry, 2, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(100,220,255,0.6)";
                ctx.fill();
            }
        }
    }
}

// ═══════════════════════════════════════════
// CLASE: Enemigo (Pesadilla)
// ═══════════════════════════════════════════
class Enemigo {
    constructor(x, y, tipo = "normal") {
        this.x = x;
        this.y = y;
        this.tipo = tipo;

        // Estadísticas según tipo
        if (tipo === "jefe") {
            this.radio = 22;
            this.velocidad = 1.0;
            this.vidaMax = 500;
            this.ataque = 35;
            this.monedas = 80;
            this.xp = 200;
        } else if (tipo === "rapido") {
            this.radio = 8;
            this.velocidad = 3.2;
            this.vidaMax = 40;
            this.ataque = 10;
            this.monedas = 8;
            this.xp = 15;
        } else if (tipo === "tanque") {
            this.radio = 16;
            this.velocidad = 1.2;
            this.vidaMax = 200;
            this.ataque = 30;
            this.monedas = 25;
            this.xp = 50;
        } else { // normal
            this.radio = 11;
            this.velocidad = 1.6;
            this.vidaMax = 80;
            this.ataque = 20;
            this.monedas = 10;
            this.xp = 20;
        }

        this.vida = this.vidaMax;
        this.cooldownAtaque = 0;
        this.cooldownMax = 90;
        this.pulso = Math.random() * Math.PI * 2;
        this.angulo = Math.random() * Math.PI * 2;
        this.particulas = [];
        this.dañoVisual = 0; // flash de daño

        // Proyectiles del jefe
        this.timerProyectil = 0;
    }

    actualizar(jugador, obstaculos, tileSize) {
        this.pulso = (this.pulso + 0.06) % (Math.PI * 2);
        this.angulo += 0.02;

        // IA: perseguir al jugador
        const dx = jugador.x - this.x;
        const dy = jugador.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.radio + jugador.radio + 2) {
            const speed = this.velocidad * (jugador.habilidades.has("LENTITUD") ? 0.6 : 1);
            const ndx = (dx / dist) * speed;
            const ndy = (dy / dist) * speed;

            // Movimiento con separación entre enemigos (simplificado)
            if (!this._colisionaConObstaculo(this.x + ndx, this.y, obstaculos, tileSize))
                this.x += ndx;
            if (!this._colisionaConObstaculo(this.x, this.y + ndy, obstaculos, tileSize))
                this.y += ndy;
        }

        // Cooldown ataque
        if (this.cooldownAtaque > 0) this.cooldownAtaque--;
        if (this.dañoVisual > 0) this.dañoVisual--;

        // Partículas de la pesadilla
        if (Math.random() < 0.2) {
            const ang = Math.random() * Math.PI * 2;
            this.particulas.push({
                x: this.x + Math.cos(ang) * this.radio,
                y: this.y + Math.sin(ang) * this.radio,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                vida: 20,
                vidaMax: 20,
            });
        }
        this.particulas = this.particulas.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vida--;
            return p.vida > 0;
        });

        // Timer proyectil jefe
        if (this.tipo === "jefe") this.timerProyectil++;
    }

    _colisionaConObstaculo(px, py, obstaculos, ts) {
        for (const obs of obstaculos) {
            const ox = obs.col * ts, oy = obs.fila * ts + 60;
            if (px + this.radio > ox + 4 && px - this.radio < ox + ts - 4 &&
                py + this.radio > oy + 4 && py - this.radio < oy + ts - 4) return true;
        }
        return false;
    }

    puedeAtacar(jugador) {
        const dx = jugador.x - this.x, dy = jugador.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radio + jugador.radio + 5 && this.cooldownAtaque <= 0;
    }

    recibirDaño(cantidad) {
        this.vida -= cantidad;
        this.dañoVisual = 8;
        return this.vida <= 0;
    }

    dibujar(ctx) {
        // Partículas de niebla
        for (const p of this.particulas) {
            const alfa = p.vida / p.vidaMax;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            const col = this.tipo === "jefe" ? "255,109,0" : "255,23,68";
            ctx.fillStyle = `rgba(${col},${alfa * 0.5})`;
            ctx.fill();
        }

        const col = this.tipo === "jefe" ? "255,109,0" :
                    this.tipo === "rapido" ? "224,0,255" :
                    this.tipo === "tanque" ? "255,60,0" : "255,23,68";

        // Aura
        const auraR = this.radio + 6 + Math.sin(this.pulso) * 3;
        const gradAura = ctx.createRadialGradient(this.x, this.y, this.radio, this.x, this.y, auraR + 8);
        gradAura.addColorStop(0, `rgba(${col},0.2)`);
        gradAura.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, auraR + 8, 0, Math.PI * 2);
        ctx.fillStyle = gradAura;
        ctx.fill();

        // Flash de daño
        const daño = this.dañoVisual > 0;

        // Cuerpo
        const grad = ctx.createRadialGradient(this.x - 3, this.y - 3, 2, this.x, this.y, this.radio);
        if (daño) {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(1, `rgb(${col})`);
        } else {
            grad.addColorStop(0, `rgba(${col},0.9)`);
            grad.addColorStop(0.6, `rgba(${col},0.7)`);
            grad.addColorStop(1, `rgba(${col},0.3)`);
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Anillo con efecto
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${col},${0.6 + Math.sin(this.pulso) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Símbolos del tipo
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = `bold ${Math.floor(this.radio * 0.9)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const simbolo = this.tipo === "jefe"    ? "☠" :
                        this.tipo === "rapido"  ? "⚡" :
                        this.tipo === "tanque"  ? "⬡" : "✕";
        ctx.fillText(simbolo, this.x, this.y);

        // Barra de vida sobre enemigo
        this._dibujarVida(ctx);
    }

    _dibujarVida(ctx) {
        const bw = this.radio * 2 + 8;
        const bh = 4;
        const bx = this.x - bw / 2;
        const by = this.y - this.radio - 12;
        const porcentaje = this.vida / this.vidaMax;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(bx, by, bw, bh);

        const colorVida = porcentaje > 0.6 ? "#69f0ae" :
                          porcentaje > 0.3 ? "#ffd54f" : "#ff1744";
        ctx.fillStyle = colorVida;
        ctx.fillRect(bx, by, bw * porcentaje, bh);

        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, bw, bh);
    }
}

// ═══════════════════════════════════════════
// CLASE: Proyectil
// ═══════════════════════════════════════════
class Proyectil {
    constructor(x, y, angulo, velocidad, daño, esJugador, especial = null) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angulo) * velocidad;
        this.vy = Math.sin(angulo) * velocidad;
        this.daño = daño;
        this.esJugador = esJugador;
        this.vida = 80;
        this.radio = esJugador ? 5 : 6;
        this.especial = especial; // "fuego", "hielo", "rayo"
        this.trail = [];
    }

    actualizar() {
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.pop();
        this.x += this.vx;
        this.y += this.vy;
        this.vida--;
        return this.vida > 0;
    }

    dibujar(ctx) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alfa = (1 - i / this.trail.length) * 0.5;
            const r = this.radio * (1 - i * 0.12);
            ctx.beginPath();
            ctx.arc(t.x, t.y, Math.max(1, r), 0, Math.PI * 2);

            let color;
            if (!this.esJugador) color = `rgba(255,23,68,${alfa})`;
            else if (this.especial === "fuego") color = `rgba(255,140,0,${alfa})`;
            else if (this.especial === "hielo") color = `rgba(100,220,255,${alfa})`;
            else if (this.especial === "rayo")  color = `rgba(255,255,0,${alfa})`;
            else color = `rgba(0,229,255,${alfa})`;

            ctx.fillStyle = color;
            ctx.fill();
        }

        // Proyectil principal
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radio);
        if (!this.esJugador) {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.4, "#ff1744");
            grad.addColorStop(1, "rgba(255,23,68,0)");
        } else if (this.especial === "fuego") {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.4, "#ff8c00");
            grad.addColorStop(1, "rgba(255,140,0,0)");
        } else if (this.especial === "hielo") {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.4, "#64dcff");
            grad.addColorStop(1, "rgba(100,220,255,0)");
        } else if (this.especial === "rayo") {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.4, "#ffff00");
            grad.addColorStop(1, "rgba(255,255,0,0)");
        } else {
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.4, COLOR.PROYECTIL_J);
            grad.addColorStop(1, "rgba(0,229,255,0)");
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
}

// ═══════════════════════════════════════════
// CLASE: Moneda (Fragmento Onírico)
// ═══════════════════════════════════════════
class Moneda {
    constructor(x, y, valor = 10) {
        this.x = x;
        this.y = y;
        this.valor = valor;
        this.radio = 6;
        this.vida = 300;
        this.pulso = Math.random() * Math.PI * 2;
        this.vy = -1;
        this.aterrizando = 8;
    }

    actualizar() {
        this.pulso = (this.pulso + 0.07) % (Math.PI * 2);
        if (this.aterrizando > 0) {
            this.y += this.vy;
            this.vy += 0.2;
            if (this.vy >= 0) this.aterrizando = 0;
        }
        this.vida--;
        return this.vida > 0;
    }

    dibujar(ctx) {
        const r = this.radio + Math.sin(this.pulso) * 1.5;
        const grad = ctx.createRadialGradient(this.x - 1, this.y - 1, 1, this.x, this.y, r);
        grad.addColorStop(0, "#fff9c4");
        grad.addColorStop(0.5, COLOR.MONEDA);
        grad.addColorStop(1, "#f57f17");
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = "rgba(255,245,157,0.8)";
        ctx.font = `bold ${Math.floor(r)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("◈", this.x, this.y);
    }
}

// ═══════════════════════════════════════════
// CLASE: Número de daño flotante
// ═══════════════════════════════════════════
class TextoFlotante {
    constructor(x, y, texto, color = "#ffffff") {
        this.x = x;
        this.y = y;
        this.texto = texto;
        this.color = color;
        this.vida = 50;
        this.vidaMax = 50;
        this.vy = -1.2;
        this.escala = 1;
    }

    actualizar() {
        this.y += this.vy;
        this.vy *= 0.96;
        this.vida--;
        return this.vida > 0;
    }

    dibujar(ctx) {
        const alfa = this.vida / this.vidaMax;
        ctx.globalAlpha = alfa;
        ctx.font = `bold 14px 'Raleway', sans-serif`;
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.lineWidth = 3;
        ctx.strokeText(this.texto, this.x, this.y);
        ctx.fillText(this.texto, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

// ═══════════════════════════════════════════
// SISTEMA DE TIENDA
// ═══════════════════════════════════════════
const MEJORAS_TIENDA = [
    {
        id: "velocidad",
        nombre: "Pasos del Éter",
        icono: "💨",
        desc: "+10% velocidad de movimiento",
        precioBase: 30,
        nivMax: 10,
        nivel: 0,
        efecto: (j) => { j.velocidad += 0.25; }
    },
    {
        id: "cadencia",
        nombre: "Ritmo del Sueño",
        icono: "⚡",
        desc: "+15% velocidad de ataque",
        precioBase: 35,
        nivMax: 10,
        nivel: 0,
        efecto: (j) => { j.velAtaque += 0.15; }
    },
    {
        id: "daño",
        nombre: "Furia Onírica",
        icono: "⚔",
        desc: "+8 daño por proyectil",
        precioBase: 40,
        nivMax: 10,
        nivel: 0,
        efecto: (j) => { j.ataque += 8; }
    },
    {
        id: "vida",
        nombre: "Esencia Vital",
        icono: "💠",
        desc: "+25 HP máximo y cura 25",
        precioBase: 45,
        nivMax: 10,
        nivel: 0,
        efecto: (j) => { j.vidaMax += 25; j.vida = Math.min(j.vida + 25, j.vidaMax); }
    },
    {
        id: "multiproyectil",
        nombre: "Eco Astral",
        icono: "✦",
        desc: "Dispara 2 proyectiles extra",
        precioBase: 80,
        nivMax: 3,
        nivel: 0,
        efecto: () => {}  // manejado en lógica de disparo
    },
    {
        id: "curacion",
        nombre: "Rocío Lunar",
        icono: "🌙",
        desc: "Cura 5 HP cada 5 segundos",
        precioBase: 60,
        nivMax: 5,
        nivel: 0,
        efecto: () => {}  // pasiva aplicada en bucle
    },
    {
        id: "radio",
        nombre: "Campo Mental",
        icono: "🔮",
        desc: "+15% radio de proyectil y daño de área",
        precioBase: 55,
        nivMax: 5,
        nivel: 0,
        efecto: () => {}
    },
    {
        id: "rebote",
        nombre: "Mente Elástica",
        icono: "↩",
        desc: "Proyectiles que rebotan 1 vez más",
        precioBase: 70,
        nivMax: 3,
        nivel: 0,
        efecto: () => {}
    },
];

function precioMejora(mejora) {
    return Math.floor(mejora.precioBase * (1 + mejora.nivel * 0.8));
}

// ═══════════════════════════════════════════
// SISTEMA GACHA
// ═══════════════════════════════════════════
const TABLA_GACHA = {
    comun: [
        { nombre: "Ceniza de Sueño",   icono: "🌫", desc: "+10 HP permanente",           rareza: "comun",     efecto: (j) => { j.vidaMax += 10; j.vida += 10; } },
        { nombre: "Eco de Pasos",      icono: "👣", desc: "+0.1 velocidad permanente",   rareza: "comun",     efecto: (j) => { j.velocidad += 0.1; } },
        { nombre: "Astilla Onírica",   icono: "💫", desc: "+5 daño permanente",          rareza: "comun",     efecto: (j) => { j.ataque += 5; } },
        { nombre: "Velo Tenue",        icono: "🌀", desc: "+5 frames invencibilidad",    rareza: "comun",     efecto: (j) => { /* aumenta base de iframes */ } },
    ],
    pocoComan: [
        { nombre: "Pluma del Viento",  icono: "🪶", desc: "Habilidad VIENTO: +30% velocidad", rareza: "poco-comun", efecto: (j) => { j.habilidades.add("VIENTO"); } },
        { nombre: "Núcleo Helado",     icono: "❄",  desc: "Habilidad HIELO: ralentiza enemigos", rareza: "poco-comun", efecto: (j) => { j.habilidades.add("HIELO"); } },
        { nombre: "Llama Latente",     icono: "🔥", desc: "Habilidad FUEGO: proyectiles de fuego", rareza: "poco-comun", efecto: (j) => { j.habilidades.add("FUEGO"); } },
        { nombre: "Escudo Onírico",    icono: "🛡", desc: "Habilidad ESCUDO: -50% daño recibido", rareza: "poco-comun", efecto: (j) => { j.habilidades.add("ESCUDO"); } },
    ],
    epico: [
        { nombre: "Relámpago Interior", icono: "⚡", desc: "Proyectiles de rayo + velocidad ataque x2", rareza: "epico", efecto: (j) => { j.habilidades.add("RAYO"); j.velAtaque *= 2; } },
        { nombre: "Aura Drenante",     icono: "🌑", desc: "Habilidad DRENAJE: roba 5HP por muerte", rareza: "epico",  efecto: (j) => { j.habilidades.add("DRENAJE"); } },
        { nombre: "Lentitud Cósmica",  icono: "🌐", desc: "Habilidad LENTITUD: enemigos al 60%", rareza: "epico",   efecto: (j) => { j.habilidades.add("LENTITUD"); } },
        { nombre: "Proyección Doble",  icono: "✦✦", desc: "+2 proyectiles adicionales por disparo", rareza: "epico", efecto: (j, mejoras) => {
            const m = mejoras.find(x => x.id === "multiproyectil");
            if (m) m.nivel = Math.min(m.nivel + 2, m.nivMax);
        }},
    ],
    legendario: [
        { nombre: "EL OJO QUE TODO LO VE", icono: "👁", desc: "Triplica el daño permanentemente", rareza: "legendario", efecto: (j) => { j.ataque = Math.floor(j.ataque * 3); } },
        { nombre: "FORMA EFÍMERA",         icono: "🌊", desc: "Máxima velocidad y cadencia por siempre", rareza: "legendario", efecto: (j) => { j.velocidad += 1.5; j.velAtaque += 1.0; } },
        { nombre: "CORAZÓN DEL COSMOS",    icono: "💠", desc: "+200 HP permanentes y cura total", rareza: "legendario", efecto: (j) => { j.vidaMax += 200; j.vida = j.vidaMax; } },
        { nombre: "SUEÑO ETERNO",          icono: "∞",  desc: "Todas las habilidades especiales activadas", rareza: "legendario", efecto: (j) => {
            ["VIENTO","HIELO","FUEGO","ESCUDO","RAYO","DRENAJE","LENTITUD"].forEach(h => j.habilidades.add(h));
        }},
    ],
};

function tirarGacha(tipo) {
    let tabla, pesos;
    if (tipo === "simple") {
        pesos = [70, 25, 5, 0];
    } else if (tipo === "profunda") {
        pesos = [30, 45, 20, 5];
    } else {
        pesos = [5, 25, 50, 20];
    }

    const total = pesos.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    const cats = ["comun", "pocoComan", "epico", "legendario"];
    let cat = "comun";
    for (let i = 0; i < pesos.length; i++) {
        rand -= pesos[i];
        if (rand <= 0) { cat = cats[i]; break; }
    }

    const pool = TABLA_GACHA[cat];
    return pool[Math.floor(Math.random() * pool.length)];
}

// ═══════════════════════════════════════════
// ESTADO GLOBAL DEL JUEGO
// ═══════════════════════════════════════════
const estado = {
    oleada: 1,
    fase: "jugando",   // "jugando" | "entre-oleadas" | "cuenta-atras" | "gameover" | "victoria"
    monedas: 0,
    totalMonedas: 0,
    totalKills: 0,
    tickCuracion: 0,
    timerJuego: 0,

    mejoras: MEJORAS_TIENDA.map(m => ({ ...m })),

    enemigosMuertos: 0,

    // Sonidos (simulados con feedback visual)
};

// ═══════════════════════════════════════════
// MOTOR DE JUEGO PRINCIPAL
// ═══════════════════════════════════════════
const juego = (() => {
    let canvas, ctx;
    let jugador, enemigos, proyectiles, monedas, textos;
    let obstaculos;
    let teclas = {};
    let cursor = { x: 0, y: 0 };
    let clickPendiente = false;
    let rafId = null;
    let lastTime = 0;
    let enemigosPorSpawnear = 0;
    let timerSpawn = 0;
    let recompensaOleada = 0;

    // ─── Inicialización ─────────────────────
    function iniciar() {
        canvas = document.getElementById("canvas");
        ctx = canvas.getContext("2d");
        redimensionar();
        window.addEventListener("resize", redimensionar);

        // Controles
        document.addEventListener("keydown", e => {
            teclas[e.key] = true;
            if ((e.key === " " || e.key === "Spacebar") && estado.fase === "jugando") {
                e.preventDefault();
                dispararJugador();
            }
            if (e.key === " " && estado.fase === "entre-oleadas") {
                e.preventDefault();
                continuarOleada();
            }
        });
        document.addEventListener("keyup", e => { teclas[e.key] = false; });
        canvas.addEventListener("mousemove", e => {
            const rect = canvas.getBoundingClientRect();
            cursor.x = e.clientX - rect.left;
            cursor.y = e.clientY - rect.top;
        });
        canvas.addEventListener("click", () => {
            if (estado.fase === "jugando") {
                dispararJugador();
            }
        });

        // Botones UI
        document.getElementById("btnTienda").onclick = abrirTienda;
        document.getElementById("btnGacha").onclick = abrirGacha;
        document.getElementById("btnContinuarOleada").onclick = continuarOleada;
        document.getElementById("btnCerrarTienda").onclick = cerrarTienda;
        document.getElementById("btnCerrarGacha").onclick = cerrarGacha;
        document.getElementById("btnReiniciar").onclick = reiniciar;
        document.getElementById("btnReinVictoria").onclick = reiniciar;

        document.querySelectorAll(".btn-gacha-tirar").forEach(btn => {
            btn.onclick = () => ejecutarGacha(btn.dataset.tipo);
        });

        resetearJuego();
        iniciarOleada();
        requestAnimationFrame(bucle);
    }

    function redimensionar() {
        if (!canvas) return;
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ─── Reset ──────────────────────────────
    function resetearJuego() {
        estado.oleada = 1;
        estado.fase = "jugando";
        estado.monedas = 0;
        estado.totalMonedas = 0;
        estado.totalKills = 0;
        estado.tickCuracion = 0;
        estado.timerJuego = 0;
        estado.mejoras = MEJORAS_TIENDA.map(m => ({ ...m, nivel: 0 }));

        const cx = canvas.width  / 2;
        const cy = canvas.height / 2;
        jugador     = new Jugador(cx, cy);
        enemigos    = [];
        proyectiles = [];
        monedas     = [];
        textos      = [];
        obstaculos  = generarObstaculos();

        actualizarHUD();
    }

    function generarObstaculos() {
        const ts = CONFIG.TILE;
        const cols  = Math.floor(canvas.width  / ts);
        const filas = Math.floor((canvas.height - 60) / ts);
        const obs = [];
        const cantidad = 35;

        for (let i = 0; i < cantidad; i++) {
            let col, fila;
            do {
                col  = 1 + Math.floor(Math.random() * (cols - 2));
                fila = 1 + Math.floor(Math.random() * (filas - 2));
            } while (
                (Math.abs(col - Math.floor(cols/2)) < 3 && Math.abs(fila - Math.floor(filas/2)) < 3) ||
                obs.some(o => o.col === col && o.fila === fila)
            );
            obs.push({ col, fila });
        }
        return obs;
    }

    // ─── Sistema de Oleadas ─────────────────
    function iniciarOleada() {
        const esJefe = CONFIG.OLEADAS_JEFE.includes(estado.oleada);
        const numEnemigos = calcularEnemigos();
        enemigosPorSpawnear = numEnemigos;
        timerSpawn = 0;
        estado.fase = "jugando";

        document.getElementById("oleadaNum").textContent = estado.oleada;
        document.getElementById("oleadaSub").textContent =
            esJefe ? "⚠ ¡PESADILLA MAYOR!" : "En progreso...";

        actualizarHUD();
    }

    function calcularEnemigos() {
        const base = 5 + Math.floor(estado.oleada * 2.5);
        return Math.min(base, 40);
    }

    function spawnearEnemigo() {
        const ts = CONFIG.TILE;
        const margen = 60;
        const lado = Math.floor(Math.random() * 4);
        let x, y;

        if (lado === 0) { x = margen + Math.random() * (canvas.width  - margen * 2); y = 80; }
        else if (lado === 1) { x = margen + Math.random() * (canvas.width - margen * 2); y = canvas.height - margen; }
        else if (lado === 2) { x = margen; y = 80 + Math.random() * (canvas.height - 80 - margen); }
        else { x = canvas.width - margen; y = 80 + Math.random() * (canvas.height - 80 - margen); }

        const esJefe = CONFIG.OLEADAS_JEFE.includes(estado.oleada) && enemigosPorSpawnear === 1;

        let tipo = "normal";
        if (esJefe) {
            tipo = "jefe";
        } else {
            const r = Math.random();
            if (estado.oleada >= 5 && r < 0.2) tipo = "rapido";
            else if (estado.oleada >= 8 && r < 0.35) tipo = "tanque";
        }

        const e = new Enemigo(x, y, tipo);
        // Escalar stats con oleada
        if (tipo !== "jefe") {
            const mult = 1 + (estado.oleada - 1) * 0.12;
            e.vidaMax = Math.floor(e.vidaMax * mult);
            e.vida = e.vidaMax;
            e.ataque = Math.floor(e.ataque * (1 + (estado.oleada - 1) * 0.08));
            e.monedas = Math.floor(e.monedas * (1 + (estado.oleada - 1) * 0.1));
        } else {
            // Jefe escala fuertemente
            const mult = 1 + estado.oleada * 0.15;
            e.vidaMax = Math.floor(e.vidaMax * mult);
            e.vida = e.vidaMax;
        }

        enemigos.push(e);
    }

    function oleadaCompletada() {
        estado.fase = "entre-oleadas";
        recompensaOleada = 20 + estado.oleada * 15;
        estado.monedas += recompensaOleada;
        estado.totalMonedas += recompensaOleada;

        const esJefe = CONFIG.OLEADAS_JEFE.includes(estado.oleada);
        const titulo = esJefe ? `¡PESADILLA MAYOR DERROTADA!` : `¡OLEADA ${estado.oleada} SUPERADA!`;

        document.getElementById("oleadaCompletadaTitulo").textContent = titulo;
        document.getElementById("oleadaCompletadaSub").textContent =
            esJefe ? "Un gran mal ha sido disipado" : `Han sobrevivido ${estado.oleada} oleadas onírica${estado.oleada > 1 ? "s" : ""}`;
        document.getElementById("recompensaMonedas").textContent = recompensaOleada;

        mostrarOverlay("overlayOleada");
        actualizarHUD();
    }

    function continuarOleada() {
        if (estado.oleada >= CONFIG.OLEADAS_TOTALES) {
            victoria();
            return;
        }
        cerrarTodosOverlays();
        estado.oleada++;

        if (estado.oleada > CONFIG.OLEADAS_TOTALES) {
            victoria();
            return;
        }

        iniciarCuentaAtras();
    }

    function iniciarCuentaAtras() {
        mostrarOverlay("overlayCuentaAtras");
        const esJefe = CONFIG.OLEADAS_JEFE.includes(estado.oleada);
        document.getElementById("cuentaAtrasOleada").textContent =
            `OLEADA ${estado.oleada} — ${esJefe ? "⚠ PESADILLA MAYOR" : "LAS SOMBRAS REGRESAN"}`;

        let cuenta = 3;
        document.getElementById("cuentaAtrasNum").textContent = cuenta;

        const intervalo = setInterval(() => {
            cuenta--;
            if (cuenta <= 0) {
                clearInterval(intervalo);
                cerrarTodosOverlays();
                iniciarOleada();
            } else {
                document.getElementById("cuentaAtrasNum").textContent = cuenta;
                // Reiniciar animación
                const el = document.getElementById("cuentaAtrasNum");
                el.style.animation = "none";
                el.offsetHeight; // reflow
                el.style.animation = "numPulsar 1s ease-in-out";
            }
        }, 1000);
    }

    // ─── Disparo jugador ────────────────────
    function dispararJugador() {
        if (!jugador.puedeAtacar() || estado.fase !== "jugando") return;
        jugador.atacar();

        const ang = jugador.anguloBrazo;
        const velocidadProyectil = 9;

        // Especial de tipo proyectil
        let especial = null;
        if (jugador.habilidades.has("RAYO"))  especial = "rayo";
        else if (jugador.habilidades.has("FUEGO")) especial = "fuego";
        else if (jugador.habilidades.has("HIELO")) especial = "hielo";

        const daño = jugador.ataque;
        const ox = jugador.x + Math.cos(ang) * (jugador.radio + 10);
        const oy = jugador.y + Math.sin(ang) * (jugador.radio + 10);

        proyectiles.push(new Proyectil(ox, oy, ang, velocidadProyectil, daño, true, especial));

        // Proyectiles extra (multiproyectil)
        const mejMulti = estado.mejoras.find(m => m.id === "multiproyectil");
        const extras = mejMulti ? mejMulti.nivel : 0;
        if (extras > 0) {
            const spread = 0.25;
            for (let i = 0; i < extras; i++) {
                const angExtra = ang + (i % 2 === 0 ? 1 : -1) * spread * (Math.floor(i / 2) + 1);
                proyectiles.push(new Proyectil(ox, oy, angExtra, velocidadProyectil * 0.9, Math.floor(daño * 0.7), true, especial));
            }
        }
    }

    // ─── Bucle principal ─────────────────────
    function bucle(timestamp) {
        rafId = requestAnimationFrame(bucle);
        const dt = timestamp - lastTime;
        lastTime = timestamp;
        if (dt > 100) return; // skip si tab inactiva

        if (estado.fase === "jugando") {
            actualizar();
        }
        dibujar();
        actualizarHUD();
    }

    // ─── Actualización ───────────────────────
    function actualizar() {
        estado.timerJuego++;

        // Curación pasiva
        const mejCur = estado.mejoras.find(m => m.id === "curacion");
        if (mejCur && mejCur.nivel > 0) {
            estado.tickCuracion++;
            const intervalo = Math.max(60, 300 - mejCur.nivel * 30);
            if (estado.tickCuracion >= intervalo) {
                jugador.curar(5 * mejCur.nivel);
                estado.tickCuracion = 0;
            }
        }

        // Jugador
        jugador.actualizar(teclas, cursor, obstaculos, CONFIG.COLS, CONFIG.FILAS, CONFIG.TILE);

        // Spawn de enemigos
        timerSpawn++;
        const intervaloSpawn = Math.max(20, 80 - estado.oleada * 3);
        if (timerSpawn >= intervaloSpawn && enemigosPorSpawnear > 0) {
            timerSpawn = 0;
            spawnearEnemigo();
            enemigosPorSpawnear--;
        }

        // Enemigos
        for (const e of enemigos) {
            e.actualizar(jugador, obstaculos, CONFIG.TILE);

            // Ataque cuerpo a cuerpo del enemigo
            if (e.puedeAtacar(jugador)) {
                e.cooldownAtaque = e.cooldownMax;
                const dañado = jugador.recibirDaño(e.ataque);
                if (dañado) {
                    textos.push(new TextoFlotante(jugador.x, jugador.y - 20, `-${e.ataque}`, "#ff1744"));
                }
            }

            // Jefe dispara proyectiles
            if (e.tipo === "jefe" && e.timerProyectil >= 60) {
                e.timerProyectil = 0;
                const ang = Math.atan2(jugador.y - e.y, jugador.x - e.x);
                for (let k = 0; k < 5; k++) {
                    const a = ang + (k - 2) * 0.3;
                    proyectiles.push(new Proyectil(e.x, e.y, a, 5, e.ataque * 0.5, false));
                }
            }
        }

        // Proyectiles
        proyectiles = proyectiles.filter(p => {
            const vivo = p.actualizar();
            if (!vivo) return false;

            // Fuera del canvas
            if (p.x < 0 || p.x > canvas.width || p.y < 60 || p.y > canvas.height) return false;

            // Colisión con obstáculos
            for (const obs of obstaculos) {
                const ox = obs.col * CONFIG.TILE, oy = obs.fila * CONFIG.TILE + 60;
                if (p.x > ox && p.x < ox + CONFIG.TILE && p.y > oy && p.y < oy + CONFIG.TILE) {
                    // Rebote si tiene mejora
                    const mejRebote = estado.mejoras.find(m => m.id === "rebote");
                    if (p.esJugador && mejRebote && mejRebote.nivel > 0 && !p.rebotado) {
                        p.vx = -p.vx;
                        p.vy = -p.vy;
                        p.rebotado = true;
                        p.vida = 40;
                        return true;
                    }
                    return false;
                }
            }

            // Proyectil del jugador vs enemigos
            if (p.esJugador) {
                for (let i = enemigos.length - 1; i >= 0; i--) {
                    const e = enemigos[i];
                    const dx = p.x - e.x, dy = p.y - e.y;
                    if (Math.sqrt(dx*dx + dy*dy) < e.radio + p.radio) {
                        let daño = p.daño;
                        if (p.especial === "rayo") daño = Math.floor(daño * 1.5);

                        // Radio de área
                        const mejRadio = estado.mejoras.find(m => m.id === "radio");
                        if (mejRadio && mejRadio.nivel > 0) {
                            daño = Math.floor(daño * (1 + mejRadio.nivel * 0.1));
                        }

                        const muerto = e.recibirDaño(daño);
                        textos.push(new TextoFlotante(e.x, e.y - e.radio - 10, `-${daño}`, "#00e5ff"));

                        // Efecto hielo: ralentizar
                        if (p.especial === "hielo") {
                            e.velocidad = Math.max(0.3, e.velocidad * 0.7);
                        }

                        if (muerto) {
                            const monCoord = e.monedas;
                            const gana = Math.floor(monCoord * (1 + estado.oleada * 0.05));
                            estado.monedas += gana;
                            estado.totalMonedas += gana;
                            estado.totalKills++;

                            // Drenaje: curar al jugador
                            if (jugador.habilidades.has("DRENAJE")) {
                                jugador.curar(5);
                            }

                            // XP
                            jugador.xp += e.xp;
                            if (jugador.xp >= jugador.xpSiguiente) {
                                jugador.nivel++;
                                jugador.xp -= jugador.xpSiguiente;
                                jugador.xpSiguiente = Math.floor(jugador.xpSiguiente * 1.4);
                                textos.push(new TextoFlotante(jugador.x, jugador.y - 40, `¡NIVEL ${jugador.nivel}!`, "#ffd54f"));
                            }

                            // Soltar moneda
                            monedas.push(new Moneda(e.x, e.y, gana));

                            textos.push(new TextoFlotante(e.x, e.y - 30,
                                `+◈${gana}`, "#ffd54f"));

                            enemigos.splice(i, 1);
                            mostrarNotificacion(`+◈ ${gana} Fragmentos`, "notif-moneda");
                        }

                        return false; // destruye el proyectil
                    }
                }
            } else {
                // Proyectil enemigo vs jugador
                const dx = p.x - jugador.x, dy = p.y - jugador.y;
                if (Math.sqrt(dx*dx + dy*dy) < jugador.radio + p.radio) {
                    const dañado = jugador.recibirDaño(p.daño);
                    if (dañado) {
                        textos.push(new TextoFlotante(jugador.x, jugador.y - 20, `-${p.daño}`, "#ff1744"));
                    }
                    return false;
                }
            }

            return true;
        });

        // Monedas: recoger automáticamente si está cerca
        monedas = monedas.filter(m => {
            const vivo = m.actualizar();
            if (!vivo) return false;
            const dx = m.x - jugador.x, dy = m.y - jugador.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < jugador.radio + m.radio + 25) {
                estado.monedas += m.valor;
                estado.totalMonedas += m.valor;
                return false;
            }
            return true;
        });

        // Textos flotantes
        textos = textos.filter(t => t.actualizar());

        // Game over
        if (jugador.vida <= 0) {
            gameOver();
            return;
        }

        // ¿Oleada completada?
        if (enemigosPorSpawnear === 0 && enemigos.length === 0 && estado.fase === "jugando") {
            oleadaCompletada();
        }
    }

    // ─── Dibujo ─────────────────────────────
    function dibujar() {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Fondo
        ctx.fillStyle = COLOR.FONDO;
        ctx.fillRect(0, 0, w, h);

        // Grid decorativo
        dibujarGrid();

        // Obstáculos
        for (const obs of obstaculos) {
            dibujarObstaculo(obs);
        }

        // Monedas
        for (const m of monedas) m.dibujar(ctx);

        // Enemigos
        for (const e of enemigos) e.dibujar(ctx);

        // Proyectiles
        for (const p of proyectiles) p.dibujar(ctx);

        // Jugador
        jugador.dibujar(ctx);

        // Textos flotantes
        for (const t of textos) t.dibujar(ctx);

        // Línea de mira del cursor
        dibujarCursor();
    }

    function dibujarGrid() {
        const ts = CONFIG.TILE;
        const cols  = Math.floor(canvas.width  / ts);
        const filas = Math.floor((canvas.height - 60) / ts);

        ctx.strokeStyle = "rgba(13,20,55,0.6)";
        ctx.lineWidth = 0.5;

        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * ts, 60);
            ctx.lineTo(c * ts, canvas.height);
            ctx.stroke();
        }
        for (let f = 0; f <= filas; f++) {
            ctx.beginPath();
            ctx.moveTo(0, 60 + f * ts);
            ctx.lineTo(canvas.width, 60 + f * ts);
            ctx.stroke();
        }
    }

    function dibujarObstaculo(obs) {
        const ts = CONFIG.TILE;
        const x = obs.col * ts, y = obs.fila * ts + 60;
        const pad = 2;

        // Glow
        ctx.fillStyle = COLOR.OBSTACULO_GLOW;
        ctx.fillRect(x - pad, y - pad, ts + pad*2, ts + pad*2);

        // Cuerpo
        const grad = ctx.createLinearGradient(x, y, x + ts, y + ts);
        grad.addColorStop(0, "#1a2050");
        grad.addColorStop(1, "#0d1235");
        ctx.fillStyle = grad;
        ctx.fillRect(x + pad, y + pad, ts - pad*2, ts - pad*2);

        // Borde
        ctx.strokeStyle = COLOR.OBSTACULO_BORDE;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + pad, y + pad, ts - pad*2, ts - pad*2);

        // Símbolo decorativo
        ctx.fillStyle = "rgba(100,120,200,0.25)";
        ctx.font = `${ts * 0.5}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("◆", x + ts/2, y + ts/2);
    }

    function dibujarCursor() {
        const cx = cursor.x, cy = cursor.y;
        const tam = 10;
        ctx.strokeStyle = "rgba(0,229,255,0.5)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(cx - tam, cy); ctx.lineTo(cx + tam, cy);
        ctx.moveTo(cx, cy - tam); ctx.lineTo(cx, cy + tam);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,229,255,0.8)";
        ctx.stroke();
    }

    // ─── HUD ─────────────────────────────────
    function actualizarHUD() {
        if (!jugador) return;
        const pct = (jugador.vida / jugador.vidaMax) * 100;
        const barra = document.getElementById("barraVida");
        barra.style.width = pct + "%";

        if (pct <= 30) barra.classList.add("baja");
        else barra.classList.remove("baja");

        if (pct > 60) barra.style.background = "linear-gradient(90deg, #69f0ae, #00e5ff)";
        else if (pct > 30) barra.style.background = "linear-gradient(90deg, #ffd54f, #ff9800)";
        else barra.style.background = "linear-gradient(90deg, #ff1744, #ff6b6b)";

        document.getElementById("vidaTexto").textContent = `${Math.ceil(jugador.vida)}/${jugador.vidaMax}`;
        document.getElementById("monedasCount").textContent = estado.monedas;
        document.getElementById("enemigosCount").textContent = enemigos.length + enemigosPorSpawnear;
        document.getElementById("statVel").textContent = jugador.velocidad.toFixed(1);
        document.getElementById("statAtk").textContent = jugador.ataque;
        document.getElementById("statNivel").textContent = jugador.nivel;
    }

    // ─── Tienda ─────────────────────────────
    function abrirTienda() {
        renderizarTienda();
        mostrarOverlay("overlayTienda");
    }

    function cerrarTienda() {
        cerrarOverlay("overlayTienda");
    }

    function renderizarTienda() {
        document.getElementById("tiendasMonedas").textContent = estado.monedas;
        const grid = document.getElementById("tiendaGrid");
        grid.innerHTML = "";

        for (const mejora of estado.mejoras) {
            const precio = precioMejora(mejora);
            const maxNiv = mejora.nivel >= mejora.nivMax;
            const sinFondos = !maxNiv && estado.monedas < precio;

            const div = document.createElement("div");
            div.className = "tienda-item" + (maxNiv ? " max-nivel" : "") + (sinFondos ? " sin-fondos" : "");

            // Pips de nivel
            let pips = "";
            for (let i = 0; i < mejora.nivMax; i++) {
                pips += `<div class="nivel-pip${i < mejora.nivel ? " activo" : ""}"></div>`;
            }

            div.innerHTML = `
                <div class="item-icono">${mejora.icono}</div>
                <div class="item-nombre">${mejora.nombre}</div>
                <div class="item-nivel">${pips}</div>
                <div class="item-desc">${mejora.desc}</div>
                ${maxNiv
                    ? `<div class="item-estado max">✦ NIVEL MÁXIMO</div>`
                    : `<div class="item-precio">◈ ${precio}</div><div class="item-estado">${sinFondos ? "Sin fragmentos" : "COMPRAR"}</div>`
                }
            `;

            if (!maxNiv && !sinFondos) {
                div.onclick = () => comprarMejora(mejora);
            }

            grid.appendChild(div);
        }
    }

    function comprarMejora(mejora) {
        const precio = precioMejora(mejora);
        if (estado.monedas < precio || mejora.nivel >= mejora.nivMax) return;

        estado.monedas -= precio;
        mejora.nivel++;
        mejora.efecto(jugador, estado.mejoras);

        mostrarNotificacion(`✦ ${mejora.nombre} mejorado (Nv.${mejora.nivel})`, "notif-mejora");
        renderizarTienda();
        actualizarHUD();
    }

    // ─── Gacha ──────────────────────────────
    function abrirGacha() {
        document.getElementById("gachaMonedas").textContent = estado.monedas;
        document.getElementById("gachaResultado").classList.add("oculto");
        mostrarOverlay("overlayGacha");
    }

    function cerrarGacha() {
        cerrarOverlay("overlayGacha");
    }

    function ejecutarGacha(tipo) {
        const precios = { simple: 30, profunda: 80, gran: 200 };
        const precio = precios[tipo];

        if (estado.monedas < precio) {
            mostrarNotificacion("◈ Fragmentos insuficientes", "notif-daño");
            return;
        }

        estado.monedas -= precio;
        document.getElementById("gachaMonedas").textContent = estado.monedas;

        const resultado = tirarGacha(tipo);

        // Aplicar efecto
        resultado.efecto(jugador, estado.mejoras);

        // Mostrar resultado
        const resDiv = document.getElementById("gachaResultado");
        resDiv.classList.remove("oculto");

        document.getElementById("resultadoRareza").className = `resultado-rareza ${resultado.rareza}`;
        const rarezaTexto = {
            "comun": "✦ COMÚN",
            "poco-comun": "✦✦ POCO COMÚN",
            "epico": "✦✦✦ ÉPICO",
            "legendario": "★★★ LEGENDARIO"
        };
        document.getElementById("resultadoRareza").textContent = rarezaTexto[resultado.rareza] || "✦";
        document.getElementById("resultadoIcono").textContent = resultado.icono;
        document.getElementById("resultadoNombre").textContent = resultado.nombre;
        document.getElementById("resultadoDesc").textContent = resultado.desc;

        // Animación reset
        resDiv.style.animation = "none";
        resDiv.offsetHeight;
        resDiv.style.animation = "resultadoEntrada 0.5s cubic-bezier(0.16, 1, 0.3, 1)";

        mostrarNotificacion(`🎱 ${resultado.nombre} — ${rarezaTexto[resultado.rareza]}`, "notif-gacha");
        actualizarHUD();
    }

    // ─── Game Over / Victoria ────────────────
    function gameOver() {
        estado.fase = "gameover";
        document.getElementById("goOleadas").textContent = estado.oleada - 1;
        document.getElementById("goKills").textContent   = estado.totalKills;
        document.getElementById("goMonedas").textContent = estado.totalMonedas;
        mostrarOverlay("overlayGameOver");
    }

    function victoria() {
        estado.fase = "victoria";
        mostrarOverlay("overlayVictoria");
    }

    function reiniciar() {
        cerrarTodosOverlays();
        if (rafId) cancelAnimationFrame(rafId);
        resetearJuego();
        iniciarOleada();
        rafId = requestAnimationFrame(bucle);
    }

    // ─── Overlays ────────────────────────────
    function mostrarOverlay(id) {
        cerrarTodosOverlays();
        document.getElementById(id).classList.remove("oculto");
    }

    function cerrarOverlay(id) {
        document.getElementById(id).classList.add("oculto");
    }

    function cerrarTodosOverlays() {
        ["overlayOleada","overlayTienda","overlayGacha","overlayCuentaAtras","overlayGameOver","overlayVictoria"]
            .forEach(id => document.getElementById(id).classList.add("oculto"));
    }

    // ─── Notificaciones ──────────────────────
    function mostrarNotificacion(texto, clase = "notif-mejora") {
        const cont = document.getElementById("notificaciones");
        const div = document.createElement("div");
        div.className = `notif ${clase}`;
        div.textContent = texto;
        cont.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    return { iniciar };
})();

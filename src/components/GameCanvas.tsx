import React, { useEffect, useRef } from 'react';

interface GameCanvasProps {
  onGameOver: (score: number, isWin: boolean, lives: number, fuel: number) => void;
  isFrozen?: boolean;
}

export default function GameCanvas({ onGameOver, isFrozen }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isFrozenRef = useRef(isFrozen);
  const keysRef = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Constantes de dimensiones
    const CANVAS_W = 600;
    const CANVAS_H = 800;
    const ROAD_W = 320;
    const ROAD_X = (CANVAS_W - ROAD_W) / 2;
    const TOTAL_DISTANCE = 500; // Distancia para ganar

    // Estado del juego
    let animationFrameId: number;
    let isGameOver = false;
    let score = 0;
    let fuel = 100;
    let lives = 3;
    let speed = 5;
    let difficultyMultiplier = 1;
    let roadOffset = 0;
    let frames = 0;
    let screenShake = 0;

    // Estado del jugador
    const player = {
      x: CANVAS_W / 2 - 15,
      y: CANVAS_H - 120,
      width: 30,
      height: 55,
      isInvulnerable: false,
      invulnerableTimer: 0,
    };

    // Controles
    const keys = keysRef.current;

    // Entidades
    let entities: any[] = [];
    let particles: any[] = [];
    let ashParticles: any[] = [];

    // Inicializar ceniza
    for (let i = 0; i < 80; i++) {
      ashParticles.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        size: Math.random() * 2.5 + 0.5,
        speedY: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 3,
        opacity: Math.random() * 0.6 + 0.2
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') keys.w = true;
      if (e.key.toLowerCase() === 'a') keys.a = true;
      if (e.key.toLowerCase() === 's') keys.s = true;
      if (e.key.toLowerCase() === 'd') keys.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') keys.w = false;
      if (e.key.toLowerCase() === 'a') keys.a = false;
      if (e.key.toLowerCase() === 's') keys.s = false;
      if (e.key.toLowerCase() === 'd') keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const spawnEntity = () => {
      const rand = Math.random();
      const x = ROAD_X + 15 + Math.random() * (ROAD_W - 60);
      
      if (rand < 0.15) {
        // Combustible (aumentado del 8% al 15%)
        entities.push({ type: 'FUEL', x, y: -60, width: 24, height: 30 });
      } else if (rand < 0.35) {
        // Auto enemigo
        entities.push({ type: 'CAR', x, y: -80, width: 30, height: 55, color: `hsl(${Math.random()*360}, 70%, 40%)` });
      } else if (rand < 0.55) {
        // Grieta
        entities.push({ type: 'CRACK', x, y: -60, width: 40 + Math.random() * 50, height: 30 + Math.random() * 40 });
      } else if (rand < 0.75) {
        // Charco de Lava
        entities.push({ type: 'LAVA', x, y: -80, width: 60 + Math.random() * 60, height: 40 + Math.random() * 50 });
      } else {
        // Roca cayendo
        entities.push({ type: 'ROCK', x, y: -100, width: 35, height: 35, speedY: speed + 4 + Math.random() * 4, scale: 2 });
      }
    };

    const createExplosion = (x: number, y: number, color: string) => {
      screenShake = 15; // Activar vibración de cámara
      for (let i = 0; i < 30; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 1,
          color: Math.random() > 0.5 ? color : '#ffaa00',
          size: Math.random() * 4 + 2
        });
      }
    };

    const drawCar = (x: number, y: number, w: number, h: number, color: string, isPlayer: boolean) => {
      ctx.save();
      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(x + 5, y + 5, w, h, 5);
      ctx.fill();

      // Chasis
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      
      // Techo/Parabrisas
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 15, w - 8, h - 30, 3);
      ctx.fill();

      // Reflejo parabrisas
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 6, y + 17, w - 12, 8);

      // Faros delanteros
      ctx.fillStyle = '#ffffee';
      ctx.shadowColor = '#ffffee';
      ctx.shadowBlur = isPlayer ? 15 : 5;
      ctx.fillRect(x + 3, y + 2, 6, 5);
      ctx.fillRect(x + w - 9, y + 2, 6, 5);
      ctx.shadowBlur = 0;

      // Luces traseras
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + 3, y + h - 6, 7, 4);
      ctx.fillRect(x + w - 10, y + h - 6, 7, 4);

      // Fuego de escape (jugador)
      if (isPlayer && keys.w) {
        const flameLength1 = isFrozenRef.current ? 25 : 15 + Math.random() * 20;
        const flameLength2 = isFrozenRef.current ? 10 : 5 + Math.random() * 10;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(x + 6, y + h);
        ctx.lineTo(x + w / 2, y + h + flameLength1);
        ctx.lineTo(x + w - 6, y + h);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + 10, y + h);
        ctx.lineTo(x + w / 2, y + h + flameLength2);
        ctx.lineTo(x + w - 10, y + h);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawMountains = (offset: number, isLeft: boolean, isSafe: boolean) => {
      const sign = isLeft ? 1 : -1;
      const base = isLeft ? 0 : CANVAS_W;
      
      // Capa trasera (más oscura, se mueve lento)
      ctx.fillStyle = isSafe ? '#1e3a24' : '#150400';
      ctx.beginPath();
      ctx.moveTo(base, 0);
      for (let y = 0; y <= CANVAS_H; y += 20) {
        let wave = Math.sin((y + offset * 0.1) * 0.004) * 70 + Math.sin((y + offset * 0.1) * 0.008) * 35;
        let x = base + sign * (40 + wave);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(base, CANVAS_H);
      ctx.fill();

      // Ríos de lava o agua (capa media)
      ctx.strokeStyle = isSafe ? '#3b82f6' : '#ff3300';
      ctx.lineWidth = 4 + (isFrozenRef.current ? 1 : Math.random() * 2);
      ctx.shadowColor = isSafe ? '#60a5fa' : '#ff0000';
      ctx.shadowBlur = isSafe ? 10 : 20;
      ctx.beginPath();
      for (let y = 0; y <= CANVAS_H; y += 25) {
        let wave = Math.sin((y + offset * 0.2) * 0.005 + 5) * 60 + Math.sin((y + offset * 0.2) * 0.01) * 30;
        let x = base + sign * (50 + wave);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Capa frontal (más clara, se mueve rápido)
      ctx.fillStyle = isSafe ? '#2f5d34' : '#2a0800';
      ctx.beginPath();
      ctx.moveTo(base, 0);
      for (let y = 0; y <= CANVAS_H; y += 20) {
        let wave = Math.sin((y + offset * 0.3) * 0.006) * 50 + Math.sin((y + offset * 0.3) * 0.012) * 25;
        let x = base + sign * (60 + wave);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(base, CANVAS_H);
      ctx.fill();
    };

    const update = () => {
      // Partículas de explosión (siempre se actualizan para que la animación no se congele)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (isGameOver) return;

      frames++;
      difficultyMultiplier = 1 + Math.floor(frames / 600) * 0.15;

      // Movimiento del jugador
      if (keys.a) player.x -= 6;
      if (keys.d) player.x += 6;
      
      // Muerte por salir de la carretera
      if (player.x + player.width / 2 < ROAD_X || player.x + player.width / 2 > ROAD_X + ROAD_W) {
        lives = 0;
        isGameOver = true;
        createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000');
        setTimeout(() => onGameOver(score, false, lives, fuel), 1500);
        return;
      }

      // Control de velocidad
      let targetSpeed = 6 * difficultyMultiplier;
      if (keys.w) targetSpeed = 12 * difficultyMultiplier;
      if (keys.s) targetSpeed = 3 * difficultyMultiplier;
      
      speed += (targetSpeed - speed) * 0.1;

      // Actualizar puntuación y combustible
      score += speed * 0.015;
      fuel -= 0.04 * (speed / 6);

      if (fuel <= 0) {
        fuel = 0;
        isGameOver = true;
        createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000');
        setTimeout(() => onGameOver(score, false, lives, fuel), 1500);
        return;
      }

      // Llegada a la meta
      let finishLineY = player.y - (TOTAL_DISTANCE - score) * 20;
      if (finishLineY > player.y + player.height) {
        isGameOver = true;
        setTimeout(() => onGameOver(score, true, lives, fuel), 1500);
        return;
      }

      // Animación de carretera
      roadOffset += speed;
      if (roadOffset > 60) roadOffset = 0;

      // Generar entidades (dejar de generar cerca de la meta)
      let spawnRate = Math.max(15, 50 - Math.floor(difficultyMultiplier * 8));
      if (frames % spawnRate === 0 && score < TOTAL_DISTANCE - 50) spawnEntity();

      // Actualizar entidades
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        entity.y += entity.speedY || speed;

        // Efecto de caída para rocas
        if (entity.type === 'ROCK' && entity.scale > 1) {
          entity.scale -= 0.02;
          if (entity.scale < 1) entity.scale = 1;
        }

        // Colisiones
        if (!player.isInvulnerable && 
            player.x < entity.x + entity.width - 5 &&
            player.x + player.width > entity.x + 5 &&
            player.y < entity.y + entity.height - 5 &&
            player.y + player.height > entity.y + 5) {
          
          if (entity.type === 'FUEL') {
            fuel = Math.min(100, fuel + 40);
            entities.splice(i, 1);
            // Efecto visual de recarga
            screenShake = 2;
            continue;
          } else {
            // Choque
            lives--;
            player.isInvulnerable = true;
            player.invulnerableTimer = 90; // 1.5 segundos
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000');
            
            if (lives <= 0) {
              isGameOver = true;
              setTimeout(() => onGameOver(score, false, lives, fuel), 1500);
            }
          }
        }

        if (entity.y > CANVAS_H) entities.splice(i, 1);
      }

      // Invulnerabilidad
      if (player.isInvulnerable) {
        player.invulnerableTimer--;
        if (player.invulnerableTimer <= 0) player.isInvulnerable = false;
      }

      // Ceniza
      ashParticles.forEach(p => {
        p.y += p.speedY + speed * 0.3;
        p.x += p.speedX + (keys.a ? 1 : keys.d ? -1 : 0);
        if (p.y > CANVAS_H) {
          p.y = -10;
          p.x = Math.random() * CANVAS_W;
        }
      });
    };

    const draw = () => {
      // Aplicar Screen Shake
      let isShaking = screenShake > 0 && !isFrozenRef.current;
      if (isShaking) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
      }

      let finishLineY = player.y - (TOTAL_DISTANCE - score) * 20;

      const drawScene = (isSafe: boolean, clipTop: number, clipBottom: number) => {
        if (clipBottom <= clipTop) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, clipTop, CANVAS_W, clipBottom - clipTop);
        ctx.clip();

        // Fondo base
        ctx.fillStyle = isSafe ? '#1a4a2e' : '#0a0200';
        ctx.fillRect(0, clipTop, CANVAS_W, clipBottom - clipTop);

        // Montañas (Parallax)
        drawMountains(frames * speed, true, isSafe);  // Izquierda
        drawMountains(frames * speed, false, isSafe); // Derecha

        // Carretera
        ctx.fillStyle = isSafe ? '#2a2a2a' : '#1a1a1a';
        ctx.fillRect(ROAD_X, 0, ROAD_W, CANVAS_H);

        // Bordes de la carretera
        if (isSafe) {
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(ROAD_X - 5, 0, 10, CANVAS_H);
          ctx.fillRect(ROAD_X + ROAD_W - 5, 0, 10, CANVAS_H);
        } else {
          ctx.fillStyle = '#ff4400';
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 20;
          ctx.fillRect(ROAD_X - 5, 0, 10, CANVAS_H);
          ctx.fillRect(ROAD_X + ROAD_W - 5, 0, 10, CANVAS_H);
          ctx.shadowBlur = 0;
        }

        // Líneas de carril
        ctx.fillStyle = isSafe ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)';
        for (let i = -60; i < CANVAS_H; i += 60) {
          ctx.fillRect(CANVAS_W / 2 - 3, i + roadOffset, 6, 30);
          ctx.fillRect(ROAD_X + ROAD_W / 3 - 2, i + roadOffset, 4, 30);
          ctx.fillRect(ROAD_X + (ROAD_W / 3) * 2 - 2, i + roadOffset, 4, 30);
        }

        ctx.restore();
      };

      // Dibujar zona segura (arriba de la meta)
      if (finishLineY > 0) {
        drawScene(true, 0, finishLineY);
      }
      // Dibujar zona volcánica (debajo de la meta)
      if (finishLineY < CANVAS_H) {
        drawScene(false, Math.max(0, finishLineY), CANVAS_H);
      }

      // Dibujar Meta
      if (finishLineY > -100 && finishLineY < CANVAS_H) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ROAD_X, finishLineY, ROAD_W, 40);
        ctx.fillStyle = '#000000';
        for (let i = 0; i < ROAD_W; i += 20) {
          ctx.fillRect(ROAD_X + i, finishLineY, 10, 20);
          ctx.fillRect(ROAD_X + i + 10, finishLineY + 20, 10, 20);
        }
      }

      // Dibujar Entidades
      entities.forEach(entity => {
        if (entity.type === 'CAR') {
          drawCar(entity.x, entity.y, entity.width, entity.height, entity.color, false);
        } else if (entity.type === 'CRACK') {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(entity.x, entity.y + entity.height/2);
          ctx.lineTo(entity.x + entity.width/3, entity.y);
          ctx.lineTo(entity.x + entity.width*2/3, entity.y + entity.height);
          ctx.lineTo(entity.x + entity.width, entity.y + entity.height/2);
          ctx.stroke();
          // Brillo de lava en la grieta
          ctx.strokeStyle = '#ff3300';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (entity.type === 'LAVA') {
          const gradient = ctx.createRadialGradient(
            entity.x + entity.width/2, entity.y + entity.height/2, 0,
            entity.x + entity.width/2, entity.y + entity.height/2, entity.width/2
          );
          gradient.addColorStop(0, '#ffaa00');
          gradient.addColorStop(0.5, '#ff3300');
          gradient.addColorStop(1, 'rgba(255,0,0,0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(entity.x + entity.width/2, entity.y + entity.height/2, entity.width/2, entity.height/2, 0, 0, Math.PI*2);
          ctx.fill();
        } else if (entity.type === 'ROCK') {
          const scale = entity.scale || 1;
          const cx = entity.x + entity.width/2;
          const cy = entity.y + entity.height/2;
          
          // Sombra de la roca
          ctx.fillStyle = `rgba(0,0,0,${1.5 - scale})`;
          ctx.beginPath();
          ctx.ellipse(cx, entity.y + entity.height + 20 * scale, entity.width/2, entity.height/4, 0, 0, Math.PI*2);
          ctx.fill();

          // Roca
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.rotate(frames * 0.1);
          
          ctx.fillStyle = '#3a1f1f';
          ctx.beginPath();
          ctx.arc(0, 0, entity.width/2, 0, Math.PI*2);
          ctx.fill();
          
          ctx.fillStyle = '#5a2f2f';
          ctx.beginPath();
          ctx.arc(-entity.width/6, -entity.height/6, entity.width/3, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        } else if (entity.type === 'FUEL') {
          ctx.fillStyle = '#00ff44';
          ctx.shadowColor = '#00ff44';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.roundRect(entity.x, entity.y, entity.width, entity.height, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          ctx.fillStyle = '#005500';
          ctx.font = 'bold 18px Arial';
          ctx.fillText('F', entity.x + 6, entity.y + 22);
        }
      });

      // Dibujar Jugador
      if (!player.isInvulnerable || Math.floor(frames / 4) % 2 === 0) {
        drawCar(player.x, player.y, player.width, player.height, '#cc0000', true);
      }

      // Dibujar Partículas de explosión
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Restaurar contexto si hubo shake
      if (isShaking) ctx.restore();

      // Viñeta y Ceniza (solo en zona volcánica)
      if (finishLineY < CANVAS_H) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, Math.max(0, finishLineY), CANVAS_W, CANVAS_H - Math.max(0, finishLineY));
        ctx.clip();

        // Viñeta (Oscurecer bordes para dramatismo)
        const vignette = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, CANVAS_H/3, CANVAS_W/2, CANVAS_H/2, CANVAS_H);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Dibujar Ceniza (Por encima de la viñeta)
        ctx.fillStyle = '#aaaaaa';
        ashParticles.forEach(p => {
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // HUD (Barra Superior)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, CANVAS_W, 70);
      ctx.strokeStyle = '#ff3300';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.lineTo(CANVAS_W, 70);
      ctx.stroke();

      // Distancia
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px monospace';
      ctx.fillText('DISTANCIA', 20, 25);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${Math.floor(score)}/${TOTAL_DISTANCE}m`, 20, 52);

      // Vidas
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px monospace';
      ctx.fillText('VIDAS', 180, 25);
      for(let i=0; i<3; i++) {
        if (i < lives) {
          ctx.fillStyle = '#ff0000';
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#333333';
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(180 + i * 25, 34, 18, 18);
      }
      ctx.shadowBlur = 0;

      // Combustible
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px monospace';
      ctx.fillText('COMBUSTIBLE', 300, 25);
      ctx.fillStyle = '#333333';
      ctx.fillRect(300, 35, 120, 16);
      const fuelColor = fuel > 50 ? '#00ff00' : fuel > 20 ? '#ffaa00' : '#ff0000';
      ctx.fillStyle = fuelColor;
      ctx.shadowColor = fuelColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(300, 35, fuel * 1.2, 16);
      ctx.shadowBlur = 0;

      // Velocidad
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px monospace';
      ctx.fillText('VELOCIDAD', 460, 25);
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${Math.floor(speed * 12)} KM/H`, 460, 52);

      // Barra de Progreso (Meta)
      const barWidth = 24;
      const barHeight = CANVAS_H - 220;
      const barX = CANVAS_W - 45;
      const barY = 120;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.roundRect(barX, barY, barWidth, barHeight, 8);
      ctx.fill();
      ctx.strokeStyle = '#ff5500';
      ctx.lineWidth = 3;
      ctx.stroke();

      const progress = Math.min(1, Math.max(0, score / TOTAL_DISTANCE));
      const fillHeight = progress * barHeight;

      const progressGradient = ctx.createLinearGradient(0, barY + barHeight, 0, barY);
      progressGradient.addColorStop(0, '#ff0000');
      progressGradient.addColorStop(0.5, '#ffaa00');
      progressGradient.addColorStop(1, '#00ff00');
      
      ctx.fillStyle = progressGradient;
      ctx.beginPath();
      ctx.roundRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight, 8);
      ctx.fill();

      // Icono del jugador en la barra
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(barX + barWidth / 2, barY + barHeight - fillHeight, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cc0000';
      ctx.beginPath();
      ctx.arc(barX + barWidth / 2, barY + barHeight - fillHeight, 5, 0, Math.PI * 2);
      ctx.fill();

      // Texto META
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('META', barX - 8, barY - 15);
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      if (!isFrozenRef.current) {
        update();
      }
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onGameOver]);

  const handleControl = (key: 'w'|'a'|'s'|'d', isDown: boolean) => (e: React.SyntheticEvent) => {
    if (e.type.startsWith('touch') && e.cancelable) {
      e.preventDefault();
    }
    keysRef.current[key] = isDown;
  };

  return (
    <div className="relative flex justify-center items-center w-full max-w-[600px] mx-auto">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={800} 
        className="border-4 border-red-900 rounded-lg shadow-[0_0_40px_rgba(255,0,0,0.6)] max-w-full max-h-[100dvh] object-contain bg-black"
      />
      
      {/* Controles Táctiles (Visibles en pantallas pequeñas) */}
      <div className="absolute bottom-6 left-2 flex gap-2 md:hidden z-50">
        <button 
          className="w-14 h-14 bg-gray-900/80 border-2 border-gray-500 rounded-full text-white text-2xl flex items-center justify-center active:bg-gray-700 select-none touch-none"
          onTouchStart={handleControl('a', true)} onTouchEnd={handleControl('a', false)}
          onMouseDown={handleControl('a', true)} onMouseUp={handleControl('a', false)} onMouseLeave={handleControl('a', false)}
        >◀</button>
        <button 
          className="w-14 h-14 bg-gray-900/80 border-2 border-gray-500 rounded-full text-white text-2xl flex items-center justify-center active:bg-gray-700 select-none touch-none"
          onTouchStart={handleControl('d', true)} onTouchEnd={handleControl('d', false)}
          onMouseDown={handleControl('d', true)} onMouseUp={handleControl('d', false)} onMouseLeave={handleControl('d', false)}
        >▶</button>
      </div>
      <div className="absolute bottom-6 right-2 flex flex-col gap-2 md:hidden z-50">
        <button 
          className="w-14 h-14 bg-gray-900/80 border-2 border-gray-500 rounded-full text-white text-2xl flex items-center justify-center active:bg-gray-700 select-none touch-none"
          onTouchStart={handleControl('w', true)} onTouchEnd={handleControl('w', false)}
          onMouseDown={handleControl('w', true)} onMouseUp={handleControl('w', false)} onMouseLeave={handleControl('w', false)}
        >▲</button>
        <button 
          className="w-14 h-14 bg-gray-900/80 border-2 border-gray-500 rounded-full text-white text-2xl flex items-center justify-center active:bg-gray-700 select-none touch-none"
          onTouchStart={handleControl('s', true)} onTouchEnd={handleControl('s', false)}
          onMouseDown={handleControl('s', true)} onMouseUp={handleControl('s', false)} onMouseLeave={handleControl('s', false)}
        >▼</button>
      </div>
    </div>
  );
}

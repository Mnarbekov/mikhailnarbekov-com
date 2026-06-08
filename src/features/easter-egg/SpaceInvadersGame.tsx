import { useCallback, useEffect, useRef, useState } from 'react';

type GameStatus = 'ready' | 'playing' | 'won' | 'lost';
type Invader = { x: number; y: number; alive: boolean; wobble: number; row: number; color: string };
type Bullet = { x: number; y: number; dy: number; from: 'player' | 'alien' };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
type VictoryTrail = { x: number; y: number; vy: number; length: number; life: number; maxLife: number; color: string; width: number; sway: number };
type Snapshot = { score: number; lives: number; status: GameStatus; remaining: number };
type Control = 'left' | 'right' | 'fire';

const WIDTH = 720;
const HEIGHT = 420;
const PLAYER_Y = 374;
const PLAYER_W = 42;
const PLAYER_H = 18;
const INVADER_W = 28;
const INVADER_H = 20;
const NEON_PALETTE = ['#00e5ff', '#ff3df2', '#ffe66d', '#39ff88', '#ff7a3d'];
const VICTORY_COLORS = ['#9fcbff', '#00e5ff', '#ff3df2', '#39ff88', '#ffffff'];

// Victory cinematic phase timing (seconds from victoryStartedAt)
const VPHASE_ZOOM_END = 1.2;     // center + zoom toward viewer ends
const VPHASE_HOLD_END = 2.2;     // 1-second hold ends
const VPHASE_LAUNCH_END = 2.75;  // ship exits top of screen
const VPHASE_FADE_START = 2.5;   // screen fade-to-black begins (overlaps launch)
const VPHASE_FADE_END = 3.4;     // fade complete, mission-complete text shown

const makeInvaders = (): Invader[] => {
  const invaders: Invader[] = [];
  const startX = 92;
  const startY = 62;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      invaders.push({ x: startX + col * 56, y: startY + row * 42, alive: true, wobble: (row + col) % 2, row, color: NEON_PALETTE[row % NEON_PALETTE.length] });
    }
  }
  return invaders;
};

export default function SpaceInvadersGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const keys = useRef({ left: false, right: false, fire: false });
  const game = useRef({
    playerX: WIDTH / 2,
    invaders: makeInvaders(),
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    victoryTrails: [] as VictoryTrail[],
    victoryStartedAt: null as number | null,
    reducedMotion: false,
    dir: 1,
    lastShot: 0,
    lastAlienShot: 0,
    score: 0,
    lives: 3,
    status: 'ready' as GameStatus,
    flash: 0,
  });
  const raf = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>({ score: 0, lives: 3, status: 'ready', remaining: 36 });

  const syncSnapshot = useCallback(() => {
    const state = game.current;
    setSnapshot({
      score: state.score,
      lives: state.lives,
      status: state.status,
      remaining: state.invaders.filter((invader) => invader.alive).length,
    });
  }, []);

  const reset = useCallback(() => {
    game.current = {
      playerX: WIDTH / 2,
      invaders: makeInvaders(),
      bullets: [],
      particles: [],
      victoryTrails: [],
      victoryStartedAt: null,
      reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
      dir: 1,
      lastShot: 0,
      lastAlienShot: 0,
      score: 0,
      lives: 3,
      status: 'playing',
      flash: 0,
    };
    lastTime.current = null;
    syncSnapshot();
  }, [syncSnapshot]);

  const startOrRestart = useCallback(() => {
    if (game.current.status !== 'playing') reset();
  }, [reset]);

  const shoot = useCallback((time = performance.now()) => {
    const state = game.current;
    if (state.status === 'ready') {
      reset();
      return;
    }
    if (state.status !== 'playing') return;
    if (time - state.lastShot < 230) return;
    state.bullets.push({ x: state.playerX, y: PLAYER_Y - 10, dy: -390, from: 'player' });
    state.lastShot = time;
  }, [reset]);

  const addExplosion = (x: number, y: number, color: string) => {
    const state = game.current;
    for (let i = 0; i < 22; i += 1) {
      const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.38;
      const speed = 70 + Math.random() * 210;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        life: 0.72 + Math.random() * 0.46,
        maxLife: 1.18,
        color: Math.random() > 0.25 ? color : NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)],
        size: 2 + Math.random() * 4,
      });
    }
  };

  const startVictorySequence = (time: number) => {
    const state = game.current;
    if (state.status === 'won') return;
    state.status = 'won';
    state.victoryStartedAt = time;
    state.bullets = [];
    state.flash = 0;
    if (state.reducedMotion) {
      state.playerX = WIDTH / 2;
      return;
    }
    for (let i = 0; i < 70; i += 1) {
      state.victoryTrails.push({
        x: WIDTH / 2 + (Math.random() - 0.5) * 260,
        y: PLAYER_Y + 14 + Math.random() * 90,
        vy: -(520 + Math.random() * 820),
        length: 28 + Math.random() * 88,
        life: 0.42 + Math.random() * 0.62,
        maxLife: 1.08,
        color: VICTORY_COLORS[Math.floor(Math.random() * VICTORY_COLORS.length)],
        width: 1.4 + Math.random() * 4.2,
        sway: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 44; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 150 + Math.random() * 420;
      state.particles.push({
        x: WIDTH / 2 + (Math.random() - 0.5) * 42,
        y: PLAYER_Y + 18 + Math.random() * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.78 + Math.random() * 0.62,
        maxLife: 1.42,
        color: VICTORY_COLORS[Math.floor(Math.random() * VICTORY_COLORS.length)],
        size: 2 + Math.random() * 5,
      });
    }
  };

  const drawPlayerShip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    accent: string,
    scale = 1,
    enginePower = 0,
    time = 0,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (enginePower > 0) {
      const pulse = 0.82 + Math.sin(time / 72) * 0.18;
      const flame = ctx.createLinearGradient(0, 10, 0, 64);
      flame.addColorStop(0, `rgba(255,255,255,${0.82 * enginePower})`);
      flame.addColorStop(0.22, `rgba(159,203,255,${0.75 * enginePower})`);
      flame.addColorStop(0.58, `rgba(0,229,255,${0.42 * enginePower})`);
      flame.addColorStop(1, 'rgba(255,61,242,0)');
      ctx.globalAlpha = Math.min(1, enginePower * pulse);
      ctx.fillStyle = flame;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 28 * enginePower;
      ctx.beginPath();
      ctx.moveTo(-10, 12);
      ctx.quadraticCurveTo(-24, 36, -5, 62);
      ctx.lineTo(0, 72 + Math.sin(time / 55) * 9);
      ctx.lineTo(5, 62);
      ctx.quadraticCurveTo(24, 36, 10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = enginePower > 0 ? 30 : game.current.flash > 0 ? 24 : 12;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(26, 12);
    ctx.lineTo(12, 12);
    ctx.lineTo(8, 18);
    ctx.lineTo(-8, 18);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-26, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();
  };

  const drawVictoryTrails = (ctx: CanvasRenderingContext2D, time: number) => {
    const state = game.current;
    if (!state.victoryTrails.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    state.victoryTrails.forEach((trail) => {
      const alpha = Math.max(0, trail.life / trail.maxLife);
      const sway = Math.sin(time / 120 + trail.sway) * 10;
      const gradient = ctx.createLinearGradient(trail.x + sway, trail.y, trail.x + sway * 0.4, trail.y + trail.length);
      gradient.addColorStop(0, `rgba(255,255,255,${0.92 * alpha})`);
      gradient.addColorStop(0.25, trail.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = trail.width;
      ctx.shadowColor = trail.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(trail.x + sway, trail.y);
      ctx.lineTo(trail.x + sway * 0.4, trail.y + trail.length);
      ctx.stroke();
    });
    ctx.restore();
  };

  const drawAlien = (ctx: CanvasRenderingContext2D, x: number, y: number, alive: boolean, color: string, tick: number) => {
    if (!alive) return;
    const cell = 4;
    const pattern = [
      [0,1,0,0,0,1,0],
      [0,0,1,0,1,0,0],
      [0,1,1,1,1,1,0],
      [1,1,0,1,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,0,1,0,1,0],
      [1,0,0,0,0,0,1],
    ];
    ctx.save();
    ctx.translate(x - 14, y - 12 + Math.sin((tick + x) / 220) * 1.2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    pattern.forEach((row, rowIndex) => row.forEach((bit, colIndex) => {
      if (bit) ctx.fillRect(colIndex * cell, rowIndex * cell, cell - 1, cell - 1);
    }));
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillRect(8, 12, 3, 3);
    ctx.fillRect(16, 12, 3, 3);
    ctx.restore();
  };

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = game.current;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#9fcbff';
    const text = getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim() || '#c1ccda';

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#050712');
    gradient.addColorStop(0.36, '#111433');
    gradient.addColorStop(0.68, '#140923');
    gradient.addColorStop(1, '#030509');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const skyline = ctx.createLinearGradient(0, 88, WIDTH, 190);
    skyline.addColorStop(0, 'rgba(0,229,255,.26)');
    skyline.addColorStop(0.35, 'rgba(255,61,242,.2)');
    skyline.addColorStop(0.7, 'rgba(57,255,136,.16)');
    skyline.addColorStop(1, 'rgba(255,230,109,.18)');
    ctx.fillStyle = skyline;
    for (let x = 22; x < WIDTH; x += 46) {
      const h = 26 + ((x * 17) % 82);
      ctx.fillRect(x, 176 - h, 24 + (x % 3) * 8, h);
    }

    ctx.strokeStyle = 'rgba(0,229,255,.11)';
    ctx.lineWidth = 1;
    for (let y = 38; y < HEIGHT; y += 38) {
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(WIDTH - 28, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,61,242,.12)';
    for (let x = -60; x < WIDTH; x += 84) {
      ctx.beginPath();
      ctx.moveTo(x, HEIGHT);
      ctx.lineTo(x + 168, 206);
      ctx.stroke();
    }

    state.invaders.forEach((invader) => drawAlien(ctx, invader.x, invader.y, invader.alive, invader.color, time));

    const victoryElapsed = state.victoryStartedAt === null ? 0 : (time - state.victoryStartedAt) / 1000;

    // Phase-based ship position, scale, and engine power
    let shipY = PLAYER_Y;
    let shipScale = 1;
    let enginePower = 0;
    if (state.status === 'won') {
      enginePower = Math.min(1, victoryElapsed / 0.55);
      if (victoryElapsed <= VPHASE_ZOOM_END) {
        // Phase 1: center + zoom — ship drifts up and scales toward viewer
        const t = 1 - Math.pow(1 - victoryElapsed / VPHASE_ZOOM_END, 3);
        shipY = PLAYER_Y - 74 * t;
        shipScale = 1 + 0.8 * t;
      } else if (victoryElapsed <= VPHASE_HOLD_END) {
        // Phase 2: hold — ship pauses at zoom, engines burning
        shipY = PLAYER_Y - 74;
        shipScale = 1.8;
      } else if (victoryElapsed <= VPHASE_LAUNCH_END) {
        // Phase 3: launch — cubic ease-in rockets ship off top of screen
        const launchT = (victoryElapsed - VPHASE_HOLD_END) / (VPHASE_LAUNCH_END - VPHASE_HOLD_END);
        const easeIn = launchT * launchT * launchT;
        const holdY = PLAYER_Y - 74;
        shipY = holdY - (holdY + 140) * easeIn;
        shipScale = 1.8;
      } else {
        // Phase 4+: ship is gone — park off-screen
        shipY = -200;
        shipScale = 1.8;
      }
    }

    drawVictoryTrails(ctx, time);

    // Halo fades out as ship launches (not needed once ship exits)
    if (state.status === 'won' && victoryElapsed <= VPHASE_HOLD_END + 0.3) {
      const haloFade = Math.max(0, 1 - Math.max(0, victoryElapsed - VPHASE_HOLD_END) / 0.3);
      const halo = ctx.createRadialGradient(WIDTH / 2, shipY + 18, 4, WIDTH / 2, shipY + 18, 190);
      halo.addColorStop(0, `rgba(159,203,255,${0.28 * enginePower * haloFade})`);
      halo.addColorStop(0.36, `rgba(0,229,255,${0.16 * enginePower * haloFade})`);
      halo.addColorStop(1, 'rgba(255,61,242,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    drawPlayerShip(ctx, state.playerX, shipY, accent, shipScale, enginePower, time);

    state.bullets.forEach((bullet) => {
      const bulletColor = bullet.from === 'player' ? '#00e5ff' : '#ff3df2';
      ctx.fillStyle = bulletColor;
      ctx.shadowColor = bulletColor;
      ctx.shadowBlur = 14;
      ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 17);
    });

    state.particles.forEach((particle) => {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = Math.min(1, alpha * 1.35);
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 18;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;

    // Victory fade-to-black + mission-complete card (drawn after all game elements)
    if (state.status === 'won' && victoryElapsed >= VPHASE_FADE_START) {
      const fadeT = Math.min(1, (victoryElapsed - VPHASE_FADE_START) / (VPHASE_FADE_END - VPHASE_FADE_START));
      ctx.fillStyle = `rgba(3,5,9,${fadeT * fadeT})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      if (victoryElapsed >= VPHASE_FADE_END) {
        const compact = canvas.clientWidth < 520;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = accent;
        ctx.font = `700 ${compact ? 22 : 15}px Consolas, monospace`;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 20;
        ctx.fillText('MISSION COMPLETE', WIDTH / 2, HEIGHT / 2 - 12);
        ctx.fillStyle = text;
        ctx.font = `${compact ? 16 : 12}px system-ui, sans-serif`;
        ctx.shadowBlur = 0;
        ctx.fillText('Press Enter or Fire to play again', WIDTH / 2, HEIGHT / 2 + 18);
        ctx.restore();
      }
    }

    if (state.status !== 'playing' && state.status !== 'won') {
      const compact = canvas.clientWidth < 520;
      ctx.save();
      ctx.fillStyle = 'rgba(5,8,12,.62)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = accent;
      ctx.font = `700 ${compact ? 24 : 16}px Consolas, monospace`;
      ctx.textAlign = 'center';
      const message = state.status === 'lost' ? 'TRY AGAIN' : 'PRESS ENTER OR FIRE';
      ctx.fillText(message, WIDTH / 2, compact ? HEIGHT / 2 - 18 : HEIGHT / 2 - 8);
      ctx.fillStyle = text;
      ctx.font = `${compact ? 19 : 13}px system-ui, sans-serif`;
      ctx.fillText(compact ? 'Use the buttons below.' : 'Move with arrows / A-D. Fire with space or touch.', WIDTH / 2, compact ? HEIGHT / 2 + 20 : HEIGHT / 2 + 22);
      ctx.restore();
    }
  }, []);

  const update = useCallback((dt: number, time: number) => {
    const state = game.current;
    const advanceParticles = () => {
      state.particles.forEach((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 260 * dt;
        particle.life -= dt;
      });
      state.particles = state.particles.filter((particle) => particle.life > 0 && particle.y < HEIGHT + 40);
    };
    const advanceVictory = () => {
      const elapsed = state.victoryStartedAt === null ? 0 : Math.max(0, (time - state.victoryStartedAt) / 1000);
      // Center ship during zoom+hold only; don't fight the launch trajectory
      if (elapsed <= VPHASE_HOLD_END) {
        state.playerX += (WIDTH / 2 - state.playerX) * Math.min(1, 5.6 * dt);
      }
      if (!state.reducedMotion) {
        // Compute trail spawn origin to track ship during launch phase
        let trailOriginY = PLAYER_Y + 16;
        if (elapsed > VPHASE_HOLD_END && elapsed <= VPHASE_LAUNCH_END) {
          const launchT = (elapsed - VPHASE_HOLD_END) / (VPHASE_LAUNCH_END - VPHASE_HOLD_END);
          const easeIn = launchT * launchT * launchT;
          trailOriginY = (PLAYER_Y - 74) - ((PLAYER_Y - 74) + 140) * easeIn + 16;
        }
        // Phase-gated burst rates: no new trails once fade starts
        if (elapsed <= VPHASE_FADE_START) {
          const inLaunch = elapsed > VPHASE_HOLD_END;
          const iterations = inLaunch ? 18 : 10;
          const addProb = inLaunch ? 0.55 : 0.4;
          const spread = elapsed <= VPHASE_ZOOM_END ? 44 : inLaunch ? 12 : 22;
          for (let i = 0; i < iterations; i += 1) {
            if (Math.random() > addProb) continue;
            state.victoryTrails.push({
              x: state.playerX + (Math.random() - 0.5) * spread,
              y: trailOriginY + (Math.random() - 0.5) * 14,
              vy: -(680 + Math.random() * 940),
              length: inLaunch ? 80 + Math.random() * 160 : 42 + Math.random() * 116,
              life: inLaunch ? 0.18 + Math.random() * 0.28 : 0.28 + Math.random() * 0.48,
              maxLife: 0.76,
              color: VICTORY_COLORS[Math.floor(Math.random() * VICTORY_COLORS.length)],
              width: inLaunch ? 2 + Math.random() * 5.5 : 1.2 + Math.random() * 4.4,
              sway: Math.random() * Math.PI * 2,
            });
          }
        }
        state.victoryTrails.forEach((trail) => {
          trail.y += trail.vy * dt;
          trail.life -= dt;
        });
        state.victoryTrails = state.victoryTrails.filter((trail) => trail.life > 0 && trail.y + trail.length > -60);
      }
    };
    if (state.status === 'won') {
      advanceParticles();
      advanceVictory();
      return;
    }
    if (state.status !== 'playing') {
      advanceParticles();
      return;
    }

    const left = keys.current.left;
    const right = keys.current.right;
    if (left && !right) state.playerX -= 285 * dt;
    if (right && !left) state.playerX += 285 * dt;
    state.playerX = Math.max(34, Math.min(WIDTH - 34, state.playerX));
    if (keys.current.fire) shoot(time);

    let edge = false;
    const aliveInvaders = state.invaders.filter((invader) => invader.alive);
    const speed = 27 + (36 - aliveInvaders.length) * 1.8;
    aliveInvaders.forEach((invader) => {
      invader.x += state.dir * speed * dt;
      if (invader.x > WIDTH - 42 || invader.x < 42) edge = true;
    });
    if (edge) {
      state.dir *= -1;
      aliveInvaders.forEach((invader) => { invader.y += 16; });
    }

    if (aliveInvaders.length && time - state.lastAlienShot > 950) {
      const shooter = aliveInvaders[Math.floor((Math.sin(time / 777) + 1) / 2 * (aliveInvaders.length - 1))];
      state.bullets.push({ x: shooter.x, y: shooter.y + 18, dy: 175, from: 'alien' });
      state.lastAlienShot = time;
    }

    state.bullets.forEach((bullet) => { bullet.y += bullet.dy * dt; });
    state.bullets = state.bullets.filter((bullet) => bullet.y > -24 && bullet.y < HEIGHT + 28);
    advanceParticles();

    for (const bullet of state.bullets.filter((item) => item.from === 'player')) {
      const hit = state.invaders.find((invader) => invader.alive && Math.abs(invader.x - bullet.x) < INVADER_W / 2 && Math.abs(invader.y - bullet.y) < INVADER_H);
      if (hit) {
        addExplosion(hit.x, hit.y, hit.color);
        hit.alive = false;
        bullet.y = -100;
        state.score += 100;
      }
    }

    for (const bullet of state.bullets.filter((item) => item.from === 'alien')) {
      const hitPlayer = Math.abs(bullet.x - state.playerX) < PLAYER_W / 2 && bullet.y > PLAYER_Y - PLAYER_H && bullet.y < PLAYER_Y + PLAYER_H;
      if (hitPlayer) {
        bullet.y = HEIGHT + 100;
        state.lives -= 1;
        state.flash = 10;
      }
    }
    if (state.flash > 0) state.flash -= 1;

    const remaining = state.invaders.filter((invader) => invader.alive).length;
    const breached = state.invaders.some((invader) => invader.alive && invader.y > PLAYER_Y - 28);
    if (remaining === 0) startVictorySequence(time);
    if (state.lives <= 0 || breached) state.status = 'lost';
    state.bullets = state.bullets.filter((bullet) => bullet.y > -50 && bullet.y < HEIGHT + 50);
  }, [shoot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.floor(width * HEIGHT / WIDTH);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(WIDTH * dpr);
      canvas.height = Math.floor(HEIGHT * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    const loop = (time: number) => {
      const previous = lastTime.current ?? time;
      const dt = Math.min((time - previous) / 1000, 0.033);
      lastTime.current = time;
      update(dt, time);
      draw(time);
      if (Math.floor(time / 180) !== Math.floor(previous / 180)) syncSnapshot();
      raf.current = window.requestAnimationFrame(loop);
    };
    raf.current = window.requestAnimationFrame(loop);
    return () => {
      if (raf.current !== null) window.cancelAnimationFrame(raf.current);
    };
  }, [draw, syncSnapshot, update]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'Spacebar', 'a', 'A', 'd', 'D', 'Enter'].includes(event.key)) event.preventDefault();
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keys.current.left = true;
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keys.current.right = true;
      if (event.key === ' ' || event.key === 'Spacebar') { keys.current.fire = true; shoot(); }
      if (event.key === 'Enter') startOrRestart();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keys.current.left = false;
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keys.current.right = false;
      if (event.key === ' ' || event.key === 'Spacebar') keys.current.fire = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [shoot, startOrRestart]);

  useEffect(() => {
    if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return undefined;
    const devWindow = window as Window & { __pkaSpaceInvadersWin?: () => void };
    devWindow.__pkaSpaceInvadersWin = () => {
      const state = game.current;
      state.invaders.forEach((invader) => { invader.alive = false; });
      state.score = Math.max(state.score, 3600);
      startVictorySequence(performance.now());
      syncSnapshot();
    };
    return () => {
      delete devWindow.__pkaSpaceInvadersWin;
    };
  }, [syncSnapshot]);

  const setControl = (control: Control, active: boolean) => {
    keys.current[control] = active;
    if (control === 'fire' && active) shoot();
  };

  const statusText = snapshot.status === 'won'
    ? 'Transmission cleared. Play again?'
    : snapshot.status === 'lost'
      ? 'Signal interrupted. Try again?'
      : snapshot.status === 'ready'
        ? 'Ready. Press Enter or Fire to begin.'
        : `${snapshot.remaining} invaders remaining.`;

  return (
    <div className="space-game">
      <div className="game-hud" aria-live="polite">
        <span>Score <strong>{snapshot.score}</strong></span>
        <span>Lives <strong>{snapshot.lives}</strong></span>
        <span>Status <strong>{statusText}</strong></span>
      </div>
      <div ref={wrapRef} className="canvas-wrap">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Space Invaders style game canvas" />
      </div>
      <div className="game-actions">
        <p><span className="desktop-hint">Desktop: ←/→ or A/D to move, Space to shoot, Enter to start/restart, Esc to close.</span><span className="mobile-hint">Mobile: hold ←/→ to move, tap Fire to shoot. Hide game closes it.</span></p>
        <div className="action-buttons">
          <button type="button" onClick={startOrRestart}>{snapshot.status === 'playing' ? 'Restart' : 'Start / replay'}</button>
          <button type="button" onClick={onExit}>Hide game</button>
        </div>
      </div>
      <div className="touch-controls" aria-label="Touch controls">
        {(['left', 'fire', 'right'] as Control[]).map((control) => (
          <button
            key={control}
            type="button"
            aria-label={control === 'left' ? 'Move left' : control === 'right' ? 'Move right' : 'Fire'}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setControl(control, true); }}
            onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); setControl(control, false); }}
            onPointerCancel={() => setControl(control, false)}
            onPointerLeave={() => setControl(control, false)}
          >
            {control === 'left' ? '←' : control === 'right' ? '→' : 'Fire'}
          </button>
        ))}
      </div>
      <style>{`
        .space-game { display: grid; gap: 14px; }
        .game-hud { display: flex; flex-wrap: wrap; gap: 10px; color: var(--muted); font: 700 .72rem/1.4 var(--font-code); letter-spacing: .1em; text-transform: uppercase; }
        .game-hud span { border: 1px solid var(--hairline); border-radius: 999px; padding: 7px 10px; background: rgba(159,203,255,.045); }
        .game-hud strong { color: var(--title); font-weight: 700; }
        .canvas-wrap { width: 100%; overflow: hidden; border: 1px solid rgba(159,203,255,.42); border-radius: 20px; background: #060a10; box-shadow: inset 0 0 38px rgba(159,203,255,.08), 0 0 30px rgba(159,203,255,.12); }
        canvas { display: block; width: 100%; max-width: 100%; touch-action: none; }
        .game-actions { display: flex; justify-content: space-between; gap: 16px; align-items: center; color: var(--text-soft); font-size: .92rem; }
        .game-actions p { margin: 0; }
        .mobile-hint { display: none; }
        .action-buttons, .touch-controls { display: flex; gap: 10px; flex-wrap: wrap; }
        .action-buttons button, .touch-controls button { min-height: 44px; border: 1px solid var(--accent-line); border-radius: 999px; padding: 11px 15px; background: rgba(159,203,255,.08); color: var(--title); cursor: pointer; font: 700 .72rem/1 var(--font-body); letter-spacing: .1em; text-transform: uppercase; }
        .touch-controls { justify-content: center; }
        .touch-controls button { min-width: 88px; }
        @media (min-width: 761px) { .touch-controls { display: none; } }
        @media (max-width: 760px) { .game-actions { align-items: stretch; flex-direction: column; } .desktop-hint { display: none; } .mobile-hint { display: inline; } .action-buttons button { flex: 1 1 auto; } .touch-controls { position: sticky; bottom: 8px; padding: 8px; border: 1px solid var(--hairline); border-radius: 999px; background: rgba(8,13,20,.86); backdrop-filter: blur(12px); } :root[data-theme="light"] .touch-controls { background: rgba(247,249,251,.9); } .touch-controls button { flex: 1 1 76px; min-width: 76px; } }
      `}</style>
    </div>
  );
}

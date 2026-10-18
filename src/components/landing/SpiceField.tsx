import { useEffect, useRef } from 'react';

type Kind = 'dust' | 'flake' | 'mustard' | 'cumin' | 'pepper' | 'cinnamon' | 'anise' | 'clove';

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  z: number; // depth 0.15 (far) .. 1 (near)
  size: number;
  rot: number;
  vr: number;
  vx: number;
  vy: number;
  phase: number;
  color: string;
  shape?: number[]; // flake polygon radii
}

const WEIGHTS: Array<[Kind, number]> = [
  ['dust', 34],
  ['flake', 20],
  ['mustard', 12],
  ['cumin', 10],
  ['pepper', 8],
  ['cinnamon', 5],
  ['anise', 4],
  ['clove', 5],
];

function pickKind(): Kind {
  const total = WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of WEIGHTS) if ((r -= w) <= 0) return k;
  return 'dust';
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeParticle(w: number, h: number, anywhere = true): Particle {
  const kind = pickKind();
  const z = Math.pow(Math.random(), 1.6) * 0.85 + 0.15;
  const base: Record<Kind, number> = { dust: 5, flake: 9, mustard: 3.2, cumin: 7, pepper: 4.2, cinnamon: 30, anise: 13, clove: 11 };
  const colors: Record<Kind, string[]> = {
    dust: ['#FFC300', '#FFD95C', '#FFB000'],
    flake: ['#FF3B1F', '#B80322', '#FF6A00', '#7A0010'],
    mustard: ['#5A2A10', '#8A4B24'],
    cumin: ['#9C7A4A', '#7D5C34'],
    pepper: ['#2A1712', '#3B241B'],
    cinnamon: ['#8A4B24', '#A2582B'],
    anise: ['#5B2C17', '#6E3820'],
    clove: ['#3E1F14', '#4F2A1B'],
  };
  const c = colors[kind];
  return {
    kind,
    x: rand(0, w),
    y: anywhere ? rand(0, h) : h + 40,
    z,
    size: base[kind] * rand(0.7, 1.3) * (0.5 + z * 0.8),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.6, 0.6) * (kind === 'dust' ? 0 : 1),
    vx: rand(-6, 6),
    vy: -rand(6, 22) * (0.4 + z),
    phase: rand(0, Math.PI * 2),
    color: c[Math.floor(Math.random() * c.length)],
    shape: kind === 'flake' ? Array.from({ length: 6 }, () => rand(0.55, 1.1)) : undefined,
  };
}

function draw(ctx: CanvasRenderingContext2D, p: Particle, dust: HTMLCanvasElement) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.kind === 'dust' ? 0.35 + p.z * 0.45 : 0.55 + p.z * 0.45;
  ctx.fillStyle = p.color;
  switch (p.kind) {
    case 'dust':
      ctx.drawImage(dust, -s * 2, -s * 2, s * 4, s * 4);
      break;
    case 'flake': {
      const pts = p.shape ?? [];
      ctx.beginPath();
      pts.forEach((r, i) => {
        const a = (i / pts.length) * Math.PI * 2;
        const px = Math.cos(a) * s * r;
        const py = Math.sin(a) * s * r * 0.6;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,120,0.35)';
      ctx.fillRect(-s * 0.15, -s * 0.15, s * 0.3, s * 0.3);
      break;
    }
    case 'mustard':
    case 'pepper':
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.35, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'cumin':
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, 0);
      ctx.lineTo(s * 0.8, 0);
      ctx.stroke();
      break;
    case 'cinnamon': {
      const w = s;
      const h = s * 0.22;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,20,5,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 2, -h * 0.1);
      ctx.lineTo(w / 2 - 2, -h * 0.1);
      ctx.stroke();
      ctx.fillStyle = 'rgba(60,20,5,0.55)';
      ctx.beginPath();
      ctx.ellipse(w / 2 - 1, 0, h * 0.35, h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'anise':
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(s * 0.5, 0, s * 0.5, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#C98A3C';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'clove':
      ctx.fillRect(-s * 0.1, -s * 0.2, s * 0.2, s * 0.9);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.arc(0, -s * 0.28, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
  ctx.restore();
}

interface Props {
  className?: string;
  /** Particles per 10,000 px² of canvas area */
  density?: number;
}

/**
 * Canvas field of drifting spice particles (turmeric dust, chilli flakes, seeds, cinnamon, star anise, cloves)
 * with depth-based parallax that follows the pointer, or device tilt on phones.
 * Renders a single static frame when the user prefers reduced motion; pauses when off-screen.
 */
export function SpiceField({ className, density = 0.55 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pre-render a soft turmeric dust sprite once.
    const dust = document.createElement('canvas');
    dust.width = dust.height = 64;
    const dctx = dust.getContext('2d');
    if (dctx) {
      const g = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,214,90,1)');
      g.addColorStop(0.35, 'rgba(255,195,0,0.55)');
      g.addColorStop(1, 'rgba(255,170,0,0)');
      dctx.fillStyle = g;
      dctx.fillRect(0, 0, 64, 64);
    }

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    const target = { x: 0, y: 0 };
    const offset = { x: 0, y: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.round(((w * h) / 10000) * density));
      particles = Array.from({ length: count }, () => makeParticle(w, h));
      particles.sort((a, b) => a.z - b.z);
      if (reduce) render(0);
    };

    const render = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      offset.x += (target.x - offset.x) * 0.06;
      offset.y += (target.y - offset.y) * 0.06;
      for (const p of particles) {
        if (dt) {
          p.phase += dt * 0.6;
          p.x += (p.vx + Math.sin(p.phase) * 10) * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.y < -50 || p.x < -60 || p.x > w + 60) Object.assign(p, makeParticle(w, h, false), { x: rand(0, w) });
        }
        const px = offset.x * p.z * 48;
        const py = offset.y * p.z * 36;
        const x = p.x;
        const y = p.y;
        p.x += px;
        p.y += py;
        draw(ctx, p, dust);
        p.x = x;
        p.y = y;
      }
    };

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      render(dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.x = Math.max(-1, Math.min(1, e.gamma / 30));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    resize();
    start();
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

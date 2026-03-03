import { useRef, useEffect, useCallback } from 'react';

// ── Color tokens ──────────────────────────────────────────────
const COLORS = {
  base: '#1f2937',
  safe: '#22c55e',
  risk: '#f97316',
  teal: '#00D4AA',
  edge: '#9ca3af',
};

const NODE_COLORS = [COLORS.base, COLORS.base, COLORS.safe, COLORS.safe, COLORS.risk, COLORS.teal];

// ── Configuration ─────────────────────────────────────────────
const SEED_COUNT = 8;
const MAX_NODES_DESKTOP = 50;
const MAX_NODES_MOBILE = 22;
const SPAWN_INTERVAL_MIN = 250;
const SPAWN_INTERVAL_MAX = 700;
const MOUSE_REPEL_RADIUS = 120;
const MOUSE_REPEL_FORCE = 0.8;
const DRIFT_SPEED = 0.15;
const DAMPING = 0.98;
const POP_DURATION = 250; // ms

// ── Types ─────────────────────────────────────────────────────
interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  birthTime: number;
  opacity: number;
}

interface Edge {
  from: number;
  to: number;
  opacity: number;
  birthTime: number;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function NetworkHeroAnimation({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const nextSpawnDelay = useRef(randomBetween(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX));

  // ── Helpers ───────────────────────────────────────────────
  const getMaxNodes = useCallback(() => {
    return (canvasRef.current?.width ?? 1024) < 768 ? MAX_NODES_MOBILE : MAX_NODES_DESKTOP;
  }, []);

  const createSeedNodes = useCallback((w: number, h: number) => {
    const now = performance.now();
    const nodes: Node[] = [];
    // Distribute seeds biased toward the right half of the canvas
    for (let i = 0; i < SEED_COUNT; i++) {
      nodes.push({
        x: randomBetween(w * 0.4, w * 0.95),
        y: randomBetween(h * 0.1, h * 0.9),
        vx: randomBetween(-DRIFT_SPEED, DRIFT_SPEED),
        vy: randomBetween(-DRIFT_SPEED, DRIFT_SPEED),
        radius: randomBetween(3, 6),
        color: pickRandom(NODE_COLORS),
        birthTime: now - POP_DURATION, // already fully popped
        opacity: 1,
      });
    }
    // Connect seeds
    const edges: Edge[] = [];
    for (let i = 1; i < nodes.length; i++) {
      edges.push({ from: i, to: Math.floor(Math.random() * i), opacity: 0.3, birthTime: now - POP_DURATION });
    }
    return { nodes, edges };
  }, []);

  const spawnNode = useCallback((nodes: Node[], edges: Edge[], w: number, h: number) => {
    if (nodes.length >= getMaxNodes()) return;

    const now = performance.now();
    // Prefer spawning near right-side nodes (bias toward right half)
    const rightBiased = nodes.filter(n => n.x > w * 0.35);
    const pool = rightBiased.length > 0 ? rightBiased : nodes;
    const parent = pool[Math.floor(Math.random() * pool.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = randomBetween(35, 100);
    let nx = parent.x + Math.cos(angle) * dist;
    let ny = parent.y + Math.sin(angle) * dist;
    // Nudge toward right if spawning too far left
    if (nx < w * 0.3) nx = randomBetween(w * 0.4, w * 0.7);
    nx = Math.max(10, Math.min(w - 10, nx));
    ny = Math.max(10, Math.min(h - 10, ny));

    const newNode: Node = {
      x: nx,
      y: ny,
      vx: randomBetween(-DRIFT_SPEED, DRIFT_SPEED),
      vy: randomBetween(-DRIFT_SPEED, DRIFT_SPEED),
      radius: randomBetween(2.5, 6),
      color: pickRandom(NODE_COLORS),
      birthTime: now,
      opacity: 0,
    };
    nodes.push(newNode);

    const newIdx = nodes.length - 1;
    // Connect to 1-2 nearby nodes
    const sorted = nodes
      .map((n, i) => ({ i, d: distance(n, newNode) }))
      .filter((e) => e.i !== newIdx)
      .sort((a, b) => a.d - b.d);

    const connectCount = Math.random() > 0.4 ? 2 : 1;
    for (let c = 0; c < Math.min(connectCount, sorted.length); c++) {
      edges.push({
        from: newIdx,
        to: sorted[c].i,
        opacity: randomBetween(0.15, 0.35),
        birthTime: now,
      });
    }
  }, [getMaxNodes]);

  // ── Main animation loop ───────────────────────────────────
  const animate = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const now = performance.now();
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const mouse = mouseRef.current;

    // Spawn new nodes periodically
    if (now - lastSpawnRef.current > nextSpawnDelay.current) {
      spawnNode(nodes, edges, w, h);
      lastSpawnRef.current = now;
      nextSpawnDelay.current = randomBetween(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX);
    }

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Update nodes
    for (const node of nodes) {
      // Pop-in animation
      const age = now - node.birthTime;
      if (age < POP_DURATION) {
        const t = age / POP_DURATION;
        // Ease out cubic
        node.opacity = 1 - Math.pow(1 - t, 3);
      } else {
        node.opacity = 1;
      }

      // Brownian drift
      node.vx += randomBetween(-0.02, 0.02);
      node.vy += randomBetween(-0.02, 0.02);

      // Mouse repulsion
      const dx = node.x - mouse.x;
      const dy = node.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
        const force = (1 - dist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_FORCE;
        node.vx += (dx / dist) * force;
        node.vy += (dy / dist) * force;
      }

      // Soft boundary repulsion
      const margin = 30;
      if (node.x < margin) node.vx += 0.1;
      if (node.x > w - margin) node.vx -= 0.1;
      if (node.y < margin) node.vy += 0.1;
      if (node.y > h - margin) node.vy -= 0.1;

      // Apply velocity
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx;
      node.y += node.vy;
    }

    // Draw edges
    for (const edge of edges) {
      const a = nodes[edge.from];
      const b = nodes[edge.to];
      if (!a || !b) continue;

      const edgeAge = now - edge.birthTime;
      const fadeIn = Math.min(1, edgeAge / POP_DURATION);
      const alpha = edge.opacity * fadeIn * Math.min(a.opacity, b.opacity);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(156, 163, 175, ${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      if (node.opacity <= 0) continue;

      const r = node.radius * (node.opacity < 1 ? easeOutBack(node.opacity) : 1);

      // Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 4);
      glow.addColorStop(0, hexToRgba(node.color, 0.25 * node.opacity));
      glow.addColorStop(1, hexToRgba(node.color, 0));
      ctx.fillStyle = glow;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(node.color, node.opacity);
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(node.x - r * 0.25, node.y - r * 0.25, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.3 * node.opacity})`;
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(() => animate(ctx, w, h));
  }, [spawnNode]);

  // ── Setup & resize ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Reinitialize nodes if empty
      if (nodesRef.current.length === 0) {
        const { nodes, edges } = createSeedNodes(rect.width, rect.height);
        nodesRef.current = nodes;
        edgesRef.current = edges;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Burst: immediately spawn a cluster of nodes so it looks populated from the start
    const rect = canvas.getBoundingClientRect();
    const burstCount = rect.width < 768 ? 8 : 18;
    for (let i = 0; i < burstCount; i++) {
      spawnNode(nodesRef.current, edgesRef.current, rect.width, rect.height);
    }

    // Start animation
    lastSpawnRef.current = performance.now();
    rafRef.current = requestAnimationFrame(() => animate(ctx, rect.width, rect.height));

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [animate, createSeedNodes]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
    />
  );
}

// ── Utilities ───────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function easeOutBack(t: number): number {
  const c = 1.2;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

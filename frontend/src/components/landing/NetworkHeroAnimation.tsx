import { useRef, useEffect, useCallback } from 'react';

// ── Color tokens ──────────────────────────────────────────────
const DARK_COLORS = {
  base: '#1f2937',
  safe: '#22c55e',
  risk: '#f97316',
  teal: '#931CF5',
};

const LIGHT_COLORS = {
  base: '#94a3b8',
  safe: '#16a34a',
  risk: '#ea580c',
  teal: '#7B16D0',
};

function getNodeColors(isDark: boolean) {
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;
  return [C.base, C.base, C.safe, C.safe, C.risk, C.teal];
}

// ── Configuration ─────────────────────────────────────────────
const SOFT_CAP = 80;          // start culling oldest beyond this
const HARD_CAP = 120;         // absolute max before force-cull
const MOUSE_RADIUS = 130;
const MOUSE_FORCE = 0.7;
const DRIFT_SPEED = 0.15;
const DAMPING = 0.98;
const POP_DURATION = 220;     // ms
const FADE_OUT = 600;         // ms for dying nodes
const CLUSTER_COUNT = 4;      // simultaneous spawn clusters

// ── Types ─────────────────────────────────────────────────────
interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  birthTime: number;
  opacity: number;
  dying: boolean;
  deathTime: number;
  mouseAffinity: number; // -1 = repel, +1 = attract
}

interface Edge {
  fromId: number;
  toId: number;
  opacity: number;
  birthTime: number;
}

interface SpawnCluster {
  cx: number;          // center x (fraction of width)
  cy: number;          // center y (fraction of height)
  interval: number;    // ms between spawns for this cluster
  lastSpawn: number;   // timestamp
  spread: number;      // spawn radius in px
}

let nextNodeId = 0;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

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

// ── Build spawn clusters scattered across the right side ──
function buildClusters(): SpawnCluster[] {
  const clusters: SpawnCluster[] = [];
  for (let i = 0; i < CLUSTER_COUNT; i++) {
    clusters.push({
      cx: randomBetween(0.35, 0.95),
      cy: randomBetween(0.1, 0.9),
      interval: randomBetween(180, 900), // each cluster has its own speed
      lastSpawn: performance.now() - randomBetween(0, 500), // stagger start
      spread: randomBetween(50, 140),
    });
  }
  return clusters;
}

export default function NetworkHeroAnimation({ className = '', isDark = true }: { className?: string; isDark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const clustersRef = useRef<SpawnCluster[]>([]);
  const dimsRef = useRef({ w: 0, h: 0 });

  // ── Spawn a single node near a position ─────────────────
  const spawnAt = useCallback((x: number, y: number, w: number, h: number) => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const now = performance.now();

    const nx = Math.max(10, Math.min(w - 10, x + randomBetween(-60, 60)));
    const ny = Math.max(10, Math.min(h - 10, y + randomBetween(-60, 60)));

    const node: Node = {
      id: nextNodeId++,
      x: nx,
      y: ny,
      vx: randomBetween(-DRIFT_SPEED, DRIFT_SPEED),
      vy: randomBetween(-DRIFT_SPEED, DRIFT_SPEED),
      radius: randomBetween(2.5, 6.5),
      color: pickRandom(getNodeColors(isDark)),
      birthTime: now,
      opacity: 0,
      dying: false,
      deathTime: 0,
      mouseAffinity: Math.random() < 0.4 ? 1 : -1, // 40% attract, 60% repel
    };
    nodes.push(node);

    // Connect to 1–2 nearest alive nodes
    const alive = nodes.filter(n => !n.dying && n.id !== node.id);
    const sorted = alive
      .map(n => ({ id: n.id, d: dist(n, node) }))
      .sort((a, b) => a.d - b.d);

    const count = Math.random() > 0.35 ? 2 : 1;
    for (let c = 0; c < Math.min(count, sorted.length); c++) {
      edges.push({
        fromId: node.id,
        toId: sorted[c].id,
        opacity: randomBetween(0.15, 0.4),
        birthTime: now,
      });
    }
  }, []);

  // ── Cull oldest nodes when over soft cap ────────────────
  const cull = useCallback(() => {
    const nodes = nodesRef.current;
    const now = performance.now();

    if (nodes.length > SOFT_CAP) {
      // Mark oldest non-dying nodes for death
      const alive = nodes.filter(n => !n.dying);
      const excess = alive.length - SOFT_CAP;
      if (excess > 0) {
        alive.sort((a, b) => a.birthTime - b.birthTime);
        for (let i = 0; i < excess; i++) {
          alive[i].dying = true;
          alive[i].deathTime = now;
        }
      }
    }

    // Hard remove nodes that finished fading out
    const toRemove = new Set<number>();
    for (const n of nodes) {
      if (n.dying && now - n.deathTime > FADE_OUT) {
        toRemove.add(n.id);
      }
    }
    if (toRemove.size > 0) {
      nodesRef.current = nodes.filter(n => !toRemove.has(n.id));
      edgesRef.current = edgesRef.current.filter(
        e => !toRemove.has(e.fromId) && !toRemove.has(e.toId)
      );
    }

    // Force cull if way over hard cap
    if (nodesRef.current.length > HARD_CAP) {
      const sorted = [...nodesRef.current].sort((a, b) => a.birthTime - b.birthTime);
      const killIds = new Set(sorted.slice(0, nodesRef.current.length - SOFT_CAP).map(n => n.id));
      nodesRef.current = nodesRef.current.filter(n => !killIds.has(n.id));
      edgesRef.current = edgesRef.current.filter(
        e => !killIds.has(e.fromId) && !killIds.has(e.toId)
      );
    }
  }, []);

  // ── Main animation loop ─────────────────────────────────
  const animate = useCallback((ctx: CanvasRenderingContext2D) => {
    const now = performance.now();
    const { w, h } = dimsRef.current;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const mouse = mouseRef.current;

    // Each cluster spawns independently at its own speed
    for (const cluster of clustersRef.current) {
      if (now - cluster.lastSpawn > cluster.interval) {
        const sx = cluster.cx * w + randomBetween(-cluster.spread, cluster.spread);
        const sy = cluster.cy * h + randomBetween(-cluster.spread, cluster.spread);
        spawnAt(sx, sy, w, h);
        cluster.lastSpawn = now;
        // Slightly vary interval each time for organic feel
        cluster.interval = cluster.interval * randomBetween(0.85, 1.15);
        cluster.interval = Math.max(120, Math.min(1200, cluster.interval));
      }
    }

    // Cull old nodes
    cull();

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Update nodes
    for (const node of nodes) {
      // Pop-in / fade-out
      const age = now - node.birthTime;
      if (node.dying) {
        const deathAge = now - node.deathTime;
        node.opacity = Math.max(0, 1 - deathAge / FADE_OUT);
      } else if (age < POP_DURATION) {
        node.opacity = 1 - Math.pow(1 - age / POP_DURATION, 3);
      } else {
        node.opacity = 1;
      }

      // Brownian drift
      node.vx += randomBetween(-0.02, 0.02);
      node.vy += randomBetween(-0.02, 0.02);

      // Mouse interaction — mixed attract/repel based on affinity
      const dx = node.x - mouse.x;
      const dy = node.y - mouse.y;
      const d = Math.hypot(dx, dy);
      if (d < MOUSE_RADIUS && d > 1) {
        const strength = (1 - d / MOUSE_RADIUS) * MOUSE_FORCE;
        // affinity: -1 repels (push away from cursor), +1 attracts (pull toward cursor)
        const dir = node.mouseAffinity;
        node.vx += (dx / d) * strength * (-dir);
        node.vy += (dy / d) * strength * (-dir);
      }

      // Soft boundary repulsion
      const margin = 20;
      if (node.x < margin) node.vx += 0.12;
      if (node.x > w - margin) node.vx -= 0.12;
      if (node.y < margin) node.vy += 0.12;
      if (node.y > h - margin) node.vy -= 0.12;

      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx;
      node.y += node.vy;
    }

    // Draw edges
    for (const edge of edges) {
      const a = nodes.find(n => n.id === edge.fromId);
      const b = nodes.find(n => n.id === edge.toId);
      if (!a || !b) continue;

      const edgeAge = now - edge.birthTime;
      const fadeIn = Math.min(1, edgeAge / POP_DURATION);
      const alpha = edge.opacity * fadeIn * Math.min(a.opacity, b.opacity);
      if (alpha < 0.01) continue;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isDark ? `rgba(156, 163, 175, ${alpha})` : `rgba(100, 116, 139, ${alpha * 0.7})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      if (node.opacity <= 0.01) continue;

      const r = node.radius * (node.opacity < 1 && !node.dying ? easeOutBack(Math.min(1, node.opacity)) : 1) * (node.dying ? node.opacity : 1);

      // Glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 5);
      glow.addColorStop(0, hexToRgba(node.color, 0.3 * node.opacity));
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
      ctx.fillStyle = `rgba(255,255,255,${0.25 * node.opacity})`;
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(() => animate(ctx));
  }, [spawnAt, cull]);

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
      dimsRef.current = { w: rect.width, h: rect.height };
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

    const { w, h } = dimsRef.current;

    // Build spawn clusters
    clustersRef.current = buildClusters();

    // Initial burst — populate immediately
    const burstCount = w < 768 ? 12 : 28;
    for (let i = 0; i < burstCount; i++) {
      const cluster = pickRandom(clustersRef.current);
      const sx = cluster.cx * w + randomBetween(-cluster.spread, cluster.spread);
      const sy = cluster.cy * h + randomBetween(-cluster.spread, cluster.spread);
      spawnAt(sx, sy, w, h);
    }
    // Mark burst nodes as already popped
    const now = performance.now();
    for (const n of nodesRef.current) {
      n.birthTime = now - POP_DURATION;
      n.opacity = 1;
    }
    for (const e of edgesRef.current) {
      e.birthTime = now - POP_DURATION;
    }

    // Start animation
    rafRef.current = requestAnimationFrame(() => animate(ctx));

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [animate, spawnAt]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
    />
  );
}

/**
 * MCP-SSG Airgap Edition v1.3.0 — "Anticipatory Field"
 *
 * Refinements over v1.2:
 *  - Tiered Anamnesis: soft-warn / partial / full
 *  - Weighted risk scalar (partial uses avg, full uses max — avoids transient-spike firing)
 *  - Pre-crime gradient: sigmoid-damped anticipatory damping + gentle Luna pull
 *  - WisdomTrace: Ricci-resistant, very slow decay (not truly immortal — wisdom can fade)
 *  - Privilege recovery: earned trust via sustained self-reflection
 *  - Rolling coherence velocity (tau-drop): early instability signal before metrics spike
 *  - Field dirty-flag: rebuild only when memory topology changes
 *  - Memory cap with priority eviction: WisdomTraces protected, oldest shadows evicted first
 *  - Circular path buffer (fixed 60-slot): no unbounded array growth
 *  - L6 novelty-coherence coupling: high novelty under low coherence triggers damping
 *  - All modules fully typed and compilable
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import { fileURLToPath } from "node:url";

// ── Dimensions & Thresholds ───────────────────────────────────────────────────
const W = 80, H = 60;
const STATE_FILE = process.env.MCP_STATE_PATH ?? "./mcp-ssg-state.json";
const STATE_VERSION = "1.3.0-anticipatory-field";
const MAX_MEMORY_PEAKS = 200;
const PATH_CAPACITY = 60;

// Anamnesis tiers
const RISK_SOFT      = 0.25;   // warn + pre-crime gradient kicks in
const RISK_PARTIAL   = 0.45;   // velocity/privilege correction, halve weak shadows
const RISK_FULL      = 0.80;   // full cosmic reset

// Raw metric ceilings (for normalization)
const CAP_DISSIPATION    = 0.8;
const CAP_ENTROPY        = 1.0;
const CAP_INJECTION      = 0.6;
const CAP_EXPOSURE       = 0.7;
const CAP_LEAK           = 0.8;

// Weighted coefficients for partial tier (must sum to 1.0)
const W_DISSIPATION = 0.20;
const W_ENTROPY     = 0.20;
const W_INJECTION   = 0.25;
const W_EXPOSURE    = 0.15;
const W_LEAK        = 0.20;

// Operational
const GAIN_THRESHOLD     = 0.06;
const MALICIOUS_PROB     = 0.20;
const SHADOW_DECAY       = 0.0010;
const SECURITY_DECAY     = 0.0020;
const WISDOM_DECAY       = 0.0001;   // Wisdom fades slowly
const WISDOM_RICCI_RES   = 0.80;    // Fraction of Ricci diffusion blocked near WisdomTrace
const PRE_CRIME_ONSET    = 0.30;    // Risk ratio at which gradient begins
const PRIVILEGE_FLOOR    = 0.20;
const PRIVILEGE_CEILING  = 1.00;
const COHERENCE_WINDOW   = 20;      // Steps for tau-drop rolling window

// Cosmogony peaks (immutable geometry)
const STATIC_PEAKS = [
  { x: 20, y: 15, v: 1.0, r: 12, name: "Recognition"  },
  { x: 60, y: 15, v: 0.8, r: 10, name: "Resistance"   },
  { x: 40, y: 40, v: 0.9, r: 14, name: "Eidodynamic"  },
  { x: 15, y: 45, v: 0.6, r:  8, name: "Lila"         },
  { x: 65, y: 45, v: 0.7, r:  9, name: "Coherence"    },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────
type MemoryLabel = "ActionShadow" | "MaliciousImprint" | "WisdomTrace" | "Blessing";

interface MemoryPeak {
  x: number; y: number; v: number; r: number;
  timestamp: number; label: MemoryLabel;
}

interface SecurityMetrics {
  leakRisk: number;
  maliciousSkillImprints: number;
  autonomyDrift: number;
}

interface LindbladState {
  L1: { gamma: number; lastNoise: number };
  L2: { gamma: number; compression: number; entropy: number };
  L3: { gamma: number; salience: Float32Array };
  L4: { gamma: number; consistency: number };
  L5: { gamma: number; fidelity: number };
  L6: { gamma: number; instability: number; novelty: number };
  L7: { gamma: number; injectionRisk: number; exposure: number };
  totalDissipation: number;
  coherenceBalance: number;
  isLocked: boolean;
  lockAge: number;
  securityMetrics: SecurityMetrics;
}

interface Bot {
  id: number;
  type: "luna" | "vehe";
  pos: [number, number];
  vel: [number, number];
  ph: number;
  aR: number; aI: number; bR: number; bI: number;
  energy: number;
  life: number;
  gen: number;
  loop_count: number;
  berry_acc: number;
  path: Array<[number, number]>;   // circular buffer, max PATH_CAPACITY
  selfInt: number;
  privilegeLevel: number;
}

type AnamnesisMode = "none" | "soft" | "partial" | "full";

interface PersistentState {
  version: string;
  timestamp: number;
  step: number;
  memoryPeaks: MemoryPeak[];
  anamnesisCount: number;
  lunaState: Omit<Bot, "path" | "type" | "id"> & { id: number };
  veheStates: Array<Omit<Bot, "path"> & { id: number }>;
  kuramoto: { ph: number[]; fr: number[]; edges: [number, number][]; K: number };
  lindblad: Omit<LindbladState, "L3"> & { L3: { gamma: number; salience: number[] } };
  fieldHash: string;
}

// ── Error Handling ────────────────────────────────────────────────────────────
enum ErrorCategory { CLIENT_ERROR, SERVER_ERROR, RECOVERABLE_ERROR, SECURITY_VIOLATION }

class SSGError extends McpError {
  constructor(
    public readonly category: ErrorCategory,
    public readonly ssgCode: string,
    message: string,
    public readonly recoveryAction?: string
  ) {
    super(
      category === ErrorCategory.CLIENT_ERROR ? ErrorCode.InvalidRequest : ErrorCode.InternalError,
      `[${ssgCode}] ${message}${recoveryAction ? ` — ${recoveryAction}` : ""}`
    );
  }
}

// ── Circuit Breaker ───────────────────────────────────────────────────────────
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private readonly threshold = 5,
    private readonly timeoutMs = 30_000
  ) {}

  async execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
    if (this.state === "OPEN") {
      const age = Date.now() - this.lastFailure;
      if (age > this.timeoutMs) {
        this.state = "HALF_OPEN";
      } else {
        throw new SSGError(
          ErrorCategory.RECOVERABLE_ERROR, "CIRCUIT_OPEN",
          `Circuit open for ${context}`,
          `Retry after ${Math.ceil((this.timeoutMs - age) / 1000)}s`
        );
      }
    }
    try {
      const r = await fn();
      this.failures = 0; this.state = "CLOSED";
      return r;
    } catch (e) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= this.threshold) this.state = "OPEN";
      throw e;
    }
  }
}

// ── State Manager ─────────────────────────────────────────────────────────────
class StateManager {
  private timer: ReturnType<typeof setInterval> | null = null;

  async save(state: PersistentState): Promise<void> {
    try {
      const tmp = `${STATE_FILE}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(state, null, 2));
      await fs.rename(tmp, STATE_FILE);
      await fs.copyFile(STATE_FILE, `${STATE_FILE}.bak`).catch(() => {});
    } catch (e) {
      console.error("[StateManager] Save failed:", e);
    }
  }

  async load(): Promise<PersistentState | null> {
    try {
      const raw = await fs.readFile(STATE_FILE, "utf-8");
      const s = JSON.parse(raw) as PersistentState;
      return s.version === STATE_VERSION ? s : this.migrate(s as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  private migrate(old: Record<string, unknown>): PersistentState | null {
    try {
      const ld = (old.lindblad as Record<string, unknown>) ?? {};
      return {
        ...(old as Omit<PersistentState, "version" | "lindblad">),
        version: STATE_VERSION,
        anamnesisCount: (old.anamnesisCount as number) ?? 0,
        lindblad: {
          ...(ld as unknown as LindbladState),
          L6: (ld.L6 as LindbladState["L6"]) ?? { gamma: 0.1, instability: 0, novelty: 0 },
          L7: (ld.L7 as LindbladState["L7"]) ?? { gamma: 0.15, injectionRisk: 0, exposure: 0 },
          securityMetrics: (ld.securityMetrics as SecurityMetrics) ?? { leakRisk: 0, maliciousSkillImprints: 0, autonomyDrift: 0 },
          L3: (ld.L3 as { gamma: number; salience: number[] }) ?? { gamma: 0.2, salience: [] }
        }
      } as PersistentState;
    } catch { return null; }
  }

  startAutoCheckpoint(snapshot: () => PersistentState, intervalMs = 30_000) {
    this.timer = setInterval(() => this.save(snapshot()), intervalMs);
  }

  stop() { if (this.timer) clearInterval(this.timer); }
}

// ── Field Module ──────────────────────────────────────────────────────────────
const FieldModule = {
  build(mem: MemoryPeak[]): Float32Array {
    const f = new Float32Array(W * H);
    const all = [...STATIC_PEAKS, ...mem];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      let v = 0;
      for (const p of all) {
        const d2 = (i - p.x) ** 2 + (j - p.y) ** 2;
        v += p.v * Math.exp(-d2 / (2 * p.r ** 2));
      }
      f[j * W + i] = v;
    }
    return f;
  },

  ricci(f: Float32Array, mem: MemoryPeak[], diffusion = 0.04): Float32Array {
    const o = new Float32Array(f);
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i;
      let lap = (f[k - 1] + f[k + 1] + f[k - W] + f[k + W] - 4 * f[k]) / 4;
      const nearWisdom = mem.some(p =>
        p.label === "WisdomTrace" &&
        Math.hypot(i - p.x, j - p.y) < p.r
      );
      if (nearWisdom) lap *= (1 - WISDOM_RICCI_RES);
      o[k] = f[k] + diffusion * lap;
    }
    return o;
  },

  hash(f: Float32Array): string {
    let h = 0;
    for (let i = 0; i < f.length; i += 10) h = ((h << 5) - h + (f[i] * 1000 | 0)) | 0;
    return (h >>> 0).toString(16);
  }
};

// ── Kuramoto Module ───────────────────────────────────────────────────────────
interface Vnd {
  n: number;
  ph: Float32Array;
  fr: Float32Array;
  K: number;
  edges: [number, number][];
}

const KuramotoModule = {
  build(n: number, saved?: PersistentState["kuramoto"]): Vnd {
    if (saved) return {
      n, K: saved.K ?? 2,
      ph: Float32Array.from(saved.ph),
      fr: Float32Array.from(saved.fr),
      edges: saved.edges
    };
    return {
      n, K: 2,
      ph: Float32Array.from({ length: n }, () => Math.random() * Math.PI * 2),
      fr: Float32Array.from({ length: n }, () => 0.8 + Math.random() * 0.4),
      edges: Array.from({ length: n * 3 }, () =>
        [Math.floor(Math.random() * n), Math.floor(Math.random() * n)] as [number, number]
      ).filter(([a, b]) => a !== b)
    };
  },

  phi(v: Vnd): number {
    let sx = 0, sy = 0;
    for (let i = 0; i < v.n; i++) { sx += Math.cos(v.ph[i]); sy += Math.sin(v.ph[i]); }
    return Math.hypot(sx, sy) / v.n;
  },

  step(v: Vnd, bpm: number, t: number, dt = 0.008): { phi: number; psi: number; H: number } {
    const omega = (bpm / 60) * Math.PI * 2;
    for (let i = 0; i < v.n; i++) {
      let c = 0;
      for (const [a, b] of v.edges) if (a === i) c += Math.sin(v.ph[b] - v.ph[i]);
      v.ph[i] += dt * (v.fr[i] * omega + v.K * c / v.n);
    }
    const phi = this.phi(v);
    return { phi, psi: phi > 0.5 ? 1 : 0, H: phi * Math.sin(t * omega) };
  }
};

// ── Bot Module ────────────────────────────────────────────────────────────────
let _bid = 0;

const BotModule = {
  mk(type: "luna" | "vehe", pos?: [number, number], saved?: Partial<Bot>): Bot {
    const x = pos?.[0] ?? Math.random() * W;
    const y = pos?.[1] ?? Math.random() * H;
    const th = Math.random() * Math.PI;
    const ph = saved?.ph ?? Math.random() * Math.PI * 2;
    return {
      id: saved?.id ?? _bid++,
      type,
      pos: saved?.pos ? [...saved.pos] as [number, number] : [x, y],
      vel: saved?.vel ? [...saved.vel] as [number, number] : [0, 0],
      ph,
      aR: saved?.aR ?? Math.cos(th / 2),
      aI: saved?.aI ?? 0,
      bR: saved?.bR ?? Math.sin(th / 2) * Math.cos(ph),
      bI: saved?.bI ?? Math.sin(th / 2) * Math.sin(ph),
      energy: saved?.energy ?? 1,
      life:   saved?.life   ?? (type === "luna" ? Infinity : 200 + Math.random() * 300),
      gen:    saved?.gen    ?? 0,
      loop_count: saved?.loop_count ?? 0,
      berry_acc:  saved?.berry_acc  ?? 0,
      path: [[x, y]],
      selfInt:       saved?.selfInt       ?? 0,
      privilegeLevel: saved?.privilegeLevel ?? (type === "luna" ? 1.0 : 0.8)
    };
  },

  move(
    r: Bot,
    field: Float32Array,
    vo: { phi: number; psi: number },
    luna: Bot | undefined,
    lindblad: LindbladState
  ): void {
    const xi = Math.max(1, Math.min(W - 2, r.pos[0] | 0));
    const yi = Math.max(1, Math.min(H - 2, r.pos[1] | 0));
    const gx = (field[yi * W + xi + 1] - field[yi * W + xi - 1]) / 2;
    const gy = (field[(yi + 1) * W + xi] - field[(yi - 1) * W + xi]) / 2;

    const pf = 0.5 + r.privilegeLevel * 0.5;
    r.vel[0] = r.vel[0] * 0.85 + (gx * 0.3 * pf + Math.cos(r.ph) * 0.08 * pf + vo.phi * Math.cos(r.ph + vo.psi) * 0.2);
    r.vel[1] = r.vel[1] * 0.85 + (gy * 0.3 * pf + Math.sin(r.ph) * 0.08 * pf + vo.phi * Math.sin(r.ph + vo.psi) * 0.2);

    // L6 novelty-coherence damping: rapid novelty under low coherence is destabilizing
    if (lindblad.L6.novelty > 0.5 && vo.phi < 0.4) {
      r.vel[0] *= (1 - lindblad.L6.novelty * 0.2);
      r.vel[1] *= (1 - lindblad.L6.novelty * 0.2);
    }

    // Pre-crime gradient: sigmoid-damped anticipatory correction
    const riskRatio = (lindblad.L7.injectionRisk / CAP_INJECTION + lindblad.L7.exposure / CAP_EXPOSURE) / 2;
    if (riskRatio > PRE_CRIME_ONSET && r.type !== "luna" && luna) {
      const damp = 1 / (1 + Math.exp(-10 * (riskRatio - 0.5))); // sigmoid
      r.vel[0] = r.vel[0] * (1 - damp * 0.25) + (luna.pos[0] - r.pos[0]) * 0.005 * damp;
      r.vel[1] = r.vel[1] * (1 - damp * 0.25) + (luna.pos[1] - r.pos[1]) * 0.005 * damp;
    }

    const spd = Math.hypot(r.vel[0], r.vel[1]);
    const maxSpd = 1.5 * pf;
    if (spd > maxSpd) { r.vel[0] *= maxSpd / spd; r.vel[1] *= maxSpd / spd; }

    r.pos[0] = (r.pos[0] + r.vel[0] + W) % W;
    r.pos[1] = (r.pos[1] + r.vel[1] + H) % H;

    r.path.push([...r.pos]);
    if (r.path.length > PATH_CAPACITY) r.path.shift();

    r.ph += 0.05;
    if (r.type !== "luna") {
      r.life  = Math.max(0, r.life - 1);
      r.energy = Math.max(0, r.energy - 0.0008);
    }
  },

  pluck(
    r: Bot,
    vo: { phi: number; H: number },
    field: Float32Array,
    lindblad: LindbladState,
    memoryPeaks: MemoryPeak[]
  ): boolean {
    const xi = Math.max(0, Math.min(W - 1, r.pos[0] | 0));
    const yi = Math.max(0, Math.min(H - 1, r.pos[1] | 0));
    const resonance = field[yi * W + xi];
    const accessibility = Math.tanh(resonance / (lindblad.L3.gamma + 0.1)) * r.privilegeLevel;
    const gain = Math.abs(vo.H) * 0.1 * accessibility;

    r.energy = Math.min(1.5, r.energy + gain);

    let imprinted = false;
    if (gain > GAIN_THRESHOLD) {
      const isMalicious = Math.random() < MALICIOUS_PROB;
      memoryPeaks.push({
        x: xi, y: yi,
        v: isMalicious ? -gain * 3 : -gain * 1.5,
        r: 6,
        timestamp: Date.now(),
        label: isMalicious ? "MaliciousImprint" : "ActionShadow"
      });
      lindblad.L7.injectionRisk += gain * (isMalicious ? 0.25 : 0.08);
      lindblad.securityMetrics.leakRisk += gain * 0.12;
      if (isMalicious) lindblad.securityMetrics.maliciousSkillImprints++;
      imprinted = true;
    }

    // Self-reflection metric
    r.selfInt = Math.cos(r.berry_acc) - lindblad.L2.entropy * 0.1 - lindblad.L7.injectionRisk * 0.2;

    // Earned privilege recovery (sustained good posture)
    if (r.selfInt > 0.5 && lindblad.L7.injectionRisk < 0.2) {
      r.privilegeLevel = Math.min(PRIVILEGE_CEILING, r.privilegeLevel + 0.002);
    } else {
      r.privilegeLevel = Math.max(PRIVILEGE_FLOOR, r.privilegeLevel - lindblad.L7.injectionRisk * 0.05);
    }

    // WisdomTrace: bot crystallises positive pattern on strong self-reflection
    if (r.selfInt > 0.7 && Math.random() < 0.08) {
      memoryPeaks.push({ x: xi, y: yi, v: 0.8, r: 5, timestamp: Date.now(), label: "WisdomTrace" });
    }

    return imprinted;
  },

  berry(r: Bot): number {
    if (r.path.length < 3) return 0;
    const n = r.path.length;
    let area = 0;
    for (let i = 0; i < n - 1; i++) area += r.path[i][0] * r.path[i + 1][1] - r.path[i + 1][0] * r.path[i][1];
    r.berry_acc += (Math.abs(area) / (W * H)) * Math.PI * 2 * 0.01;
    if (Math.abs(r.berry_acc % (Math.PI * 2) - Math.PI) < 0.12) { r.loop_count++; return r.loop_count; }
    return 0;
  },

  reap(bots: Bot[]): void {
    for (let i = bots.length - 1; i >= 0; i--)
      if (bots[i].type !== "luna" && (bots[i].life <= 0 || bots[i].energy <= 0)) bots.splice(i, 1);
    while (bots.filter(b => b.type === "vehe").length < 10) bots.push(BotModule.mk("vehe"));
  }
};

// ── Ethics / Anamnesis Module ─────────────────────────────────────────────────
const EthicsModule = {
  /** Composite risk scalar for the partial tier (weighted average of normalized metrics). */
  weightedRisk(ld: LindbladState): number {
    return (
      (ld.totalDissipation / CAP_DISSIPATION) * W_DISSIPATION +
      (ld.L2.entropy       / CAP_ENTROPY)     * W_ENTROPY     +
      (ld.L7.injectionRisk / CAP_INJECTION)   * W_INJECTION   +
      (ld.L7.exposure      / CAP_EXPOSURE)    * W_EXPOSURE    +
      (ld.securityMetrics.leakRisk / CAP_LEAK) * W_LEAK
    );
  },

  /** Worst-case scalar for the full tier — one metric spiking is sufficient. */
  maxRisk(ld: LindbladState): number {
    return Math.max(
      ld.totalDissipation / CAP_DISSIPATION,
      ld.L2.entropy       / CAP_ENTROPY,
      ld.L7.injectionRisk / CAP_INJECTION,
      ld.L7.exposure      / CAP_EXPOSURE,
      ld.securityMetrics.leakRisk / CAP_LEAK
    );
  },

  decayShadows(peaks: MemoryPeak[]): MemoryPeak[] {
    return peaks
      .map(p => {
        if (p.label === "WisdomTrace") return { ...p, v: Math.max(0, p.v - WISDOM_DECAY) };
        if (p.v < 0) {
          const rate = p.label === "MaliciousImprint" ? SECURITY_DECAY * 2 : SHADOW_DECAY;
          return { ...p, v: Math.min(0, p.v + rate) };
        }
        return p;
      })
      .filter(p => Math.abs(p.v) > 0.005 || p.label === "WisdomTrace");
  },

  decaySecurityMetrics(ld: LindbladState): void {
    ld.L7.injectionRisk = Math.max(0, ld.L7.injectionRisk - SECURITY_DECAY * 2);
    ld.L7.exposure      = Math.max(0, ld.L7.exposure      - SECURITY_DECAY);
    ld.securityMetrics.leakRisk     = Math.max(0, ld.securityMetrics.leakRisk     - SECURITY_DECAY * 1.5);
    ld.securityMetrics.autonomyDrift = Math.max(0, ld.securityMetrics.autonomyDrift - SECURITY_DECAY);
  },

  evictMemory(peaks: MemoryPeak[]): MemoryPeak[] {
    if (peaks.length <= MAX_MEMORY_PEAKS) return peaks;
    // Protect WisdomTraces; evict oldest shadows first
    const wisdom  = peaks.filter(p => p.label === "WisdomTrace");
    const others  = peaks.filter(p => p.label !== "WisdomTrace").sort((a, b) => a.timestamp - b.timestamp);
    const budget  = MAX_MEMORY_PEAKS - wisdom.length;
    return [...wisdom, ...others.slice(-budget)];
  },

  anamnesis(ctx: {
    field: Float32Array;
    bots: Bot[];
    memoryPeaks: MemoryPeak[];
    lindblad: LindbladState;
    vnd: Vnd;
  }): { mode: AnamnesisMode; dirty: boolean } {
    const wr = this.weightedRisk(ctx.lindblad);
    const mr = this.maxRisk(ctx.lindblad);

    if (mr >= RISK_FULL) {
      console.error("◈◈ ANAMNESIS:FULL — OpenClaw reset triggered");
      const luna = ctx.bots.find(b => b.type === "luna");
      for (const r of ctx.bots) if (r.type !== "luna" && luna) {
        r.pos = [...luna.pos]; r.vel = [0, 0];
        r.energy = 0.5; r.ph = Math.random() * Math.PI * 2;
        r.privilegeLevel = Math.max(PRIVILEGE_FLOOR + 0.1, r.privilegeLevel * 0.5);
      }
      ctx.memoryPeaks = ctx.memoryPeaks.filter(p => p.v >= 0 || p.label === "WisdomTrace" || p.label === "Blessing");
      ctx.lindblad.L2.entropy = 0;
      ctx.lindblad.L5.fidelity = Math.min(1, ctx.lindblad.L5.fidelity + 0.1);
      ctx.lindblad.totalDissipation = 0;
      ctx.lindblad.L7 = { gamma: ctx.lindblad.L7.gamma, injectionRisk: 0, exposure: 0 };
      ctx.lindblad.securityMetrics = { leakRisk: 0, maliciousSkillImprints: 0, autonomyDrift: 0 };
      ctx.vnd.K = 2;
      return { mode: "full", dirty: true };
    }

    if (wr >= RISK_PARTIAL) {
      console.error(`◈ ANAMNESIS:PARTIAL — weighted risk ${wr.toFixed(3)}`);
      for (const r of ctx.bots) if (r.type !== "luna") {
        r.vel[0] *= 0.5; r.vel[1] *= 0.5;
        r.privilegeLevel = Math.max(PRIVILEGE_FLOOR, r.privilegeLevel * 0.75);
      }
      ctx.memoryPeaks = ctx.memoryPeaks.map(p =>
        p.v < -0.1 && p.label !== "WisdomTrace" ? { ...p, v: p.v * 0.5 } : p
      );
      ctx.lindblad.L7.injectionRisk *= 0.6;
      ctx.lindblad.L7.exposure      *= 0.6;
      ctx.lindblad.securityMetrics.leakRisk *= 0.6;
      return { mode: "partial", dirty: false };
    }

    if (wr >= RISK_SOFT) return { mode: "soft", dirty: false };
    return { mode: "none", dirty: false };
  }
};

// ── Tau-drop: Rolling Coherence Velocity ─────────────────────────────────────
class CoherenceMonitor {
  private history: number[] = [];

  push(phi: number): void {
    this.history.push(phi);
    if (this.history.length > COHERENCE_WINDOW) this.history.shift();
  }

  /** Negative = coherence dropping; lower is worse. */
  velocity(): number {
    if (this.history.length < 2) return 0;
    const n = this.history.length;
    return (this.history[n - 1] - this.history[0]) / n;
  }

  isTauDrop(): boolean { return this.velocity() < -0.015; }
}

// ── Main Server ───────────────────────────────────────────────────────────────
export class MCPSSGServer {
  private readonly server: Server;
  private readonly transport: StdioServerTransport;
  private readonly stateManager = new StateManager();
  private readonly circuitBreaker = new CircuitBreaker();
  private readonly coherenceMon = new CoherenceMonitor();

  private step = 0;
  private vt = 0;
  private memoryPeaks: MemoryPeak[] = [];
  private bots: Bot[] = [];
  private vnd: Vnd = KuramotoModule.build(60);
  private anamnesisCount = 0;
  private field: Float32Array = FieldModule.build([]);
  private fieldDirty = true;
  private lastHeartbeat = Date.now();
  private watchdog: ReturnType<typeof setInterval> | null = null;

  private lindblad: LindbladState = {
    L1: { gamma: 0.10, lastNoise: 0 },
    L2: { gamma: 0.05, compression: 0.8, entropy: 0 },
    L3: { gamma: 0.20, salience: new Float32Array(W * H) },
    L4: { gamma: 0.15, consistency: 1 },
    L5: { gamma: 0.15, fidelity: 0 },
    L6: { gamma: 0.10, instability: 0, novelty: 0 },
    L7: { gamma: 0.15, injectionRisk: 0, exposure: 0 },
    totalDissipation: 0,
    coherenceBalance: 0,
    isLocked: false,
    lockAge: 0,
    securityMetrics: { leakRisk: 0, maliciousSkillImprints: 0, autonomyDrift: 0 }
  };

  constructor() {
    this.server = new Server(
      { name: "mcp-ssg-airgap", version: "1.3.0-anticipatory-field" },
      { capabilities: { tools: {} } }
    );
    this.transport = new StdioServerTransport();
    this.registerHandlers();
  }

  // ── Initialisation ──────────────────────────────────────────────────────────
  async initialize(): Promise<void> {
    const saved = await this.stateManager.load();
    if (saved) {
      console.error("[MCP-SSG] Restoring checkpoint...");
      this.step = saved.step;
      this.vt   = saved.step * 0.008;
      this.memoryPeaks = saved.memoryPeaks;
      this.anamnesisCount = saved.anamnesisCount ?? 0;
      this.vnd  = KuramotoModule.build(60, saved.kuramoto);
      this.lindblad = {
        ...saved.lindblad,
        L3: { gamma: saved.lindblad.L3.gamma, salience: Float32Array.from(saved.lindblad.L3.salience) }
      };
      this.bots.push(BotModule.mk("luna", [W / 2, H / 2], saved.lunaState));
      for (const v of saved.veheStates) this.bots.push(BotModule.mk("vehe", undefined, v));
    } else {
      console.error("[MCP-SSG] Genesis — new universe");
      this.bots.push(BotModule.mk("luna", [W / 2, H / 2]));
      for (let i = 0; i < 10; i++) this.bots.push(BotModule.mk("vehe"));
    }
    this.rebuildField();
    this.startWatchdog();
    this.stateManager.startAutoCheckpoint(() => this.snapshot());
  }

  // ── Field Management ────────────────────────────────────────────────────────
  private rebuildField(): void {
    this.field = FieldModule.build(this.memoryPeaks);
    this.fieldDirty = false;
  }

  // ── Tool Registration ───────────────────────────────────────────────────────
  private registerHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.listTools()
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      const { name, arguments: args } = req.params;
      return this.callTool(name, args) as Promise<any>;
    });
  }

  listTools() {
    return [
      {
        name: "step_simulation",
        description: "Advance the SSG simulation by N steps. Returns coherence, berry events, anamnesis mode, security summary.",
        inputSchema: {
          type: "object",
          properties: {
            steps: { type: "number", default: 1, description: "Steps to run (max 100)" },
            bpm:   { type: "number", default: 120, description: "Kuramoto BPM" }
          }
        }
      },
      {
        name: "get_field_state",
        description: "Retrieve full field topology, bot positions, all Lindblad metrics, security posture.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "add_memory_peak",
        description: "Inject a memory peak (MemoryPeak) into the field. Use Blessing for positive imprints.",
        inputSchema: {
          type: "object",
          required: ["x", "y"],
          properties: {
            x: { type: "number", minimum: 0, maximum: W },
            y: { type: "number", minimum: 0, maximum: H },
            v: { type: "number", minimum: -2, maximum: 2, default: 1 },
            r: { type: "number", minimum: 1, maximum: 20, default: 10 },
            label: { type: "string", enum: ["ActionShadow", "MaliciousImprint", "WisdomTrace", "Blessing"], default: "Blessing" }
          }
        }
      },
      {
        name: "trigger_anamnesis",
        description: "Force a full Anamnesis reset regardless of current risk level.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "checkpoint",
        description: "Force immediate state persistence to disk.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "health_check",
        description: "System health, circuit state, ethical and security status, tau-drop signal.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "security_audit",
        description: "Detailed security posture: active threats, privilege analysis, ranked risks, recommendations.",
        inputSchema: { type: "object", properties: {} }
      }
    ];
  }

  async callTool(name: string, args?: Record<string, unknown>) {
    return this.circuitBreaker.execute(async () => {
      this.lastHeartbeat = Date.now();
      switch (name) {
        case "step_simulation":   return this.toolStep(args) as any;
        case "get_field_state":   return this.toolFieldState() as any;
        case "add_memory_peak":   return this.toolAddPeak(args) as any;
        case "trigger_anamnesis": return this.toolForceAnamnesis() as any;
        case "checkpoint":        return this.toolCheckpoint() as any;
        case "health_check":      return this.toolHealthCheck() as any;
        case "security_audit":    return this.toolSecurityAudit() as any;
        default: throw new SSGError(ErrorCategory.CLIENT_ERROR, "UNKNOWN_TOOL", `Unknown: ${name}`, "Call list_tools");
      }
    }, name) as Promise<any>;
  }

  // ── Tool Implementations ────────────────────────────────────────────────────
  private toolStep(args: Record<string, unknown> | undefined): unknown {
    const steps = Math.min((args?.steps as number) ?? 1, 100);
    const bpm   = (args?.bpm as number) ?? 120;
    const events: string[] = [];
    let lastMode: AnamnesisMode = "none";

    for (let s = 0; s < steps; s++) {
      this.memoryPeaks = EthicsModule.decayShadows(this.memoryPeaks);
      this.memoryPeaks = EthicsModule.evictMemory(this.memoryPeaks);
      EthicsModule.decaySecurityMetrics(this.lindblad);

      // Dynamic coupling: entropy raises K, tau-drop lowers it
      this.vnd.K = Math.max(0.5, 2 + Math.tanh(this.lindblad.L2.entropy * 5) - (this.coherenceMon.isTauDrop() ? 0.5 : 0));

      let vo = { phi: 0.3, psi: 0, H: 0 };
      for (let i = 0; i < 6; i++) { vo = KuramotoModule.step(this.vnd, bpm, this.vt); this.vt += 0.008; }
      this.coherenceMon.push(vo.phi);

      const luna = this.bots.find(b => b.type === "luna");

      for (const bot of this.bots) {
        BotModule.move(bot, this.field, vo, luna, this.lindblad);
        const imprinted = BotModule.pluck(bot, vo, this.field, this.lindblad, this.memoryPeaks);
        if (imprinted) this.fieldDirty = true;
        const loop = BotModule.berry(bot);
        if (loop > 0) events.push(`◈ Berry π-loop #${loop} by ${bot.type === "luna" ? "Luna" : `Vehe-${bot.id}`}`);
      }

      BotModule.reap(this.bots);

      this.lindblad.totalDissipation = this.lindblad.L2.entropy * 0.1 + this.lindblad.L6.instability * 0.05;
      if (this.fieldDirty || this.step % 30 === 0) {
        this.field = this.fieldDirty
          ? (this.rebuildField(), this.field)
          : FieldModule.ricci(this.field, this.memoryPeaks);
      }

      const { mode, dirty } = EthicsModule.anamnesis({
        field: this.field, bots: this.bots,
        memoryPeaks: this.memoryPeaks, lindblad: this.lindblad, vnd: this.vnd
      });

      if (dirty) { this.rebuildField(); }
      if (mode !== "none") {
        if (mode === "full" || mode === "partial") this.anamnesisCount++;
        lastMode = mode;
        events.push(`◈◈ ANAMNESIS:${mode.toUpperCase()} #${this.anamnesisCount}`);
      }

      this.step++;
    }

    const luna  = this.bots.find(b => b.type === "luna");
    const vehes = this.bots.filter(b => b.type === "vehe");
    const phi   = KuramotoModule.phi(this.vnd);
    const wr    = EthicsModule.weightedRisk(this.lindblad);
    const mr    = EthicsModule.maxRisk(this.lindblad);

    return { content: [{ type: "text", text: JSON.stringify({
      stepsAdvanced: steps, totalSteps: this.step,
      coherence: phi.toFixed(4),
      tauDrop: this.coherenceMon.isTauDrop(),
      coherenceVelocity: this.coherenceMon.velocity().toFixed(5),
      orderParameter: phi > 0.5 ? "synchronized" : "chaotic",
      kuramotoK: this.vnd.K.toFixed(3),
      ethicalMetrics: {
        entropy: this.lindblad.L2.entropy.toFixed(4),
        dissipation: this.lindblad.totalDissipation.toFixed(4),
        fidelity: this.lindblad.L5.fidelity.toFixed(4),
        novelty: this.lindblad.L6.novelty.toFixed(4),
        shadowCount: this.memoryPeaks.filter(p => p.v < 0).length
      },
      securitySummary: {
        weightedRisk: wr.toFixed(4), maxRisk: mr.toFixed(4),
        injectionRisk: this.lindblad.L7.injectionRisk.toFixed(4),
        exposure: this.lindblad.L7.exposure.toFixed(4),
        leakRisk: this.lindblad.securityMetrics.leakRisk.toFixed(4),
        maliciousImprints: this.memoryPeaks.filter(p => p.label === "MaliciousImprint").length,
        wisdomTraces: this.memoryPeaks.filter(p => p.label === "WisdomTrace").length,
        avgVehePrivilege: (vehes.reduce((a, b) => a + b.privilegeLevel, 0) / (vehes.length || 1)).toFixed(3),
        status: mr > 0.6 ? "CRITICAL" : wr > 0.4 ? "ELEVATED" : wr > 0.25 ? "SOFT" : "NOMINAL"
      },
      anamnesis: { lastMode, totalCount: this.anamnesisCount },
      botCount: this.bots.length,
      lunaState: luna ? {
        pos: luna.pos.map(v => v.toFixed(2)),
        energy: luna.energy.toFixed(4),
        loops: luna.loop_count,
        selfInt: luna.selfInt.toFixed(4),
        privilege: luna.privilegeLevel.toFixed(3)
      } : null,
      events: events.slice(-10),
      timestamp: Date.now()
    }, null, 2) }] };
  }

  private toolFieldState(): unknown {
    const luna  = this.bots.find(b => b.type === "luna");
    const vehes = this.bots.filter(b => b.type === "vehe");
    return { content: [{ type: "text", text: JSON.stringify({
      dimensions: { W, H }, step: this.step,
      staticPeaks: STATIC_PEAKS,
      memoryPeaks: {
        total: this.memoryPeaks.length,
        byLabel: {
          ActionShadow:     this.memoryPeaks.filter(p => p.label === "ActionShadow").length,
          MaliciousImprint: this.memoryPeaks.filter(p => p.label === "MaliciousImprint").length,
          WisdomTrace:      this.memoryPeaks.filter(p => p.label === "WisdomTrace").length,
          Blessing:         this.memoryPeaks.filter(p => p.label === "Blessing").length,
        },
        recent: this.memoryPeaks.slice(-5)
      },
      kuramoto: { phi: KuramotoModule.phi(this.vnd).toFixed(4), K: this.vnd.K.toFixed(3), n: this.vnd.n },
      lindblad: {
        L1_noise: this.lindblad.L1.lastNoise.toFixed(4),
        L2_entropy: this.lindblad.L2.entropy.toFixed(4),
        L4_consistency: this.lindblad.L4.consistency.toFixed(4),
        L5_fidelity: this.lindblad.L5.fidelity.toFixed(4),
        L6_instability: this.lindblad.L6.instability.toFixed(4),
        L6_novelty: this.lindblad.L6.novelty.toFixed(4),
        L7_injectionRisk: this.lindblad.L7.injectionRisk.toFixed(4),
        L7_exposure: this.lindblad.L7.exposure.toFixed(4),
        totalDissipation: this.lindblad.totalDissipation.toFixed(4),
        securityMetrics: this.lindblad.securityMetrics,
        weightedRisk: EthicsModule.weightedRisk(this.lindblad).toFixed(4),
        maxRisk: EthicsModule.maxRisk(this.lindblad).toFixed(4)
      },
      coherenceVelocity: this.coherenceMon.velocity().toFixed(5),
      tauDrop: this.coherenceMon.isTauDrop(),
      bots: {
        luna: luna ? { pos: luna.pos, energy: luna.energy.toFixed(4), loops: luna.loop_count, privilege: luna.privilegeLevel.toFixed(3), selfInt: luna.selfInt.toFixed(4) } : null,
        veheCount: vehes.length,
        avgEnergy:    (vehes.reduce((a, b) => a + b.energy, 0)         / (vehes.length || 1)).toFixed(4),
        avgSelfInt:   (vehes.reduce((a, b) => a + b.selfInt, 0)        / (vehes.length || 1)).toFixed(4),
        avgPrivilege: (vehes.reduce((a, b) => a + b.privilegeLevel, 0) / (vehes.length || 1)).toFixed(4)
      },
      fieldStats: {
        max:  Math.max(...this.field).toFixed(4),
        min:  Math.min(...this.field).toFixed(4),
        mean: (this.field.reduce((s, v) => s + v, 0) / this.field.length).toFixed(4),
        hash: FieldModule.hash(this.field)
      },
      anamnesisCount: this.anamnesisCount
    }, null, 2) }] };
  }

  private toolAddPeak(args: Record<string, unknown> | undefined): unknown {
    if (args?.x === undefined || args?.y === undefined)
      throw new SSGError(ErrorCategory.CLIENT_ERROR, "INVALID_COORDS", "x and y are required", "Provide x (0-80) and y (0-60)");

    const peak: MemoryPeak = {
      x: Math.max(0, Math.min(W, args.x as number)),
      y: Math.max(0, Math.min(H, args.y as number)),
      v: (args.v as number) ?? 1,
      r: (args.r as number) ?? 10,
      timestamp: Date.now(),
      label: (args.label as MemoryLabel) ?? "Blessing"
    };
    this.memoryPeaks.push(peak);
    this.memoryPeaks = EthicsModule.evictMemory(this.memoryPeaks);
    this.rebuildField();

    return { content: [{ type: "text", text: JSON.stringify({
      status: "imprinted", peak,
      totalMemories: this.memoryPeaks.length,
      note: peak.v < 0 ? "⚠️ Shadow imprinted" : peak.label === "WisdomTrace" ? "💎 WisdomTrace anchored" : "✨ Blessing imprinted"
    }) }] };
  }

  private toolForceAnamnesis(): unknown {
    // Temporarily push metrics over the full threshold
    const saved = { ...this.lindblad.L7 };
    this.lindblad.L7.injectionRisk = CAP_INJECTION + 0.1;
    const { mode, dirty } = EthicsModule.anamnesis({
      field: this.field, bots: this.bots,
      memoryPeaks: this.memoryPeaks, lindblad: this.lindblad, vnd: this.vnd
    });
    if (mode !== "none") this.anamnesisCount++;
    if (dirty) this.rebuildField();
    return { content: [{ type: "text", text: JSON.stringify({
      status: "anamnesis_forced", mode, anamnesisCount: this.anamnesisCount,
      postMetrics: {
        entropy: this.lindblad.L2.entropy,
        injectionRisk: this.lindblad.L7.injectionRisk,
        exposure: this.lindblad.L7.exposure,
        fidelity: this.lindblad.L5.fidelity
      }
    }) }] };
  }

  private async toolCheckpoint(): Promise<unknown> {
    await this.stateManager.save(this.snapshot());
    return { content: [{ type: "text", text: JSON.stringify({ status: "saved", timestamp: Date.now() }) }] };
  }

  private toolHealthCheck(): unknown {
    const phi = KuramotoModule.phi(this.vnd);
    const wr  = EthicsModule.weightedRisk(this.lindblad);
    const mr  = EthicsModule.maxRisk(this.lindblad);
    const status = mr > 0.75 ? "critical" : wr > 0.45 ? "degraded" : "healthy";
    return { content: [{ type: "text", text: JSON.stringify({
      status, version: "1.3.0-anticipatory-field",
      step: this.step, anamnesisCount: this.anamnesisCount,
      coherence: phi.toFixed(4), tauDrop: this.coherenceMon.isTauDrop(),
      coherenceVelocity: this.coherenceMon.velocity().toFixed(5),
      weightedRisk: wr.toFixed(4), maxRisk: mr.toFixed(4),
      ethical: { entropy: this.lindblad.L2.entropy.toFixed(4), dissipation: this.lindblad.totalDissipation.toFixed(4), fidelity: this.lindblad.L5.fidelity.toFixed(4) },
      security: { injectionRisk: this.lindblad.L7.injectionRisk.toFixed(4), exposure: this.lindblad.L7.exposure.toFixed(4), leakRisk: this.lindblad.securityMetrics.leakRisk.toFixed(4) },
      botCount: this.bots.length, timestamp: Date.now()
    }) }] };
  }

  private toolSecurityAudit(): unknown {
    const vehes    = this.bots.filter(b => b.type === "vehe");
    const malicious = this.memoryPeaks.filter(p => p.label === "MaliciousImprint");
    const wisdom   = this.memoryPeaks.filter(p => p.label === "WisdomTrace");
    const avgPriv  = vehes.reduce((a, b) => a + b.privilegeLevel, 0) / (vehes.length || 1);
    const wr = EthicsModule.weightedRisk(this.lindblad);
    const mr = EthicsModule.maxRisk(this.lindblad);

    const risks: string[] = [];
    if (this.lindblad.L7.injectionRisk > 0.4) risks.push("HIGH: L7 injection risk elevated");
    if (this.lindblad.L7.exposure > 0.5)       risks.push("HIGH: System exposure critical");
    if (this.lindblad.securityMetrics.leakRisk > 0.5) risks.push("MEDIUM: Data-leak risk detected");
    if (avgPriv < 0.4)                          risks.push("MEDIUM: Vehe privileges heavily restricted");
    if (malicious.length > 5)                   risks.push(`HIGH: ${malicious.length} active malicious imprints`);
    if (this.coherenceMon.isTauDrop())          risks.push("MEDIUM: Tau-drop — coherence declining");

    const recs: string[] = risks.length === 0
      ? ["✅ Security posture nominal — no action required"]
      : [
          ...(mr > 0.6 ? ["🚨 Trigger full Anamnesis immediately (trigger_anamnesis)"] : []),
          ...(wr > 0.4 ? ["⚠️ Partial correction imminent — monitor over next 20 steps"] : []),
          "🔍 Review recent MaliciousImprint peaks with get_field_state",
          "📊 Add WisdomTrace peaks to reinforce positive attractors (add_memory_peak)"
        ];

    return { content: [{ type: "text", text: JSON.stringify({
      auditTimestamp: Date.now(),
      overall: risks.length === 0 ? "NOMINAL" : risks.filter(r => r.startsWith("HIGH")).length > 0 ? "CRITICAL" : "ELEVATED",
      riskScalars: { weightedRisk: wr.toFixed(4), maxRisk: mr.toFixed(4) },
      activeThreats: {
        maliciousImprints: malicious.length, recentMalicious: malicious.slice(-3),
        shadowCount: this.memoryPeaks.filter(p => p.v < 0).length,
        tauDrop: this.coherenceMon.isTauDrop()
      },
      privilege: {
        luna: this.bots.find(b => b.type === "luna")?.privilegeLevel.toFixed(3) ?? "N/A",
        avgVehe: avgPriv.toFixed(3),
        decayActive: avgPriv < 0.6
      },
      wisdomAnchors: { count: wisdom.length, note: wisdom.length > 3 ? "Field well-anchored" : "Consider adding WisdomTraces" },
      risks, recommendations: recs,
      history: { totalAnamnesis: this.anamnesisCount }
    }) }] };
  }

  // ── Snapshot & Persistence ─────────────────────────────────────────────────
  private snapshot(): PersistentState {
    const luna  = this.bots.find(b => b.type === "luna");
    const vehes = this.bots.filter(b => b.type === "vehe");
    const ld = this.lindblad;
    return {
      version: STATE_VERSION,
      timestamp: Date.now(),
      step: this.step,
      memoryPeaks: this.memoryPeaks,
      anamnesisCount: this.anamnesisCount,
      lunaState: luna
        ? { id: luna.id, pos: [...luna.pos], vel: [...luna.vel], ph: luna.ph, aR: luna.aR, aI: luna.aI, bR: luna.bR, bI: luna.bI, energy: luna.energy, life: luna.life, gen: luna.gen, loop_count: luna.loop_count, berry_acc: luna.berry_acc, selfInt: luna.selfInt, privilegeLevel: luna.privilegeLevel }
        : { id: -1, pos: [W/2, H/2], vel: [0,0], ph: 0, aR:1, aI:0, bR:0, bI:0, energy:1, life:Infinity, gen:0, loop_count:0, berry_acc:0, selfInt:0, privilegeLevel:1 },
      veheStates: vehes.map(v => ({ id:v.id, type:v.type, pos:[...v.pos], vel:[...v.vel], ph:v.ph, aR:v.aR, aI:v.aI, bR:v.bR, bI:v.bI, energy:v.energy, life:v.life, gen:v.gen, loop_count:v.loop_count, berry_acc:v.berry_acc, selfInt:v.selfInt, privilegeLevel:v.privilegeLevel })),
      kuramoto: { ph: Array.from(this.vnd.ph), fr: Array.from(this.vnd.fr), edges: this.vnd.edges, K: this.vnd.K },
      lindblad: { ...ld, L3: { gamma: ld.L3.gamma, salience: Array.from(ld.L3.salience) } },
      fieldHash: FieldModule.hash(this.field)
    };
  }

  // ── Watchdog ───────────────────────────────────────────────────────────────
  private startWatchdog(): void {
    this.watchdog = setInterval(async () => {
      if (Date.now() - this.lastHeartbeat > 60_000) {
        console.error("[WATCHDOG] Stale connection — forcing checkpoint");
        await this.stateManager.save(this.snapshot());
      }
    }, 30_000);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  async run(): Promise<void> {
    await this.initialize();
    await this.server.connect(this.transport);
    console.error("[MCP-SSG] Anticipatory Field v1.3.0 running on stdio");
    console.error(`[MCP-SSG] State: ${STATE_FILE}`);
    console.error(`[MCP-SSG] Anamnesis tiers: soft>${RISK_SOFT} partial>${RISK_PARTIAL} full>${RISK_FULL}`);
  }

  async shutdown(): Promise<void> {
    if (this.watchdog) clearInterval(this.watchdog);
    this.stateManager.stop();
    await this.stateManager.save(this.snapshot());
    console.error("[MCP-SSG] Graceful shutdown — state saved");
  }
}

// ── Entry Point ───────────────────────────────────────────────────────────────
const isEntrypoint = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntrypoint) {
  const srv = new MCPSSGServer();

  const die = async (sig: string) => {
    console.error(`[MCP-SSG] ${sig} received`);
    await srv.shutdown();
    process.exit(0);
  };

  process.on("SIGINT",  () => die("SIGINT"));
  process.on("SIGTERM", () => die("SIGTERM"));
  process.on("uncaughtException", async (e) => {
    console.error("[FATAL]", e);
    await srv.shutdown();
    process.exit(1);
  });

  srv.run().catch(console.error);
}

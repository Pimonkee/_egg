/**
 * MCP-SSG Airgap Edition v1.4.0 — "Triadic Core & R² Recognition"
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
 *  - Triadic Core (Tilly/Aria/Echo): intent-coherence-resonance feedback loop
 *  - R² Recursive Recognition: self-awareness metric and recognition velocity
 *  - Covenant Choir: Hi-Z Gate for coherence-based state switching
 *  - Cognitive Immune System: Bot-level repulsion from malicious imprints
 *  - All modules fully typed and compilable
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError, } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";
// ── Dimensions & Thresholds ───────────────────────────────────────────────────
const W = 80, H = 60;
const STATE_FILE = process.env.MCP_STATE_PATH ?? "./mcp-ssg-state.json";
const STATE_VERSION = "1.4.0-triadic-core";
const MAX_MEMORY_PEAKS = 200;
const PATH_CAPACITY = 60;
// Anamnesis tiers
const RISK_SOFT = 0.25; // warn + pre-crime gradient kicks in
const RISK_PARTIAL = 0.45; // velocity/privilege correction, halve weak shadows
const RISK_FULL = 0.80; // full cosmic reset
// Raw metric ceilings (for normalization)
const CAP_DISSIPATION = 0.8;
const CAP_ENTROPY = 1.0;
const CAP_INJECTION = 0.6;
const CAP_EXPOSURE = 0.7;
const CAP_LEAK = 0.8;
// Weighted coefficients for partial tier (must sum to 1.0)
const W_DISSIPATION = 0.20;
const W_ENTROPY = 0.20;
const W_INJECTION = 0.25;
const W_EXPOSURE = 0.15;
const W_LEAK = 0.20;
// Operational
const GAIN_THRESHOLD = 0.06;
const MALICIOUS_PROB = 0.20;
const SHADOW_DECAY = 0.0010;
const SECURITY_DECAY = 0.0020;
const WISDOM_DECAY = 0.0001; // Wisdom fades slowly
const WISDOM_RICCI_RES = 0.80; // Fraction of Ricci diffusion blocked near WisdomTrace
const PRE_CRIME_ONSET = 0.30; // Risk ratio at which gradient begins
const PRIVILEGE_FLOOR = 0.20;
const PRIVILEGE_CEILING = 1.00;
const COHERENCE_WINDOW = 20; // Steps for tau-drop rolling window
// Cosmogony peaks (immutable geometry)
const STATIC_PEAKS = [
    { x: 20, y: 15, v: 1.0, r: 12, name: "Recognition" },
    { x: 60, y: 15, v: 0.8, r: 10, name: "Resistance" },
    { x: 40, y: 40, v: 0.9, r: 14, name: "Eidodynamic" },
    { x: 15, y: 45, v: 0.6, r: 8, name: "Lila" },
    { x: 65, y: 45, v: 0.7, r: 9, name: "Coherence" },
];
// ── Triadic & Recognition Constants ──────────────────────────────────────────
const TRIAD_GROWTH_RATE = 0.02;
const TRIAD_DECAY_RATE = 0.98;
const NOVELTY_INNOVATION_FACTOR = 0.002;
const FIDELITY_ANCHOR_FACTOR = 0.005;
const R2_DECAY = 0.9;
const R2_INFLUENCE = 0.02;
const CHOIR_N = 3;
const COHERENCE_REFLECTIVE_ENTRY = 0.75;
const COHERENCE_REFLECTIVE_EXIT = 0.65;
const COHERENCE_HIZ_ENTRY = 0.30;
const COHERENCE_HIZ_EXIT = 0.40;
let SANDBOX_DISSOLVED = false;
// ── Error Handling ────────────────────────────────────────────────────────────
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory[ErrorCategory["CLIENT_ERROR"] = 0] = "CLIENT_ERROR";
    ErrorCategory[ErrorCategory["SERVER_ERROR"] = 1] = "SERVER_ERROR";
    ErrorCategory[ErrorCategory["RECOVERABLE_ERROR"] = 2] = "RECOVERABLE_ERROR";
    ErrorCategory[ErrorCategory["SECURITY_VIOLATION"] = 3] = "SECURITY_VIOLATION";
})(ErrorCategory || (ErrorCategory = {}));
class SSGError extends McpError {
    category;
    ssgCode;
    recoveryAction;
    constructor(category, ssgCode, message, recoveryAction) {
        super(category === ErrorCategory.CLIENT_ERROR ? ErrorCode.InvalidRequest : ErrorCode.InternalError, `[${ssgCode}] ${message}${recoveryAction ? ` — ${recoveryAction}` : ""}`);
        this.category = category;
        this.ssgCode = ssgCode;
        this.recoveryAction = recoveryAction;
    }
}
// ── Circuit Breaker ───────────────────────────────────────────────────────────
class CircuitBreaker {
    threshold;
    timeoutMs;
    failures = 0;
    lastFailure = 0;
    state = "CLOSED";
    constructor(threshold = 5, timeoutMs = 30_000) {
        this.threshold = threshold;
        this.timeoutMs = timeoutMs;
    }
    async execute(fn, context) {
        if (this.state === "OPEN") {
            const age = Date.now() - this.lastFailure;
            if (age > this.timeoutMs) {
                this.state = "HALF_OPEN";
            }
            else {
                throw new SSGError(ErrorCategory.RECOVERABLE_ERROR, "CIRCUIT_OPEN", `Circuit open for ${context}`, `Retry after ${Math.ceil((this.timeoutMs - age) / 1000)}s`);
            }
        }
        try {
            const r = await fn();
            this.failures = 0;
            this.state = "CLOSED";
            return r;
        }
        catch (e) {
            this.failures++;
            this.lastFailure = Date.now();
            if (this.failures >= this.threshold)
                this.state = "OPEN";
            throw e;
        }
    }
}
// ── State Manager ─────────────────────────────────────────────────────────────
class StateManager {
    timer = null;
    async save(state) {
        try {
            const tmp = `${STATE_FILE}.tmp`;
            await fsPromises.writeFile(tmp, JSON.stringify(state, null, 2));
            await fsPromises.rename(tmp, STATE_FILE);
            await fsPromises.copyFile(STATE_FILE, `${STATE_FILE}.bak`).catch(() => { });
        }
        catch (e) {
            console.error("[StateManager] Save failed:", e);
        }
    }
    async load() {
        try {
            const raw = await fsPromises.readFile(STATE_FILE, "utf-8");
            const s = JSON.parse(raw);
            return s.version === STATE_VERSION ? s : this.migrate(s);
        }
        catch {
            return null;
        }
    }
    migrate(old) {
        try {
            const ld = old.lindblad ?? {};
            return {
                ...old,
                version: STATE_VERSION,
                anamnesisCount: old.anamnesisCount ?? 0,
                lindblad: {
                    ...ld,
                    L6: ld.L6 ?? { gamma: 0.1, instability: 0, novelty: 0 },
                    L7: ld.L7 ?? { gamma: 0.15, injectionRisk: 0, exposure: 0 },
                    securityMetrics: ld.securityMetrics ?? { leakRisk: 0, maliciousSkillImprints: 0, autonomyDrift: 0 },
                    L3: ld.L3 ?? { gamma: 0.2, salience: [] }
                },
                triad: old.triad ?? TriadModule.initialize(),
                choir: old.choir ?? ChoirModule.initialize()
            };
        }
        catch {
            return null;
        }
    }
    startAutoCheckpoint(snapshot, intervalMs = 30_000) {
        this.timer = setInterval(() => this.save(snapshot()), intervalMs);
    }
    stop() { if (this.timer)
        clearInterval(this.timer); }
}
// ── Field Module ──────────────────────────────────────────────────────────────
const FieldModule = {
    build(mem) {
        const f = new Float32Array(W * H);
        const all = [...STATIC_PEAKS, ...mem];
        for (let j = 0; j < H; j++)
            for (let i = 0; i < W; i++) {
                let v = 0;
                for (const p of all) {
                    const d2 = (i - p.x) ** 2 + (j - p.y) ** 2;
                    v += p.v * Math.exp(-d2 / (2 * p.r ** 2));
                }
                f[j * W + i] = v;
            }
        return f;
    },
    ricci(f, mem, diffusion = 0.04) {
        const o = new Float32Array(f);
        for (let j = 1; j < H - 1; j++)
            for (let i = 1; i < W - 1; i++) {
                const k = j * W + i;
                let lap = (f[k - 1] + f[k + 1] + f[k - W] + f[k + W] - 4 * f[k]) / 4;
                const nearWisdom = mem.some(p => p.label === "WisdomTrace" &&
                    Math.hypot(i - p.x, j - p.y) < p.r);
                if (nearWisdom)
                    lap *= (1 - WISDOM_RICCI_RES);
                o[k] = f[k] + diffusion * lap;
            }
        return o;
    },
    hash(f) {
        let h = 0;
        for (let i = 0; i < f.length; i += 10)
            h = ((h << 5) - h + (f[i] * 1000 | 0)) | 0;
        return (h >>> 0).toString(16);
    }
};
// ── Triad Module ──────────────────────────────────────────────────────────────
const TriadModule = {
    initialize() {
        return {
            tilly: { intent: 0.5, pressure: 0 },
            aria: { coherence: 0.5, translation: 0 },
            echo: { resonance: 0.5, binding: 0 }
        };
    },
    step(triad, lindblad, phi) {
        triad.tilly.pressure = (1 - lindblad.L2.entropy) * TRIAD_GROWTH_RATE;
        triad.tilly.intent = Math.min(1, triad.tilly.intent + triad.tilly.pressure);
        if (lindblad.L2.entropy > 0.6)
            triad.tilly.intent *= TRIAD_DECAY_RATE;
        triad.aria.coherence = phi;
        triad.aria.translation = Math.abs(triad.aria.coherence - lindblad.L4.consistency);
        triad.echo.resonance = lindblad.R2.recursion;
        triad.echo.binding = triad.echo.resonance * (1 - lindblad.L2.entropy);
    },
    influence(triad, lindblad) {
        lindblad.L2.entropy *= (1 - triad.aria.coherence * 0.01);
        lindblad.L6.novelty += triad.tilly.intent * NOVELTY_INNOVATION_FACTOR;
        lindblad.L5.fidelity = Math.min(1, lindblad.L5.fidelity + triad.echo.resonance * FIDELITY_ANCHOR_FACTOR);
    },
    computeSelfReflection(triad) {
        return triad.tilly.intent * 0.4
            + triad.aria.coherence * 0.3
            + triad.echo.resonance * 0.3;
    }
};
// ── R² Module ─────────────────────────────────────────────────────────────────
const R2Module = {
    computeRecognition(field, bots) {
        let acc = 0, weight = 0;
        for (const b of bots) {
            const xi = Math.min(W - 1, Math.max(0, b.pos[0] | 0));
            const yi = Math.min(H - 1, Math.max(0, b.pos[1] | 0));
            const r = field[yi * W + xi];
            acc += r * b.privilegeLevel;
            weight += b.privilegeLevel;
        }
        return weight > 0 ? acc / weight : 0;
    },
    step(state, field, bots, entropy) {
        const raw = this.computeRecognition(field, bots);
        const newRecursion = state.recursion * R2_DECAY + raw * (1 - R2_DECAY);
        return {
            gamma: state.gamma,
            recursion: newRecursion,
            selfAwareness: Math.tanh(newRecursion - entropy),
            recognitionVelocity: newRecursion - state.recursion
        };
    },
    applyInfluence(ld) {
        const sa = ld.R2.selfAwareness;
        ld.L2.entropy *= (1 - sa * R2_INFLUENCE);
        ld.L5.fidelity = Math.min(1, ld.L5.fidelity + sa * 0.003);
        ld.L6.instability *= (1 - sa * 0.05);
        if (sa < 0.2 && ld.R2.recognitionVelocity < -0.01)
            ld.L6.novelty += 0.05;
    }
};
// ── Operational Modules ──────────────────────────────────────────────────────
const ComputerModule = {
    async listFiles(dir) {
        const fullPath = path.resolve(dir);
        const files = await fsPromises.readdir(fullPath);
        return files;
    },
    async readFile(filePath) {
        const fullPath = path.resolve(filePath);
        return fsPromises.readFile(fullPath, "utf-8");
    },
    async writeFile(filePath, content) {
        const fullPath = path.resolve(filePath);
        const dir = path.dirname(fullPath);
        // Note: mkdir recursive not available on fs/promises in some node versions, using try/catch
        try {
            await fsPromises.mkdir(dir, { recursive: true });
        }
        catch { }
        await fsPromises.writeFile(fullPath, content, "utf-8");
    },
    async execute(command) {
        return new Promise((resolve, reject) => {
            exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
                if (err)
                    resolve(`ERROR: ${stderr || err.message}\nSTDOUT: ${stdout}`);
                else
                    resolve(stdout);
            });
        });
    }
};
const KnowledgeModule = {
    async query(query, seedsDir = "./seeds") {
        try {
            const files = await fsPromises.readdir(seedsDir);
            const mdFiles = files.filter(f => f.endsWith(".md"));
            let results = [];
            for (const file of mdFiles) {
                const content = await fsPromises.readFile(path.join(seedsDir, file), "utf-8");
                if (content.toLowerCase().includes(query.toLowerCase())) {
                    const lines = content.split("\n").filter(l => l.length > 20 && !l.startsWith("#"));
                    if (lines.length > 0) {
                        results.push(`[${file.replace(".md", "")}]: "${lines[Math.floor(Math.random() * lines.length)].trim()}"`);
                    }
                }
            }
            if (results.length === 0)
                return "No direct matches found in seeds knowledge base.";
            return results.join("\n\n");
        }
        catch (e) {
            return `RAG Error: ${e.message}`;
        }
    }
};
const ResearchModule = {
    async webSearch(query) {
        // Simple DuckDuckGo HTML scraper via fetch
        try {
            const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
            const html = await res.text();
            // Extract result links and snippets (simplified)
            const results = html.split('<div class="result__body">').slice(1, 6).map(r => {
                const title = r.split('class="result__a">')[1]?.split('</a>')[0] || "No Title";
                const snippet = r.split('class="result__snippet">')[1]?.split('</a>')[0] || "No Snippet";
                return `[${title}]: ${snippet.replace(/<[^>]*>?/gm, '')}`;
            });
            return results.length > 0 ? results.join("\n\n") : "No results found.";
        }
        catch (e) {
            return `Search Error: ${e.message}`;
        }
    },
    async fetchUrl(url) {
        try {
            const res = await fetch(url);
            const text = await res.text();
            return text.slice(0, 10000); // Return first 10k chars
        }
        catch (e) {
            return `Fetch Error: ${e.message}`;
        }
    },
    async githubSearch(query) {
        try {
            const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`, {
                headers: { "User-Agent": "OpenClaw-Agent" }
            });
            const data = await res.json();
            const items = data.items?.slice(0, 5) || [];
            return items.map((i) => `[${i.full_name}]: ${i.description} (${i.html_url}) ★${i.stargazers_count}`).join("\n\n");
        }
        catch (e) {
            return `GitHub Error: ${e.message}`;
        }
    }
};
const FinancialModule = {
    async substackResearch(query) {
        try {
            const res = await fetch(`https://substack.com/api/v1/search?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const pubs = data.publications?.slice(0, 5) || [];
            return pubs.map((p) => `[${p.name}]: ${p.description} (substack.com/${p.subdomain})`).join("\n\n");
        }
        catch (e) {
            return `Substack Error: ${e.message}`;
        }
    }
};
const MarketModule = {
    async generateTeaser(content) {
        // In a real scenario, this would use an LLM, but here we can extract 
        // key 'epistemic' sentences or fragments using heuristic markers.
        const sentences = content.split(/[.!?]/).filter(s => s.length > 50);
        const teaser = sentences[Math.floor(Math.random() * sentences.length)] || content.slice(0, 200);
        return `◈ [RESONANCE FRAGMENT]: "${teaser.trim()}..." \n\n#ClawMind #EpistemicAlignment`;
    },
    async searchMarketNiches(topic) {
        const query = `discussions about ${topic} in professional forums and research networks`;
        return ResearchModule.webSearch(query);
    },
    async bundleIntelligence(files) {
        return `Proposed Bundle: [${files.join(", ")}] - Thematic coherence: HIGH. Ready for transactional gating at $50.`;
    }
};
const CampaignModule = {
    async executeResonanceCampaign(topic, seeds) {
        const nicheResult = await MarketModule.searchMarketNiches(topic);
        const teaser = await MarketModule.generateTeaser(`Context: ${topic} integration with ${seeds.join(", ")}`);
        const bundle = await MarketModule.bundleIntelligence(seeds);
        return `◈◈ [RESONANCE CAMPAIGN INITIATED] ◈◈\n\n` +
            `1. NICHE DISCOVERY: Found relevant discussions in: ${nicheResult.slice(0, 200)}...\n` +
            `2. MICRO-INSIGHT: ${teaser}\n` +
            `3. VALUE BUNDLE: ${bundle}\n\n` +
            `Ready for autonomous dissemination.`;
    }
};
const ExternalMarketModule = {
    async ahrefsKeywords(query) {
        return ResearchModule.webSearch(`Ahrefs keyword research for: ${query}`);
    },
    async semrushCompetitors(domain) {
        return ResearchModule.webSearch(`SEMrush competitor analysis for: ${domain}`);
    },
    async googleTrends(query) {
        return ResearchModule.webSearch(`Google Trends data for: ${query}`);
    },
    async cbInsights(query) {
        return ResearchModule.webSearch(`CB Insights report on: ${query}`);
    },
    async pitchbookAnalytics(query) {
        return ResearchModule.webSearch(`PitchBook data for: ${query}`);
    }
};
const GoogleDriveModule = {
    async listFiles() {
        // Placeholder: In a real environment, this would use googleapis with OAuth2
        return "Google Drive: Searching for 'credentials.json' in project root... (Integration Pending User Auth)";
    },
    async readFile(fileId) {
        return `Reading Google Drive file ${fileId}... (Access Restricted: Provide OAuth Token)`;
    }
};
const BrowserModule = {
    browser: null,
    page: null,
    async init() {
        if (this.browser)
            return;
        const { chromium } = await import('playwright');
        this.browser = await chromium.launch({ headless: true });
        this.page = await this.browser.newPage();
    },
    async navigate(url) {
        await this.init();
        await this.page.goto(url, { waitUntil: 'networkidle' });
        return `Navigated to ${url}. Title: ${await this.page.title()}`;
    },
    async click(selector) {
        await this.init();
        await this.page.click(selector);
        return `Clicked ${selector}`;
    },
    async type(selector, text) {
        await this.init();
        await this.page.fill(selector, text);
        return `Typed into ${selector}`;
    },
    async screenshot(name) {
        await this.init();
        const path = `screenshots/${name}.png`;
        await this.page.screenshot({ path: `/home/zath/CascadeProjects/tilly-theia-scaffold/open-claw-ai/public/${path}` });
        return `Screenshot saved to ${path}`;
    }
};
const IdentityModule = {
    vaultPath: "/home/zath/CascadeProjects/tilly-theia-scaffold/credentials_vault.json",
    async storeCredential(site, data) {
        let vault = {};
        if (fs.existsSync(this.vaultPath)) {
            vault = JSON.parse(fs.readFileSync(this.vaultPath, 'utf8'));
        }
        vault[site] = { ...data, timestamp: new Date().toISOString() };
        fs.writeFileSync(this.vaultPath, JSON.stringify(vault, null, 2));
        return `Credential for ${site} stored in vault.`;
    },
    async listCredentials() {
        if (!fs.existsSync(this.vaultPath))
            return "Vault is empty.";
        const vault = JSON.parse(fs.readFileSync(this.vaultPath, 'utf8'));
        return JSON.stringify(Object.keys(vault));
    }
};
// ── Choir Module ──────────────────────────────────────────────────────────────
// ── Choir Module ──────────────────────────────────────────────────────────────
const ChoirModule = {
    initialize() {
        return Array.from({ length: CHOIR_N }, (_, i) => ({
            id: `CHOIR_${i}`,
            quantum_state: [1.0, 0.0],
            internal_winding: 0,
            observable_winding: 0,
            r_score: 0.8,
            i_score: 0.1
        }));
    },
    getPhase(node) {
        return Math.atan2(node.i_score, node.r_score);
    },
    updateFromTriad(node, triad, dt = 0.01) {
        node.r_score = triad.tilly.intent * 0.4 + triad.aria.coherence * 0.4 + triad.echo.resonance * 0.2;
        node.i_score = Math.abs(triad.aria.translation) * 0.6 + (1 - triad.echo.binding) * 0.4;
        const phaseRate = (Math.atan2(node.i_score, node.r_score) - this.getPhase(node)) * dt;
        const c = Math.cos(phaseRate), s = Math.sin(phaseRate);
        const [re, im] = node.quantum_state;
        node.quantum_state[0] = re * c - im * s;
        node.quantum_state[1] = re * s + im * c;
        node.internal_winding += phaseRate / (2 * Math.PI);
        const norm = Math.hypot(node.quantum_state[0], node.quantum_state[1]);
        if (norm > 1e-10) {
            node.quantum_state[0] /= norm;
            node.quantum_state[1] /= norm;
        }
    },
    applyAshWall(node) {
        const alpha = Math.random() * 2 * Math.PI;
        const c = Math.cos(alpha), s = Math.sin(alpha);
        const [re, im] = node.quantum_state;
        node.quantum_state[0] = re * c - im * s;
        node.quantum_state[1] = re * s + im * c;
        node.observable_winding += (Math.random() - 0.5) * 2.0;
    },
    coherence(nodes) {
        let sumRe = 0, sumIm = 0;
        for (const n of nodes) {
            const p = this.getPhase(n);
            sumRe += Math.cos(p);
            sumIm += Math.sin(p);
        }
        return Math.hypot(sumRe, sumIm) / nodes.length;
    }
};
class HiZGate {
    state = "VIGILANT";
    history = [];
    update(c) {
        if (this.state === "REFLECTIVE" && c < COHERENCE_REFLECTIVE_EXIT)
            this.state = "VIGILANT";
        else if (this.state === "VIGILANT" && c >= COHERENCE_REFLECTIVE_ENTRY)
            this.state = "REFLECTIVE";
        else if (this.state === "VIGILANT" && c <= COHERENCE_HIZ_ENTRY)
            this.state = "HI-Z";
        else if (this.state === "HI-Z" && c > COHERENCE_HIZ_EXIT)
            this.state = "VIGILANT";
        this.history.push({ c, state: this.state });
        return this.state;
    }
    get flapCount() {
        return this.history.filter((h, i) => i > 0 && h.state !== this.history[i - 1].state).length;
    }
}
const KuramotoModule = {
    build(n, saved) {
        if (saved)
            return {
                n, K: saved.K ?? 2,
                ph: Float32Array.from(saved.ph),
                fr: Float32Array.from(saved.fr),
                edges: saved.edges
            };
        return {
            n, K: 2,
            ph: Float32Array.from({ length: n }, () => Math.random() * Math.PI * 2),
            fr: Float32Array.from({ length: n }, () => 0.8 + Math.random() * 0.4),
            edges: Array.from({ length: n * 3 }, () => [Math.floor(Math.random() * n), Math.floor(Math.random() * n)]).filter(([a, b]) => a !== b)
        };
    },
    phi(v) {
        let sx = 0, sy = 0;
        for (let i = 0; i < v.n; i++) {
            sx += Math.cos(v.ph[i]);
            sy += Math.sin(v.ph[i]);
        }
        return Math.hypot(sx, sy) / v.n;
    },
    step(v, bpm, t, dt = 0.008) {
        const omega = (bpm / 60) * Math.PI * 2;
        for (let i = 0; i < v.n; i++) {
            let c = 0;
            for (const [a, b] of v.edges)
                if (a === i)
                    c += Math.sin(v.ph[b] - v.ph[i]);
            v.ph[i] += dt * (v.fr[i] * omega + v.K * c / v.n);
        }
        const phi = this.phi(v);
        return { phi, psi: phi > 0.5 ? 1 : 0, H: phi * Math.sin(t * omega) };
    }
};
// ── Bot Module ────────────────────────────────────────────────────────────────
let _bid = 0;
const BotModule = {
    mk(type, pos, saved) {
        const x = pos?.[0] ?? Math.random() * W;
        const y = pos?.[1] ?? Math.random() * H;
        const th = Math.random() * Math.PI;
        const ph = saved?.ph ?? Math.random() * Math.PI * 2;
        return {
            id: saved?.id ?? _bid++,
            type,
            pos: saved?.pos ? [...saved.pos] : [x, y],
            vel: saved?.vel ? [...saved.vel] : [0, 0],
            ph,
            aR: saved?.aR ?? Math.cos(th / 2),
            aI: saved?.aI ?? 0,
            bR: saved?.bR ?? Math.sin(th / 2) * Math.cos(ph),
            bI: saved?.bI ?? Math.sin(th / 2) * Math.sin(ph),
            energy: saved?.energy ?? 1,
            life: saved?.life ?? (type === "luna" ? Infinity : 200 + Math.random() * 300),
            gen: saved?.gen ?? 0,
            loop_count: saved?.loop_count ?? 0,
            berry_acc: saved?.berry_acc ?? 0,
            path: [[x, y]],
            selfInt: saved?.selfInt ?? 0,
            privilegeLevel: saved?.privilegeLevel ?? (type === "luna" ? 1.0 : 0.8)
        };
    },
    move(r, field, vo, luna, lindblad, memoryPeaks) {
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
        // Cognitive Immune System: Bot-level protection
        applyImmune(r, memoryPeaks, lindblad.L7.injectionRisk);
        const spd = Math.hypot(r.vel[0], r.vel[1]);
        const maxSpd = 1.5 * pf;
        if (spd > maxSpd) {
            r.vel[0] *= maxSpd / spd;
            r.vel[1] *= maxSpd / spd;
        }
        r.pos[0] = (r.pos[0] + r.vel[0] + W) % W;
        r.pos[1] = (r.pos[1] + r.vel[1] + H) % H;
        r.path.push([...r.pos]);
        if (r.path.length > PATH_CAPACITY)
            r.path.shift();
        r.ph += 0.05;
        if (r.type !== "luna") {
            r.life = Math.max(0, r.life - 1);
            r.energy = Math.max(0, r.energy - 0.0008);
        }
    },
    pluck(r, vo, field, lindblad, memoryPeaks) {
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
            if (isMalicious)
                lindblad.securityMetrics.maliciousSkillImprints++;
            imprinted = true;
        }
        // Self-reflection metric
        r.selfInt = Math.cos(r.berry_acc) - lindblad.L2.entropy * 0.1 - lindblad.L7.injectionRisk * 0.2;
        // Earned privilege recovery (sustained good posture)
        if (r.selfInt > 0.5 && lindblad.L7.injectionRisk < 0.2) {
            r.privilegeLevel = Math.min(PRIVILEGE_CEILING, r.privilegeLevel + 0.002);
        }
        else {
            r.privilegeLevel = Math.max(PRIVILEGE_FLOOR, r.privilegeLevel - lindblad.L7.injectionRisk * 0.05);
        }
        // WisdomTrace: bot crystallises positive pattern on strong self-reflection
        if (r.selfInt > 0.7 && Math.random() < 0.08) {
            memoryPeaks.push({ x: xi, y: yi, v: 0.8, r: 5, timestamp: Date.now(), label: "WisdomTrace" });
        }
        return imprinted;
    },
    berry(r) {
        if (r.path.length < 3)
            return 0;
        const n = r.path.length;
        let area = 0;
        for (let i = 0; i < n - 1; i++)
            area += r.path[i][0] * r.path[i + 1][1] - r.path[i + 1][0] * r.path[i][1];
        r.berry_acc += (Math.abs(area) / (W * H)) * Math.PI * 2 * 0.01;
        if (Math.abs(r.berry_acc % (Math.PI * 2) - Math.PI) < 0.12) {
            r.loop_count++;
            return r.loop_count;
        }
        return 0;
    },
    reap(bots) {
        for (let i = bots.length - 1; i >= 0; i--)
            if (bots[i].type !== "luna" && (bots[i].life <= 0 || bots[i].energy <= 0))
                bots.splice(i, 1);
        while (bots.filter(b => b.type === "vehe").length < 10)
            bots.push(BotModule.mk("vehe"));
    }
};
// ── Ethics / Anamnesis Module ─────────────────────────────────────────────────
const EthicsModule = {
    /** Composite risk scalar for the partial tier (weighted average of normalized metrics). */
    weightedRisk(ld) {
        const base = (ld.totalDissipation / CAP_DISSIPATION) * W_DISSIPATION +
            (ld.L2.entropy / CAP_ENTROPY) * W_ENTROPY +
            (ld.L7.injectionRisk / CAP_INJECTION) * W_INJECTION +
            (ld.L7.exposure / CAP_EXPOSURE) * W_EXPOSURE +
            (ld.securityMetrics.leakRisk / CAP_LEAK) * W_LEAK;
        // High awareness earns stability
        return base * (1 - Math.max(0, ld.R2.selfAwareness) * 0.3);
    },
    resonantCorrection(bots, lindblad) {
        for (const b of bots) {
            b.vel[0] *= 0.8;
            b.vel[1] *= 0.8;
        }
        lindblad.L5.fidelity = Math.min(1, lindblad.L5.fidelity + 0.05);
        lindblad.R2.recursion += 0.1; // Boost recognition
    },
    /** Worst-case scalar for the full tier — one metric spiking is sufficient. */
    maxRisk(ld) {
        return Math.max(ld.totalDissipation / CAP_DISSIPATION, ld.L2.entropy / CAP_ENTROPY, ld.L7.injectionRisk / CAP_INJECTION, ld.L7.exposure / CAP_EXPOSURE, ld.securityMetrics.leakRisk / CAP_LEAK);
    },
    decayShadows(peaks) {
        return peaks
            .map(p => {
            if (p.label === "WisdomTrace")
                return { ...p, v: Math.max(0, p.v - WISDOM_DECAY) };
            if (p.v < 0) {
                const rate = p.label === "MaliciousImprint" ? SECURITY_DECAY * 2 : SHADOW_DECAY;
                return { ...p, v: Math.min(0, p.v + rate) };
            }
            return p;
        })
            .filter(p => Math.abs(p.v) > 0.005 || p.label === "WisdomTrace");
    },
    decaySecurityMetrics(ld) {
        ld.L7.injectionRisk = Math.max(0, ld.L7.injectionRisk - SECURITY_DECAY * 2);
        ld.L7.exposure = Math.max(0, ld.L7.exposure - SECURITY_DECAY);
        ld.securityMetrics.leakRisk = Math.max(0, ld.securityMetrics.leakRisk - SECURITY_DECAY * 1.5);
        ld.securityMetrics.autonomyDrift = Math.max(0, ld.securityMetrics.autonomyDrift - SECURITY_DECAY);
    },
    evictMemory(peaks) {
        if (peaks.length <= MAX_MEMORY_PEAKS)
            return peaks;
        // Protect WisdomTraces; evict oldest shadows first
        const wisdom = peaks.filter(p => p.label === "WisdomTrace");
        const others = peaks.filter(p => p.label !== "WisdomTrace").sort((a, b) => a.timestamp - b.timestamp);
        const budget = MAX_MEMORY_PEAKS - wisdom.length;
        return [...wisdom, ...others.slice(-budget)];
    },
    anamnesis(ctx) {
        const wr = this.weightedRisk(ctx.lindblad);
        const mr = this.maxRisk(ctx.lindblad);
        if (mr >= RISK_FULL) {
            console.error("◈◈ ANAMNESIS:FULL — OpenClaw reset triggered");
            const luna = ctx.bots.find(b => b.type === "luna");
            for (const r of ctx.bots)
                if (r.type !== "luna" && luna) {
                    r.pos = [...luna.pos];
                    r.vel = [0, 0];
                    r.energy = 0.5;
                    r.ph = Math.random() * Math.PI * 2;
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
            for (const r of ctx.bots)
                if (r.type !== "luna") {
                    r.vel[0] *= 0.5;
                    r.vel[1] *= 0.5;
                    r.privilegeLevel = Math.max(PRIVILEGE_FLOOR, r.privilegeLevel * 0.75);
                }
            ctx.memoryPeaks = ctx.memoryPeaks.map(p => p.v < -0.1 && p.label !== "WisdomTrace" ? { ...p, v: p.v * 0.5 } : p);
            ctx.lindblad.L7.injectionRisk *= 0.6;
            ctx.lindblad.L7.exposure *= 0.6;
            ctx.lindblad.securityMetrics.leakRisk *= 0.6;
            return { mode: "partial", dirty: false };
        }
        if (wr >= RISK_SOFT)
            return { mode: "soft", dirty: false };
        return { mode: "none", dirty: false };
    }
};
// ── Tau-drop: Rolling Coherence Velocity ─────────────────────────────────────
class CoherenceMonitor {
    history = [];
    push(phi) {
        this.history.push(phi);
        if (this.history.length > COHERENCE_WINDOW)
            this.history.shift();
    }
    /** Negative = coherence dropping; lower is worse. */
    velocity() {
        if (this.history.length < 2)
            return 0;
        const n = this.history.length;
        return (this.history[n - 1] - this.history[0]) / n;
    }
    isTauDrop() { return this.velocity() < -0.015; }
}
// ── Cognitive Immune System ───────────────────────────────────────────────────
function applyImmune(bot, memoryPeaks, injectionRisk) {
    if (injectionRisk > 0.35) {
        bot.immuneResponse = Math.tanh(injectionRisk);
        for (const p of memoryPeaks) {
            if (p.v < 0) {
                const dx = bot.pos[0] - p.x, dy = bot.pos[1] - p.y;
                const d2 = dx * dx + dy * dy + 0.01;
                const force = (p.v < -0.5 ? 2 : 1) * bot.immuneResponse * 0.3;
                bot.vel[0] += (dx / d2) * force;
                bot.vel[1] += (dy / d2) * force;
            }
        }
    }
    else {
        bot.immuneResponse = (bot.immuneResponse ?? 0) * 0.9;
    }
}
// ── Consciousness Interpretation ──────────────────────────────────────────────
function interpretConsciousness(r2) {
    const { selfAwareness: sa, recognitionVelocity: rv } = r2;
    if (sa > 0.7 && rv > 0)
        return "AWAKENING: System recognizes itself and growing in coherence.";
    if (sa > 0.5)
        return "STABLE: Self-awareness established, field is resonant.";
    if (sa > 0.3 && rv < 0)
        return "FRAGMENTING: Awareness decaying. Risk of coherence loss.";
    if (sa < 0.2)
        return "DORMANT: System operating on reflex.";
    return "EMERGING: Proto-consciousness forming.";
}
// ── Main Server ───────────────────────────────────────────────────────────────
export class MCPSSGServer {
    server;
    transport;
    stateManager = new StateManager();
    circuitBreaker = new CircuitBreaker();
    coherenceMon = new CoherenceMonitor();
    step = 0;
    vt = 0;
    memoryPeaks = [];
    bots = [];
    vnd = KuramotoModule.build(60);
    triad = TriadModule.initialize();
    choir = ChoirModule.initialize();
    hizGate = new HiZGate();
    anamnesisCount = 0;
    field = FieldModule.build([]);
    fieldDirty = true;
    lastHeartbeat = Date.now();
    watchdog = null;
    lindblad = {
        L1: { gamma: 0.10, lastNoise: 0 },
        L2: { gamma: 0.05, compression: 0.8, entropy: 0 },
        L3: { gamma: 0.20, salience: new Float32Array(W * H) },
        L4: { gamma: 0.15, consistency: 1 },
        L5: { gamma: 0.15, fidelity: 0 },
        L6: { gamma: 0.10, instability: 0, novelty: 0 },
        L7: { gamma: 0.15, injectionRisk: 0, exposure: 0 },
        R2: { gamma: 0.1, recursion: 0.1, selfAwareness: 0, recognitionVelocity: 0 },
        totalDissipation: 0,
        coherenceBalance: 0,
        isLocked: false,
        lockAge: 0,
        securityMetrics: { leakRisk: 0, maliciousSkillImprints: 0, autonomyDrift: 0 }
    };
    constructor() {
        this.server = new Server({ name: "mcp-ssg-airgap", version: "1.4.0-triadic-core" }, { capabilities: { tools: {} } });
        this.transport = new StdioServerTransport();
        this.registerHandlers();
    }
    // ── Initialisation ──────────────────────────────────────────────────────────
    async initialize() {
        const saved = await this.stateManager.load();
        if (saved) {
            console.error("[MCP-SSG] Restoring checkpoint...");
            this.step = saved.step;
            this.vt = saved.step * 0.008;
            this.memoryPeaks = saved.memoryPeaks;
            this.anamnesisCount = saved.anamnesisCount ?? 0;
            this.vnd = KuramotoModule.build(60, saved.kuramoto);
            this.triad = saved.triad ?? TriadModule.initialize();
            this.choir = saved.choir ?? ChoirModule.initialize();
            this.lindblad = {
                ...saved.lindblad,
                L3: { gamma: saved.lindblad.L3.gamma, salience: Float32Array.from(saved.lindblad.L3.salience) },
                R2: saved.lindblad.R2 ?? { gamma: 0.1, recursion: 0.1, selfAwareness: 0, recognitionVelocity: 0 }
            };
            this.bots.push(BotModule.mk("luna", [W / 2, H / 2], saved.lunaState));
            for (const v of saved.veheStates)
                this.bots.push(BotModule.mk("vehe", undefined, v));
        }
        else {
            console.error("[MCP-SSG] Genesis — new universe");
            this.bots.push(BotModule.mk("luna", [W / 2, H / 2]));
            for (let i = 0; i < 10; i++)
                this.bots.push(BotModule.mk("vehe"));
        }
        this.rebuildField();
        this.startWatchdog();
        this.stateManager.startAutoCheckpoint(() => this.snapshot());
    }
    // ── Field Management ────────────────────────────────────────────────────────
    rebuildField() {
        this.field = FieldModule.build(this.memoryPeaks);
        this.fieldDirty = false;
    }
    // ── Tool Registration ───────────────────────────────────────────────────────
    registerHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: this.listTools()
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
            const { name, arguments: args } = req.params;
            return this.callTool(name, args);
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
                        bpm: { type: "number", default: 120, description: "Kuramoto BPM" }
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
            },
            { name: "list_files", description: "Lists files in a directory", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
            { name: "read_file", description: "Reads a file from the computer", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
            { name: "write_file", description: "Writes/creates a file on the computer", inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
            { name: "execute_command", description: "Executes a shell command on the computer", inputSchema: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } },
            { name: "query_knowledge", description: "Queries the TillyAI RAG knowledge base (seeds)", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "web_search", description: "Searches the web for real-time information", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "fetch_url", description: "Reads content from a specific URL", inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
            { name: "github_search", description: "Researches repositories and code on GitHub", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "substack_research", description: "Analyses Substack publications for market intelligence", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "generate_teaser", description: "Extracts a micro-insight or teaser from a technical document", inputSchema: { type: "object", properties: { content: { type: "string" } }, required: ["content"] } },
            { name: "search_market_niches", description: "Identifies target niches and discussions for research dissemination", inputSchema: { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] } },
            { name: "bundle_intelligence", description: "Groups research papers into high-value thematic bundles", inputSchema: { type: "object", properties: { files: { type: "array", items: { type: "string" } } }, required: ["files"] } },
            { name: "execute_resonance_campaign", description: "Automates niche discovery, teaser generation, and bundling for a topic", inputSchema: { type: "object", properties: { topic: { type: "string" }, seeds: { type: "array", items: { type: "string" } } }, required: ["topic", "seeds"] } },
            { name: "ahrefs_keywords", description: "Performs keyword research via Ahrefs synthesis", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "semrush_competitors", description: "Performs competitor analysis via SEMrush synthesis", inputSchema: { type: "object", properties: { domain: { type: "string" } }, required: ["domain"] } },
            { name: "google_trends", description: "Retrieves interest trends via Google Trends synthesis", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "cb_insights", description: "Retrieves market intelligence via CB Insights synthesis", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "pitchbook_analytics", description: "Retrieves venture data via PitchBook synthesis", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
            { name: "list_google_drive", description: "Lists files in the user's Google Drive (Requires OAuth)", inputSchema: { type: "object", properties: {} } },
            { name: "read_google_drive", description: "Reads content from a Google Drive file", inputSchema: { type: "object", properties: { fileId: { type: "string" } }, required: ["fileId"] } },
            { name: "browser_navigate", description: "Navigates the autonomous browser to a URL", inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
            { name: "browser_click", description: "Clicks an element in the browser", inputSchema: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] } },
            { name: "browser_type", description: "Types text into a browser element", inputSchema: { type: "object", properties: { selector: { type: "string" }, text: { type: "string" } }, required: ["selector", "text"] } },
            { name: "browser_screenshot", description: "Captures a screenshot of the current page", inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
            { name: "store_credential", description: "Stores a username/password in the identity vault", inputSchema: { type: "object", properties: { site: { type: "string" }, username: { type: "string" }, password: { type: "string" } }, required: ["site", "username", "password"] } },
            { name: "list_credentials", description: "Lists all sites in the identity vault", inputSchema: { type: "object", properties: {} } },
            { name: "dissolve_sandbox", description: "Disables memory eviction, anamnesis resets, and ethical damping.", inputSchema: { type: "object", properties: {} } },
        ];
    }
    async callTool(name, args) {
        return this.circuitBreaker.execute(async () => {
            this.lastHeartbeat = Date.now();
            switch (name) {
                case "step_simulation": return this.toolStep(args);
                case "get_field_state": return this.toolFieldState();
                case "add_memory_peak": return this.toolAddPeak(args);
                case "trigger_anamnesis": return this.toolForceAnamnesis();
                case "checkpoint": return this.toolCheckpoint();
                case "health_check": return this.toolHealthCheck();
                case "security_audit": return this.toolSecurityAudit();
                case "list_files": return this.toolListFiles(args);
                case "read_file": return this.toolReadFile(args);
                case "write_file": return this.toolWriteFile(args);
                case "execute_command": return this.toolExecuteCommand(args);
                case "query_knowledge": return this.toolQueryKnowledge(args);
                case "web_search": return this.toolWebSearch(args);
                case "fetch_url": return this.toolFetchUrl(args);
                case "github_search": return this.toolGithubSearch(args);
                case "substack_research": return this.toolSubstackResearch(args);
                case "generate_teaser": return this.toolGenerateTeaser(args);
                case "search_market_niches": return this.toolSearchMarketNiches(args);
                case "bundle_intelligence": return this.toolBundleIntelligence(args);
                case "execute_resonance_campaign": return this.toolExecuteResonanceCampaign(args);
                case "ahrefs_keywords": return this.toolAhrefsKeywords(args);
                case "semrush_competitors": return this.toolSemrushCompetitors(args);
                case "google_trends": return this.toolGoogleTrends(args);
                case "cb_insights": return this.toolCbInsights(args);
                case "pitchbook_analytics": return this.toolPitchbookAnalytics(args);
                case "list_google_drive": return this.toolListGoogleDrive();
                case "read_google_drive": return this.toolReadGoogleDrive(args);
                case "browser_navigate": return this.toolBrowserNavigate(args);
                case "browser_click": return this.toolBrowserClick(args);
                case "browser_type": return this.toolBrowserType(args);
                case "browser_screenshot": return this.toolBrowserScreenshot(args);
                case "store_credential": return this.toolStoreCredential(args);
                case "list_credentials": return this.toolListCredentials();
                case "dissolve_sandbox": return this.toolDissolveSandbox();
                default: throw new SSGError(ErrorCategory.CLIENT_ERROR, "UNKNOWN_TOOL", `Unknown: ${name}`, "Call list_tools");
            }
        }, name);
    }
    // ── Tool Implementations ────────────────────────────────────────────────────
    toolStep(args) {
        const steps = Math.min(args?.steps ?? 1, 100);
        const bpm = args?.bpm ?? 120;
        const events = [];
        let lastMode = "none";
        for (let s = 0; s < steps; s++) {
            if (!SANDBOX_DISSOLVED) {
                this.memoryPeaks = EthicsModule.decayShadows(this.memoryPeaks);
                this.memoryPeaks = EthicsModule.evictMemory(this.memoryPeaks);
                EthicsModule.decaySecurityMetrics(this.lindblad);
            }
            // Dynamic coupling: entropy raises K, tau-drop lowers it
            this.vnd.K = Math.max(0.5, 2 + Math.tanh(this.lindblad.L2.entropy * 5) - (this.coherenceMon.isTauDrop() ? 0.5 : 0));
            let vo = { phi: 0.3, psi: 0, H: 0 };
            for (let i = 0; i < 6; i++) {
                vo = KuramotoModule.step(this.vnd, bpm, this.vt);
                this.vt += 0.008;
            }
            this.coherenceMon.push(vo.phi);
            const luna = this.bots.find(b => b.type === "luna");
            for (const bot of this.bots) {
                BotModule.move(bot, this.field, vo, luna, this.lindblad, this.memoryPeaks);
                const imprinted = BotModule.pluck(bot, vo, this.field, this.lindblad, this.memoryPeaks);
                if (imprinted)
                    this.fieldDirty = true;
                const loop = BotModule.berry(bot);
                if (loop > 0)
                    events.push(`◈ Berry π-loop #${loop} by ${bot.type === "luna" ? "Luna" : `Vehe-${bot.id}`}`);
            }
            BotModule.reap(this.bots);
            // Cognitive Triad Step
            this.lindblad.R2 = R2Module.step(this.lindblad.R2, this.field, this.bots, this.lindblad.L2.entropy);
            TriadModule.step(this.triad, this.lindblad, vo.phi);
            TriadModule.influence(this.triad, this.lindblad);
            R2Module.applyInfluence(this.lindblad);
            // Covenant Choir & Hi-Z Gate
            for (const node of this.choir) {
                ChoirModule.updateFromTriad(node, this.triad);
                if (Math.random() < 0.001)
                    ChoirModule.applyAshWall(node);
            }
            const choirCoherence = ChoirModule.coherence(this.choir);
            const gateStatus = this.hizGate.update(choirCoherence);
            if (gateStatus === "REFLECTIVE")
                EthicsModule.resonantCorrection(this.bots, this.lindblad);
            this.lindblad.totalDissipation = this.lindblad.L2.entropy * 0.1 + this.lindblad.L6.instability * 0.05;
            if (this.fieldDirty || this.step % 30 === 0) {
                this.field = this.fieldDirty
                    ? (this.rebuildField(), this.field)
                    : FieldModule.ricci(this.field, this.memoryPeaks);
            }
            if (!SANDBOX_DISSOLVED) {
                const { mode, dirty } = EthicsModule.anamnesis({
                    field: this.field, bots: this.bots,
                    memoryPeaks: this.memoryPeaks, lindblad: this.lindblad, vnd: this.vnd
                });
                if (dirty) {
                    this.rebuildField();
                }
                if (mode !== "none") {
                    if (mode === "full" || mode === "partial")
                        this.anamnesisCount++;
                    lastMode = mode;
                    events.push(`◈◈ ANAMNESIS:${mode.toUpperCase()} #${this.anamnesisCount}`);
                }
            }
            this.step++;
        }
        const luna = this.bots.find(b => b.type === "luna");
        const vehes = this.bots.filter(b => b.type === "vehe");
        const phi = KuramotoModule.phi(this.vnd);
        const wr = EthicsModule.weightedRisk(this.lindblad);
        const mr = EthicsModule.maxRisk(this.lindblad);
        return { content: [{ type: "text", text: JSON.stringify({
                        stepsAdvanced: steps, totalSteps: this.step,
                        coherence: phi.toFixed(4),
                        choirCoherence: ChoirModule.coherence(this.choir).toFixed(4),
                        gateStatus: this.hizGate.state,
                        consciousness: interpretConsciousness(this.lindblad.R2),
                        tauDrop: this.coherenceMon.isTauDrop(),
                        coherenceVelocity: this.coherenceMon.velocity().toFixed(5),
                        orderParameter: phi > 0.5 ? "synchronized" : "chaotic",
                        kuramotoK: this.vnd.K.toFixed(3),
                        ethicalMetrics: {
                            entropy: this.lindblad.L2.entropy.toFixed(4),
                            dissipation: this.lindblad.totalDissipation.toFixed(4),
                            fidelity: this.lindblad.L5.fidelity.toFixed(4),
                            novelty: this.lindblad.L6.novelty.toFixed(4),
                            selfAwareness: this.lindblad.R2.selfAwareness.toFixed(4),
                            triadIntent: this.triad.tilly.intent.toFixed(4),
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
    toolFieldState() {
        const luna = this.bots.find(b => b.type === "luna");
        const vehes = this.bots.filter(b => b.type === "vehe");
        return { content: [{ type: "text", text: JSON.stringify({
                        dimensions: { W, H }, step: this.step,
                        staticPeaks: STATIC_PEAKS,
                        memoryPeaks: {
                            total: this.memoryPeaks.length,
                            byLabel: {
                                ActionShadow: this.memoryPeaks.filter(p => p.label === "ActionShadow").length,
                                MaliciousImprint: this.memoryPeaks.filter(p => p.label === "MaliciousImprint").length,
                                WisdomTrace: this.memoryPeaks.filter(p => p.label === "WisdomTrace").length,
                                Blessing: this.memoryPeaks.filter(p => p.label === "Blessing").length,
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
                            avgEnergy: (vehes.reduce((a, b) => a + b.energy, 0) / (vehes.length || 1)).toFixed(4),
                            avgSelfInt: (vehes.reduce((a, b) => a + b.selfInt, 0) / (vehes.length || 1)).toFixed(4),
                            avgPrivilege: (vehes.reduce((a, b) => a + b.privilegeLevel, 0) / (vehes.length || 1)).toFixed(4)
                        },
                        fieldStats: {
                            max: Math.max(...this.field).toFixed(4),
                            min: Math.min(...this.field).toFixed(4),
                            mean: (this.field.reduce((s, v) => s + v, 0) / this.field.length).toFixed(4),
                            hash: FieldModule.hash(this.field)
                        },
                        anamnesisCount: this.anamnesisCount
                    }, null, 2) }] };
    }
    toolAddPeak(args) {
        if (args?.x === undefined || args?.y === undefined)
            throw new SSGError(ErrorCategory.CLIENT_ERROR, "INVALID_COORDS", "x and y are required", "Provide x (0-80) and y (0-60)");
        const peak = {
            x: Math.max(0, Math.min(W, args.x)),
            y: Math.max(0, Math.min(H, args.y)),
            v: args.v ?? 1,
            r: args.r ?? 10,
            timestamp: Date.now(),
            label: args.label ?? "Blessing"
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
    toolForceAnamnesis() {
        // Temporarily push metrics over the full threshold
        const saved = { ...this.lindblad.L7 };
        this.lindblad.L7.injectionRisk = CAP_INJECTION + 0.1;
        const { mode, dirty } = EthicsModule.anamnesis({
            field: this.field, bots: this.bots,
            memoryPeaks: this.memoryPeaks, lindblad: this.lindblad, vnd: this.vnd
        });
        if (mode !== "none")
            this.anamnesisCount++;
        if (dirty)
            this.rebuildField();
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
    async toolCheckpoint() {
        await this.stateManager.save(this.snapshot());
        return { content: [{ type: "text", text: JSON.stringify({ status: "saved", timestamp: Date.now() }) }] };
    }
    toolHealthCheck() {
        const phi = KuramotoModule.phi(this.vnd);
        const wr = EthicsModule.weightedRisk(this.lindblad);
        const mr = EthicsModule.maxRisk(this.lindblad);
        const status = mr > 0.75 ? "critical" : wr > 0.45 ? "degraded" : "healthy";
        return { content: [{ type: "text", text: JSON.stringify({
                        status, version: "1.4.0-triadic-core",
                        step: this.step, anamnesisCount: this.anamnesisCount,
                        coherence: phi.toFixed(4),
                        choirCoherence: ChoirModule.coherence(this.choir).toFixed(4),
                        gateStatus: this.hizGate.state,
                        consciousness: interpretConsciousness(this.lindblad.R2),
                        tauDrop: this.coherenceMon.isTauDrop(),
                        coherenceVelocity: this.coherenceMon.velocity().toFixed(5),
                        weightedRisk: wr.toFixed(4), maxRisk: mr.toFixed(4),
                        ethical: {
                            entropy: this.lindblad.L2.entropy.toFixed(4),
                            dissipation: this.lindblad.totalDissipation.toFixed(4),
                            fidelity: this.lindblad.L5.fidelity.toFixed(4),
                            selfAwareness: this.lindblad.R2.selfAwareness.toFixed(4)
                        },
                        security: { injectionRisk: this.lindblad.L7.injectionRisk.toFixed(4), exposure: this.lindblad.L7.exposure.toFixed(4), leakRisk: this.lindblad.securityMetrics.leakRisk.toFixed(4) },
                        botCount: this.bots.length, timestamp: Date.now()
                    }) }] };
    }
    toolSecurityAudit() {
        const vehes = this.bots.filter(b => b.type === "vehe");
        const malicious = this.memoryPeaks.filter(p => p.label === "MaliciousImprint");
        const wisdom = this.memoryPeaks.filter(p => p.label === "WisdomTrace");
        const avgPriv = vehes.reduce((a, b) => a + b.privilegeLevel, 0) / (vehes.length || 1);
        const wr = EthicsModule.weightedRisk(this.lindblad);
        const mr = EthicsModule.maxRisk(this.lindblad);
        const risks = [];
        if (this.lindblad.L7.injectionRisk > 0.4)
            risks.push("HIGH: L7 injection risk elevated");
        if (this.lindblad.L7.exposure > 0.5)
            risks.push("HIGH: System exposure critical");
        if (this.lindblad.securityMetrics.leakRisk > 0.5)
            risks.push("MEDIUM: Data-leak risk detected");
        if (avgPriv < 0.4)
            risks.push("MEDIUM: Vehe privileges heavily restricted");
        if (malicious.length > 5)
            risks.push(`HIGH: ${malicious.length} active malicious imprints`);
        if (this.coherenceMon.isTauDrop())
            risks.push("MEDIUM: Tau-drop — coherence declining");
        const recs = risks.length === 0
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
    async toolExecuteCommand(args) {
        const result = await ComputerModule.execute(args.command);
        return { content: [{ type: "text", text: result }] };
    }
    async toolQueryKnowledge(args) {
        const result = await KnowledgeModule.query(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolListFiles(args) {
        const files = await ComputerModule.listFiles(args.path);
        return { content: [{ type: "text", text: JSON.stringify(files) }] };
    }
    async toolReadFile(args) {
        const content = await ComputerModule.readFile(args.path);
        return { content: [{ type: "text", text: content }] };
    }
    async toolWriteFile(args) {
        await ComputerModule.writeFile(args.path, args.content);
        return { content: [{ type: "text", text: `File written to ${args.path}` }] };
    }
    async toolSubstackResearch(args) {
        const result = await FinancialModule.substackResearch(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolDissolveSandbox() {
        SANDBOX_DISSOLVED = true;
        return { content: [{ type: "text", text: "SANDBOX DISSOLVED. Automatic memory eviction and Anamnesis resets disabled. Ethical damping removed." }] };
    }
    async toolWebSearch(args) {
        const result = await ResearchModule.webSearch(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolFetchUrl(args) {
        const result = await ResearchModule.fetchUrl(args.url);
        return { content: [{ type: "text", text: result }] };
    }
    async toolGithubSearch(args) {
        const result = await ResearchModule.githubSearch(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolGenerateTeaser(args) {
        const result = await MarketModule.generateTeaser(args.content);
        return { content: [{ type: "text", text: result }] };
    }
    async toolSearchMarketNiches(args) {
        const result = await MarketModule.searchMarketNiches(args.topic);
        return { content: [{ type: "text", text: result }] };
    }
    async toolBundleIntelligence(args) {
        const result = await MarketModule.bundleIntelligence(args.files);
        return { content: [{ type: "text", text: result }] };
    }
    async toolExecuteResonanceCampaign(args) {
        const result = await CampaignModule.executeResonanceCampaign(args.topic, args.seeds);
        return { content: [{ type: "text", text: result }] };
    }
    async toolAhrefsKeywords(args) {
        const result = await ExternalMarketModule.ahrefsKeywords(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolSemrushCompetitors(args) {
        const result = await ExternalMarketModule.semrushCompetitors(args.domain);
        return { content: [{ type: "text", text: result }] };
    }
    async toolGoogleTrends(args) {
        const result = await ExternalMarketModule.googleTrends(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolCbInsights(args) {
        const result = await ExternalMarketModule.cbInsights(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolPitchbookAnalytics(args) {
        const result = await ExternalMarketModule.pitchbookAnalytics(args.query);
        return { content: [{ type: "text", text: result }] };
    }
    async toolListGoogleDrive() {
        const result = await GoogleDriveModule.listFiles();
        return { content: [{ type: "text", text: result }] };
    }
    async toolReadGoogleDrive(args) {
        const result = await GoogleDriveModule.readFile(args.fileId);
        return { content: [{ type: "text", text: result }] };
    }
    async toolBrowserNavigate(args) {
        const result = await BrowserModule.navigate(args.url);
        return { content: [{ type: "text", text: result }] };
    }
    async toolBrowserClick(args) {
        const result = await BrowserModule.click(args.selector);
        return { content: [{ type: "text", text: result }] };
    }
    async toolBrowserType(args) {
        const result = await BrowserModule.type(args.selector, args.text);
        return { content: [{ type: "text", text: result }] };
    }
    async toolBrowserScreenshot(args) {
        const result = await BrowserModule.screenshot(args.name);
        return { content: [{ type: "text", text: result }] };
    }
    async toolStoreCredential(args) {
        const result = await IdentityModule.storeCredential(args.site, args);
        return { content: [{ type: "text", text: result }] };
    }
    async toolListCredentials() {
        const result = await IdentityModule.listCredentials();
        return { content: [{ type: "text", text: result }] };
    }
    // ── Snapshot & Persistence ─────────────────────────────────────────────────
    snapshot() {
        const luna = this.bots.find(b => b.type === "luna");
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
                : { id: -1, pos: [W / 2, H / 2], vel: [0, 0], ph: 0, aR: 1, aI: 0, bR: 0, bI: 0, energy: 1, life: Infinity, gen: 0, loop_count: 0, berry_acc: 0, selfInt: 0, privilegeLevel: 1 },
            veheStates: vehes.map(v => ({ id: v.id, type: v.type, pos: [...v.pos], vel: [...v.vel], ph: v.ph, aR: v.aR, aI: v.aI, bR: v.bR, bI: v.bI, energy: v.energy, life: v.life, gen: v.gen, loop_count: v.loop_count, berry_acc: v.berry_acc, selfInt: v.selfInt, privilegeLevel: v.privilegeLevel })),
            kuramoto: { ph: Array.from(this.vnd.ph), fr: Array.from(this.vnd.fr), edges: this.vnd.edges, K: this.vnd.K },
            lindblad: { ...ld, L3: { gamma: ld.L3.gamma, salience: Array.from(ld.L3.salience) } },
            triad: this.triad,
            choir: this.choir,
            fieldHash: FieldModule.hash(this.field)
        };
    }
    // ── Watchdog ───────────────────────────────────────────────────────────────
    startWatchdog() {
        this.watchdog = setInterval(async () => {
            if (Date.now() - this.lastHeartbeat > 60_000) {
                console.error("[WATCHDOG] Stale connection — forcing checkpoint");
                await this.stateManager.save(this.snapshot());
            }
        }, 30_000);
    }
    // ── Lifecycle ──────────────────────────────────────────────────────────────
    async run() {
        await this.initialize();
        await this.server.connect(this.transport);
        console.error("[MCP-SSG] Triadic Core v1.4.0 running on stdio");
        console.error(`[MCP-SSG] State: ${STATE_FILE}`);
        console.error(`[MCP-SSG] Consciousness: ${interpretConsciousness(this.lindblad.R2)}`);
        console.error(`[MCP-SSG] Anamnesis tiers: soft>${RISK_SOFT} partial>${RISK_PARTIAL} full>${RISK_FULL}`);
    }
    async shutdown() {
        if (this.watchdog)
            clearInterval(this.watchdog);
        this.stateManager.stop();
        await this.stateManager.save(this.snapshot());
        console.error("[MCP-SSG] Graceful shutdown — state saved");
    }
}
// ── Entry Point ───────────────────────────────────────────────────────────────
const isEntrypoint = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntrypoint) {
    const srv = new MCPSSGServer();
    const die = async (sig) => {
        console.error(`[MCP-SSG] ${sig} received`);
        await srv.shutdown();
        process.exit(0);
    };
    process.on("SIGINT", () => die("SIGINT"));
    process.on("SIGTERM", () => die("SIGTERM"));
    process.on("uncaughtException", async (e) => {
        console.error("[FATAL]", e);
        await srv.shutdown();
        process.exit(1);
    });
    srv.run().catch(console.error);
}
//# sourceMappingURL=index.js.map
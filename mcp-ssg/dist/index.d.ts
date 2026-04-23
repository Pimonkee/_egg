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
export declare class MCPSSGServer {
    private readonly server;
    private readonly transport;
    private readonly stateManager;
    private readonly circuitBreaker;
    private readonly coherenceMon;
    private step;
    private vt;
    private memoryPeaks;
    private bots;
    private vnd;
    private anamnesisCount;
    private field;
    private fieldDirty;
    private lastHeartbeat;
    private watchdog;
    private lindblad;
    constructor();
    initialize(): Promise<void>;
    private rebuildField;
    private registerHandlers;
    listTools(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                steps: {
                    type: string;
                    default: number;
                    description: string;
                };
                bpm: {
                    type: string;
                    default: number;
                    description: string;
                };
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            required: string[];
            properties: {
                x: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
                y: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
                v: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    default: number;
                };
                r: {
                    type: string;
                    minimum: number;
                    maximum: number;
                    default: number;
                };
                label: {
                    type: string;
                    enum: string[];
                    default: string;
                };
                steps?: undefined;
                bpm?: undefined;
            };
        };
    })[];
    callTool(name: string, args?: Record<string, unknown>): Promise<any>;
    private toolStep;
    private toolFieldState;
    private toolAddPeak;
    private toolForceAnamnesis;
    private toolCheckpoint;
    private toolHealthCheck;
    private toolSecurityAudit;
    private snapshot;
    private startWatchdog;
    run(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map
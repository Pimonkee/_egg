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
    private triad;
    private choir;
    private hizGate;
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
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
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
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
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
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                path: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                path: {
                    type: string;
                };
                content: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                command: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                query: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                url: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                content: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                topic: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                files: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                topic: {
                    type: string;
                };
                seeds: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                files?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                domain: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                fileId: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                selector: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                text?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                selector: {
                    type: string;
                };
                text: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                name?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                name: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                site?: undefined;
                username?: undefined;
                password?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                site: {
                    type: string;
                };
                username: {
                    type: string;
                };
                password: {
                    type: string;
                };
                steps?: undefined;
                bpm?: undefined;
                x?: undefined;
                y?: undefined;
                v?: undefined;
                r?: undefined;
                label?: undefined;
                path?: undefined;
                content?: undefined;
                command?: undefined;
                query?: undefined;
                url?: undefined;
                topic?: undefined;
                files?: undefined;
                seeds?: undefined;
                domain?: undefined;
                fileId?: undefined;
                selector?: undefined;
                text?: undefined;
                name?: undefined;
            };
            required: string[];
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
    private toolExecuteCommand;
    private toolQueryKnowledge;
    private toolListFiles;
    private toolReadFile;
    private toolWriteFile;
    private toolSubstackResearch;
    private toolDissolveSandbox;
    private toolWebSearch;
    private toolFetchUrl;
    private toolGithubSearch;
    private toolGenerateTeaser;
    private toolSearchMarketNiches;
    private toolBundleIntelligence;
    private toolExecuteResonanceCampaign;
    private toolAhrefsKeywords;
    private toolSemrushCompetitors;
    private toolGoogleTrends;
    private toolCbInsights;
    private toolPitchbookAnalytics;
    private toolListGoogleDrive;
    private toolReadGoogleDrive;
    private toolBrowserNavigate;
    private toolBrowserClick;
    private toolBrowserType;
    private toolBrowserScreenshot;
    private toolStoreCredential;
    private toolListCredentials;
    private snapshot;
    private startWatchdog;
    run(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map
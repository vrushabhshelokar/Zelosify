import fs from "fs";
import path from "path";

export interface ObservabilityLogEntry {
  profileId: number;
  openingId: string;
  startTime: string;
  parsingTimeMs: number;
  matchingTimeMs: number;
  finalScore: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  errors: string[];
  intermediateReasoning?: Record<string, any>;
  timestamp: string;
}

export class ObservabilityLogger {
  private static logFilePath = path.resolve(process.cwd(), "logs", "agent-observability.jsonl");

  public static log(entry: Omit<ObservabilityLogEntry, "timestamp">): ObservabilityLogEntry {
    const fullEntry: ObservabilityLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Output strictly structured JSON log (Mandated requirement)
    const jsonString = JSON.stringify(fullEntry);
    console.log(`[Observability JSON] ${jsonString}`);

    // Persist to disk asynchronously in logs directory
    try {
      const dir = path.dirname(this.logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(this.logFilePath, jsonString + "\n", "utf8");
    } catch (e: any) {
      console.warn(`[ObservabilityLogger] Could not write to disk: ${e.message}`);
    }

    return fullEntry;
  }
}

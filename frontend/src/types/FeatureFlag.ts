export type Environment = "DEV" | "TEST" | "PROD";

export interface FeatureFlag {
    id: number;
    key: string;
    environment: Environment;
    enabled: boolean;
}

export type AuditAction =
    | "CREATED"
    | "UPDATED"
    | "ENABLED"
    | "DISABLED"
    | "DELETED";

export interface AuditLog {
    id: number;
    flagKey: string;
    environment: Environment;
    action: AuditAction;
    oldValue: boolean | null;
    newValue: boolean | null;
    changedBy: string;
    changedAt: string;
}
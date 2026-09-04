export interface FeatureFlag {
    id: number;
    key: string;
    environment: string;
    enabled: boolean;
}
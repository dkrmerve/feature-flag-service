import type { FeatureFlag } from "../types/FeatureFlag";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080";

const FEATURE_FLAGS_URL = `${API_URL}/api/flags`;

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await fetch(FEATURE_FLAGS_URL);

    if (!response.ok) {
        throw new Error("Failed to fetch feature flags");
    }

    return response.json();
}

export async function createFeatureFlag(
    key: string,
    environment: string,
    enabled: boolean
): Promise<FeatureFlag> {
    const response = await fetch(FEATURE_FLAGS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            key,
            environment,
            enabled,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to create feature flag");
    }

    return response.json();
}

export async function updateFeatureFlag(
    id: number,
    key: string,
    environment: string,
    enabled: boolean
): Promise<FeatureFlag> {
    const response = await fetch(
        `${FEATURE_FLAGS_URL}/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key,
                environment,
                enabled,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update feature flag");
    }

    return response.json();
}

export async function toggleFeatureFlag(
    id: number
): Promise<FeatureFlag> {
    const response = await fetch(
        `${FEATURE_FLAGS_URL}/${id}/toggle`,
        {
            method: "PUT",
        }
    );

    if (!response.ok) {
        throw new Error("Failed to toggle feature flag");
    }

    return response.json();
}

export async function deleteFeatureFlag(
    id: number
): Promise<void> {
    const response = await fetch(
        `${FEATURE_FLAGS_URL}/${id}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete feature flag");
    }
}
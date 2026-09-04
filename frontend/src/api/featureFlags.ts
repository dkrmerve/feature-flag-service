import type {
    AuditLog,
    Environment,
    FeatureFlag,
} from "../types/FeatureFlag";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080";

const FEATURE_FLAGS_URL = `${API_URL}/api/flags`;
const AUDIT_URL = `${API_URL}/api/audit`;

async function throwApiError(
    response: Response,
    fallbackMessage: string
): Promise<never> {
    let message = fallbackMessage;

    try {
        const body = (await response.json()) as {
            message?: string;
        };

        if (body.message) {
            message = body.message;
        }
    } catch {
        // Response body may be empty or non-JSON.
    }

    throw new Error(message);
}

function mutationHeaders(
    changedBy: string
): HeadersInit {
    return {
        "Content-Type": "application/json",
        "X-Changed-By":
            changedBy.trim() || "web-ui",
    };
}

export async function getFeatureFlags(
    environment?: Environment
): Promise<FeatureFlag[]> {
    const url = new URL(FEATURE_FLAGS_URL);

    if (environment) {
        url.searchParams.set(
            "environment",
            environment
        );
    }

    const response = await fetch(url);

    if (!response.ok) {
        return throwApiError(
            response,
            "Failed to fetch feature flags"
        );
    }

    return response.json();
}

export async function createFeatureFlag(
    key: string,
    environment: Environment,
    enabled: boolean,
    changedBy: string
): Promise<FeatureFlag> {
    const response = await fetch(
        FEATURE_FLAGS_URL,
        {
            method: "POST",
            headers: mutationHeaders(changedBy),
            body: JSON.stringify({
                key,
                environment,
                enabled,
            }),
        }
    );

    if (!response.ok) {
        return throwApiError(
            response,
            "Failed to create feature flag"
        );
    }

    return response.json();
}

export async function updateFeatureFlag(
    id: number,
    key: string,
    environment: Environment,
    enabled: boolean,
    changedBy: string
): Promise<FeatureFlag> {
    const response = await fetch(
        `${FEATURE_FLAGS_URL}/${id}`,
        {
            method: "PUT",
            headers: mutationHeaders(changedBy),
            body: JSON.stringify({
                key,
                environment,
                enabled,
            }),
        }
    );

    if (!response.ok) {
        return throwApiError(
            response,
            "Failed to update feature flag"
        );
    }

    return response.json();
}

export async function toggleFeatureFlag(
    id: number,
    changedBy: string
): Promise<FeatureFlag> {
    const response = await fetch(
        `${FEATURE_FLAGS_URL}/${id}/toggle`,
        {
            method: "PUT",
            headers: {
                "X-Changed-By":
                    changedBy.trim() || "web-ui",
            },
        }
    );

    if (!response.ok) {
        return throwApiError(
            response,
            "Failed to toggle feature flag"
        );
    }

    return response.json();
}

export async function deleteFeatureFlag(
    id: number,
    changedBy: string
): Promise<void> {
    const response = await fetch(
        `${FEATURE_FLAGS_URL}/${id}`,
        {
            method: "DELETE",
            headers: {
                "X-Changed-By":
                    changedBy.trim() || "web-ui",
            },
        }
    );

    if (!response.ok) {
        await throwApiError(
            response,
            "Failed to delete feature flag"
        );
    }
}

export async function getAuditLogs(
    environment?: Environment,
    flagKey?: string
): Promise<AuditLog[]> {
    const url = new URL(AUDIT_URL);

    if (environment) {
        url.searchParams.set(
            "environment",
            environment
        );
    }

    if (flagKey?.trim()) {
        url.searchParams.set(
            "flagKey",
            flagKey.trim()
        );
    }

    const response = await fetch(url);

    if (!response.ok) {
        return throwApiError(
            response,
            "Failed to fetch audit logs"
        );
    }

    return response.json();
}
package com.dkrmerve;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/audit")
@Produces(MediaType.APPLICATION_JSON)
public class AuditLogResource {

    @GET
    public List<AuditLog> getAuditLogs(
            @QueryParam("flagKey") String flagKey,
            @QueryParam("environment") Environment environment
    ) {

        if (flagKey != null && environment != null) {
            return AuditLog.list(
                    "flagKey = ?1 and environment = ?2 order by changedAt desc",
                    flagKey,
                    environment
            );
        }

        if (flagKey != null) {
            return AuditLog.list(
                    "flagKey = ?1 order by changedAt desc",
                    flagKey
            );
        }

        if (environment != null) {
            return AuditLog.list(
                    "environment = ?1 order by changedAt desc",
                    environment
            );
        }

        return AuditLog.list("order by changedAt desc");
    }
}
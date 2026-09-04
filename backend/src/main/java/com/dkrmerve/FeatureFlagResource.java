package com.dkrmerve;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/api/flags")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FeatureFlagResource {

    @GET
    public List<FeatureFlag> getAllFlags(
            @QueryParam("environment") Environment environment
    ) {

        if (environment == null) {
            return FeatureFlag.listAll();
        }

        return FeatureFlag.list(
                "environment",
                environment
        );
    }

    @POST
    @Transactional
    public Response createFlag(
            @Valid FeatureFlag request,
            @HeaderParam("X-Changed-By") String changedBy
    ) {

        String trimmedKey = request.key.trim();

        FeatureFlag existingFlag =
                FeatureFlag.find(
                        "key = ?1 and environment = ?2",
                        trimmedKey,
                        request.environment
                ).firstResult();

        if (existingFlag != null) {
            return Response
                    .status(Response.Status.CONFLICT)
                    .entity(
                            Map.of(
                                    "message",
                                    "A feature flag with this key already exists in this environment"
                            )
                    )
                    .build();
        }

        FeatureFlag created =
                new FeatureFlag(
                        trimmedKey,
                        request.environment,
                        request.enabled
                );

        created.persist();

        createAuditLog(
                created.key,
                created.environment,
                AuditAction.CREATED,
                null,
                created.enabled,
                changedBy
        );

        return Response
                .status(Response.Status.CREATED)
                .entity(created)
                .build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response updateFlag(
            @PathParam("id") Long id,
            @Valid FeatureFlag request,
            @HeaderParam("X-Changed-By") String changedBy
    ) {

        FeatureFlag flag =
                FeatureFlag.findById(id);

        if (flag == null) {
            return Response
                    .status(Response.Status.NOT_FOUND)
                    .entity(
                            Map.of(
                                    "message",
                                    "Feature flag not found"
                            )
                    )
                    .build();
        }

        String trimmedKey = request.key.trim();

        FeatureFlag duplicate =
                FeatureFlag.find(
                        "key = ?1 and environment = ?2 and id <> ?3",
                        trimmedKey,
                        request.environment,
                        id
                ).firstResult();

        if (duplicate != null) {
            return Response
                    .status(Response.Status.CONFLICT)
                    .entity(
                            Map.of(
                                    "message",
                                    "A feature flag with this key already exists in this environment"
                            )
                    )
                    .build();
        }

        boolean oldValue = flag.enabled;

        flag.key = trimmedKey;
        flag.environment = request.environment;
        flag.enabled = request.enabled;

        createAuditLog(
                flag.key,
                flag.environment,
                AuditAction.UPDATED,
                oldValue,
                flag.enabled,
                changedBy
        );

        return Response
                .ok(flag)
                .build();
    }

    @PUT
    @Path("/{id}/toggle")
    @Transactional
    public Response toggleFlag(
            @PathParam("id") Long id,
            @HeaderParam("X-Changed-By") String changedBy
    ) {

        FeatureFlag flag =
                FeatureFlag.findById(id);

        if (flag == null) {
            return Response
                    .status(Response.Status.NOT_FOUND)
                    .entity(
                            Map.of(
                                    "message",
                                    "Feature flag not found"
                            )
                    )
                    .build();
        }

        boolean oldValue = flag.enabled;

        flag.enabled = !flag.enabled;

        AuditAction action =
                flag.enabled
                        ? AuditAction.ENABLED
                        : AuditAction.DISABLED;

        createAuditLog(
                flag.key,
                flag.environment,
                action,
                oldValue,
                flag.enabled,
                changedBy
        );

        return Response
                .ok(flag)
                .build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deleteFlag(
            @PathParam("id") Long id,
            @HeaderParam("X-Changed-By") String changedBy
    ) {

        FeatureFlag flag =
                FeatureFlag.findById(id);

        if (flag == null) {
            return Response
                    .status(Response.Status.NOT_FOUND)
                    .entity(
                            Map.of(
                                    "message",
                                    "Feature flag not found"
                            )
                    )
                    .build();
        }

        String flagKey = flag.key;
        Environment environment = flag.environment;
        boolean oldValue = flag.enabled;

        flag.delete();

        createAuditLog(
                flagKey,
                environment,
                AuditAction.DELETED,
                oldValue,
                null,
                changedBy
        );

        return Response
                .noContent()
                .build();
    }

    private void createAuditLog(
            String flagKey,
            Environment environment,
            AuditAction action,
            Boolean oldValue,
            Boolean newValue,
            String changedBy
    ) {

        String actor =
                changedBy == null || changedBy.isBlank()
                        ? "system"
                        : changedBy.trim();

        AuditLog auditLog =
                new AuditLog(
                        flagKey,
                        environment,
                        action,
                        oldValue,
                        newValue,
                        actor
                );

        auditLog.persist();
    }
}
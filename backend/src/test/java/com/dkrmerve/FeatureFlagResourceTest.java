package com.dkrmerve;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Locale;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class FeatureFlagResourceTest {
    static {
        Locale.setDefault(Locale.US);
        Locale.setDefault(Locale.Category.DISPLAY, Locale.US);
        Locale.setDefault(Locale.Category.FORMAT, Locale.US);
    }
    @BeforeEach
    @Transactional
    void cleanDatabase() {
        FeatureFlag.deleteAll();
    }

    @Test
    void shouldReturnEmptyFlagList() {
        given()
                .when()
                .get("/api/flags")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));
    }

    @Test
    void shouldCreateFeatureFlag() {
        String requestBody = """
                {
                  "key": "payment-v2",
                  "environment": "DEV",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .post("/api/flags")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("key", equalTo("payment-v2"))
                .body("environment", equalTo("DEV"))
                .body("enabled", equalTo(true));
    }

    @Test
    void shouldReturnCreatedFeatureFlagInList() {
        createFlag(
                "checkout-v2",
                "TEST",
                false
        );

        given()
                .when()
                .get("/api/flags")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].key", equalTo("checkout-v2"))
                .body("[0].environment", equalTo("TEST"))
                .body("[0].enabled", equalTo(false));
    }

    @Test
    void shouldAllowSameKeyInDifferentEnvironments() {
        createFlag("payment-v2", "DEV", true);
        createFlag("payment-v2", "TEST", false);
        createFlag("payment-v2", "PROD", false);

        given()
                .when()
                .get("/api/flags")
                .then()
                .statusCode(200)
                .body("$", hasSize(3));
    }

    @Test
    void shouldRejectDuplicateKeyInSameEnvironment() {
        createFlag(
                "duplicate-test",
                "DEV",
                true
        );

        String requestBody = """
                {
                  "key": "duplicate-test",
                  "environment": "DEV",
                  "enabled": false
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .expect()
                .statusCode(409)
                .body(
                        "message",
                        equalTo(
                                "A feature flag with this key already exists in this environment"
                        )
                )
                .when()
                .post("/api/flags");
    }

    @Test
    void shouldFilterFlagsByEnvironment() {
        createFlag("feature-one", "DEV", true);
        createFlag("feature-two", "DEV", false);
        createFlag("feature-three", "PROD", true);

        given()
                .queryParam("environment", "DEV")
                .when()
                .get("/api/flags")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("[0].environment", equalTo("DEV"))
                .body("[1].environment", equalTo("DEV"));
    }

    @Test
    void shouldRejectInvalidEnvironment() {
        String requestBody = """
                {
                  "key": "invalid-environment",
                  "environment": "BANANA",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .expect()
                .statusCode(400)
                .when()
                .post("/api/flags");
    }

    @Test
    void shouldRejectBlankKey() {
        String requestBody = """
                {
                  "key": "",
                  "environment": "DEV",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .expect()
                .statusCode(400)
                .when()
                .post("/api/flags");
    }

    @Test
    void shouldUpdateFeatureFlag() {
        long id = createFlag(
                "old-feature",
                "DEV",
                false
        );

        String updateRequest = """
                {
                  "key": "new-feature",
                  "environment": "PROD",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .when()
                .put("/api/flags/" + id)
                .then()
                .statusCode(200)
                .body("key", equalTo("new-feature"))
                .body("environment", equalTo("PROD"))
                .body("enabled", equalTo(true));
    }

    @Test
    void shouldRejectDuplicateWhenUpdatingFlag() {
        createFlag(
                "payment-v2",
                "PROD",
                false
        );

        long devFlagId = createFlag(
                "checkout-v2",
                "DEV",
                true
        );

        String updateRequest = """
                {
                  "key": "payment-v2",
                  "environment": "PROD",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(updateRequest)
                .expect()
                .statusCode(409)
                .body(
                        "message",
                        equalTo(
                                "A feature flag with this key already exists in this environment"
                        )
                )
                .when()
                .put("/api/flags/" + devFlagId);
    }

    @Test
    void shouldToggleFeatureFlag() {
        long id = createFlag(
                "toggle-test",
                "DEV",
                false
        );

        given()
                .when()
                .put("/api/flags/" + id + "/toggle")
                .then()
                .statusCode(200)
                .body("enabled", equalTo(true));

        given()
                .when()
                .put("/api/flags/" + id + "/toggle")
                .then()
                .statusCode(200)
                .body("enabled", equalTo(false));
    }

    @Test
    void shouldDeleteFeatureFlag() {
        long id = createFlag(
                "delete-test",
                "TEST",
                true
        );

        given()
                .when()
                .delete("/api/flags/" + id)
                .then()
                .statusCode(204);

        given()
                .when()
                .get("/api/flags")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));
    }

    @Test
    void shouldReturn404WhenUpdatingUnknownFlag() {
        String requestBody = """
                {
                  "key": "unknown",
                  "environment": "DEV",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .expect()
                .statusCode(404)
                .when()
                .put("/api/flags/999999");
    }

    @Test
    void shouldReturn404WhenTogglingUnknownFlag() {
        given()
                .expect()
                .statusCode(404)
                .when()
                .put("/api/flags/999999/toggle");
    }

    @Test
    void shouldReturn404WhenDeletingUnknownFlag() {
        given()
                .expect()
                .statusCode(404)
                .when()
                .delete("/api/flags/999999");
    }

    private long createFlag(
            String key,
            String environment,
            boolean enabled
    ) {
        String requestBody = """
                {
                  "key": "%s",
                  "environment": "%s",
                  "enabled": %s
                }
                """.formatted(
                key,
                environment,
                enabled
        );

        Number id = given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .post("/api/flags")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        return id.longValue();
    }
}
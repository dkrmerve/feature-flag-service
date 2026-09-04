package com.dkrmerve;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class FeatureFlagResourceTest {

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
                  "environment": "development",
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
                .body("environment", equalTo("development"))
                .body("enabled", equalTo(true));
    }

    @Test
    void shouldReturnCreatedFeatureFlagInList() {
        createFlag(
                "checkout-v2",
                "staging",
                false
        );

        given()
                .when()
                .get("/api/flags")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].key", equalTo("checkout-v2"))
                .body("[0].environment", equalTo("staging"))
                .body("[0].enabled", equalTo(false));
    }

    @Test
    void shouldRejectDuplicateKey() {
        createFlag(
                "duplicate-test",
                "development",
                true
        );

        String requestBody = """
                {
                  "key": "duplicate-test",
                  "environment": "production",
                  "enabled": false
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .post("/api/flags")
                .then()
                .statusCode(409)
                .body(
                        "message",
                        equalTo(
                                "A feature flag with this key already exists"
                        )
                );
    }

    @Test
    void shouldRejectInvalidEnvironment() {
        String requestBody = """
                {
                  "key": "invalid-environment",
                  "environment": "banana",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .post("/api/flags")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldRejectBlankKey() {
        String requestBody = """
                {
                  "key": "",
                  "environment": "development",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .post("/api/flags")
                .then()
                .statusCode(400);
    }

    @Test
    void shouldUpdateFeatureFlag() {
        Integer id = createFlag(
                "old-feature",
                "development",
                false
        );

        String updateRequest = """
                {
                  "key": "new-feature",
                  "environment": "production",
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
                .body("id", equalTo(id))
                .body("key", equalTo("new-feature"))
                .body("environment", equalTo("production"))
                .body("enabled", equalTo(true));
    }

    @Test
    void shouldToggleFeatureFlag() {
        Integer id = createFlag(
                "toggle-test",
                "development",
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
        Integer id = createFlag(
                "delete-test",
                "staging",
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
                  "environment": "development",
                  "enabled": true
                }
                """;

        given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .put("/api/flags/999999")
                .then()
                .statusCode(404);
    }

    @Test
    void shouldReturn404WhenTogglingUnknownFlag() {
        given()
                .when()
                .put("/api/flags/999999/toggle")
                .then()
                .statusCode(404);
    }

    @Test
    void shouldReturn404WhenDeletingUnknownFlag() {
        given()
                .when()
                .delete("/api/flags/999999")
                .then()
                .statusCode(404);
    }

    private Integer createFlag(
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

        return given()
                .contentType(ContentType.JSON)
                .body(requestBody)
                .when()
                .post("/api/flags")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }
}
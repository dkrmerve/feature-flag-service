package com.dkrmerve;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(
        name = "feature_flags",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"flag_key", "environment"})
        }
)
public class FeatureFlag extends PanacheEntity {

    @NotBlank(message = "Feature flag key cannot be empty")
    @Column(name = "flag_key", nullable = false)
    public String key;

    @NotNull(message = "Environment cannot be empty")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Environment environment;

    @Column(nullable = false)
    public boolean enabled;

    public FeatureFlag() {
    }

    public FeatureFlag(
            String key,
            Environment environment,
            boolean enabled
    ) {
        this.key = key;
        this.environment = environment;
        this.enabled = enabled;
    }
}
package com.dkrmerve;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Entity
@Table(name = "feature_flags")
public class FeatureFlag extends PanacheEntity {

    @NotBlank(message = "Feature flag key cannot be empty")
    @Column(nullable = false, unique = true)
    public String key;

    @NotBlank(message = "Environment cannot be empty")
    @Pattern(
            regexp = "development|staging|production",
            message = "Environment must be development, staging or production"
    )
    @Column(nullable = false)
    public String environment;

    @Column(nullable = false)
    public boolean enabled;

    public FeatureFlag() {
    }

    public FeatureFlag(String key, String environment, boolean enabled) {
        this.key = key;
        this.environment = environment;
        this.enabled = enabled;
    }
}
package com.dkrmerve;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog extends PanacheEntity {

    @Column(name = "flag_key", nullable = false)
    public String flagKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Environment environment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public AuditAction action;

    @Column(name = "old_value")
    public Boolean oldValue;

    @Column(name = "new_value")
    public Boolean newValue;

    @Column(name = "changed_by", nullable = false)
    public String changedBy;

    @Column(name = "changed_at", nullable = false)
    public Instant changedAt;

    public AuditLog() {
    }

    public AuditLog(
            String flagKey,
            Environment environment,
            AuditAction action,
            Boolean oldValue,
            Boolean newValue,
            String changedBy
    ) {
        this.flagKey = flagKey;
        this.environment = environment;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.changedBy = changedBy;
        this.changedAt = Instant.now();
    }
}
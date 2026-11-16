package de.ichbinhier.volunteerformservice.application;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.hibernate.annotations.CreationTimestamp;

import de.ichbinhier.volunteerformservice.FieldLimits;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.staff.Staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(
        name = "applications",
        uniqueConstraints =
        @UniqueConstraint(
                name = "uk_applications_submission_id",
                columnNames = "submission_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "submission_id", nullable = false, updatable = false)
    private UUID submissionId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "category_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_applications_category"))
    private Category category;

    @NotBlank
    @Size(max = FieldLimits.NAME_MAX)
    @Column(name = "name", nullable = false, length = FieldLimits.NAME_MAX)
    private String name;

    @NotBlank
    @Email
    @Size(max = FieldLimits.EMAIL_MAX)
    @Column(name = "email", nullable = false, length = FieldLimits.EMAIL_MAX)
    private String email;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "weekly_time", nullable = false, length = FieldLimits.CODE_MAX)
    private WeeklyTime weeklyTime;

    @Size(max = FieldLimits.ABOUT_MAX)
    @Column(name = "about", length = FieldLimits.ABOUT_MAX)
    private String about;

    @NotBlank
    @Size(max = FieldLimits.CODE_MAX)
    @Column(name = "consent_text_version", nullable = false, length = FieldLimits.CODE_MAX)
    private String consentTextVersion;

    @NotNull
    @Column(name = "consent_at", nullable = false)
    private Instant consentAt;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    @Builder.Default
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = FieldLimits.CODE_MAX)
    private ApplicationStatus status = ApplicationStatus.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_applications_owner"))
    private Staff owner;

    @Size(max = FieldLimits.NOTES_MAX)
    @Column(name = "internal_notes", length = FieldLimits.NOTES_MAX)
    private String internalNotes;

    @Column(name = "discarded_at")
    private Instant discardedAt;

}

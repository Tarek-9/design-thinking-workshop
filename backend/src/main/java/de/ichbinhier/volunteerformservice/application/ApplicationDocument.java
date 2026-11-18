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
import jakarta.validation.constraints.NotNull;

import de.ichbinhier.volunteerformservice.FieldLimits;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


/** Bytes live on the upload volume under {@link #storedName}; the database keeps the original name. */
@Entity
@Table(name = "application_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationDocument {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "application_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_application_documents_application"))
    private Application application;

    @Column(name = "original_name", nullable = false, length = FieldLimits.DOCUMENT_NAME_MAX)
    private String originalName;

    @Column(name = "stored_name", nullable = false, length = FieldLimits.STORED_NAME_MAX, updatable = false)
    private String storedName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = FieldLimits.DOCUMENT_TYPE_MAX)
    private DocumentType type;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

}

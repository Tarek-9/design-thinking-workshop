package de.ichbinhier.volunteerformservice.dashboard;

import java.time.Instant;
import java.util.UUID;

import de.ichbinhier.volunteerformservice.application.ApplicationDocument;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private UUID id;
    private String fileName;
    private String contentType;
    private long sizeBytes;
    private Instant uploadedAt;

    static DocumentDto of(ApplicationDocument document) {
        return new DocumentDto(
            document.getId(),
            document.getOriginalName(),
            document.getType().getContentType(),
            document.getSizeBytes(),
            document.getUploadedAt());
    }
}

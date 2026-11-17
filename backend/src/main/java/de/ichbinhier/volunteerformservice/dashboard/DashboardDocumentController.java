package de.ichbinhier.volunteerformservice.dashboard;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.application.ApplicationDocument;
import de.ichbinhier.volunteerformservice.application.ApplicationDocumentRepository;
import de.ichbinhier.volunteerformservice.application.ApplicationDocumentService;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff/applications/{id}/documents")
@RequiredArgsConstructor
public class DashboardDocumentController {

    private final ApplicationRepository appRepo;
    private final ApplicationDocumentRepository documentRepo;
    private final ApplicationDocumentService documents;

    @GetMapping
    ResponseEntity<DocumentsResponse> list(@PathVariable UUID id) {
        requireApplication(id);

        List<DocumentDto> found = documentRepo.findByApplicationIdOrderByUploadedAtAsc(id).stream()
            .map(DocumentDto::of)
            .toList();

        DocumentsResponse response = new DocumentsResponse();
        response.setDocuments(found);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(response);
    }

    @GetMapping("/{documentId}")
    ResponseEntity<Resource> download(@PathVariable UUID id, @PathVariable UUID documentId) {
        ApplicationDocument document = documentRepo.findByIdAndApplicationId(documentId, id)
            .orElseThrow(ApiException::notFound);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(document.getType().getContentType()))
            .contentLength(document.getSizeBytes())
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename(document.getOriginalName(), StandardCharsets.UTF_8)
                .build()
                .toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(documents.open(document));
    }

    private void requireApplication(UUID id) {
        if (!appRepo.existsById(id)) {
            throw ApiException.notFound();
        }
    }

}

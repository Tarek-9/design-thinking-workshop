package de.ichbinhier.volunteerformservice.application;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/applications/{id}/documents")
@RequiredArgsConstructor
public class ApplicationDocumentController {

    private final ApplicationDocumentService documents;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    void upload(
            @PathVariable UUID id,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        documents.attach(id, files == null ? List.of() : files);
    }

}

package de.ichbinhier.volunteerformservice.application;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ApplicationDocumentService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationDocumentService.class);

    private static final String FIELD = "files";

    private static final String FALLBACK_NAME = "document";

    private static final int ORIGINAL_NAME_LENGTH = 255;

    private final ApplicationRepository applications;
    private final ApplicationDocumentRepository documents;
    private final DocumentProperties properties;


    /**
     * Stores every file or none of them. Each file is checked against its
     * declared type and its first bytes before the rows are saved; a failure
     * removes whatever was already written to the volume.
     */
    @Transactional
    public void attach(UUID applicationId, List<MultipartFile> files) {
        Application application = applications.findById(applicationId)
                .orElseThrow(ApiException::notFound);
        if (files.isEmpty()) {
            throw new FieldValidationException(FIELD, "DOCUMENT_REQUIRED");
        }
        if (documents.countByApplicationId(applicationId) + files.size()
                > properties.getMaxFilesPerApplication()) {
            throw new FieldValidationException(FIELD, "DOCUMENT_LIMIT_REACHED");
        }

        List<Path> written = new ArrayList<>();
        try {
            Files.createDirectories(properties.uploadPath());
            List<ApplicationDocument> rows = new ArrayList<>();
            for (MultipartFile file : files) {
                rows.add(store(application, file, written));
            }
            documents.saveAllAndFlush(rows);
        } catch (IOException failure) {
            written.forEach(ApplicationDocumentService::deleteFile);
            throw new UncheckedIOException(failure);
        } catch (RuntimeException failure) {
            written.forEach(ApplicationDocumentService::deleteFile);
            throw failure;
        }
    }

    /**
     * Erases the Documents of an Application. The rows go with the caller's
     * transaction; the files are removed only once it has committed, so a
     * rollback never leaves rows pointing at files that are already gone.
     */
    @Transactional
    public void eraseAll(UUID applicationId) {
        List<ApplicationDocument> rows = documents.findByApplicationId(applicationId);
        documents.deleteAll(rows);
        List<Path> files = rows.stream().map(this::fileOf).toList();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                files.forEach(ApplicationDocumentService::deleteFile);
            }
        });
    }

    public Resource open(ApplicationDocument document) {
        return new FileSystemResource(fileOf(document));
    }

    private ApplicationDocument store(Application application, MultipartFile file, List<Path> written)
            throws IOException {
        DocumentType type = DocumentType.forContentType(file.getContentType())
                .orElseThrow(() -> new FieldValidationException(FIELD, "DOCUMENT_TYPE_UNSUPPORTED"));
        if (file.getSize() > properties.getMaxFileSize().toBytes()) {
            throw new FieldValidationException(FIELD, "DOCUMENT_TOO_LARGE");
        }

        String storedName = UUID.randomUUID().toString();
        Path target = properties.uploadPath().resolve(storedName);
        written.add(target);

        long size;
        try (InputStream content = file.getInputStream()) {
            size = Files.copy(content, target);
        }
        if (!type.matches(head(target, type))) {
            throw new FieldValidationException(FIELD, "DOCUMENT_TYPE_UNSUPPORTED");
        }

        return ApplicationDocument.builder()
                .application(application)
                .originalName(originalNameOf(file))
                .storedName(storedName)
                .type(type)
                .sizeBytes(size)
                .uploadedAt(StoredInstant.now())
                .build();
    }

    private Path fileOf(ApplicationDocument document) {
        return properties.uploadPath().resolve(document.getStoredName());
    }

    private static byte[] head(Path file, DocumentType type) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            return in.readNBytes(type.signatureLength());
        }
    }

    /**
     * The name the applicant's browser sent, reduced to its last segment: a
     * name carrying folders must not tell us anything about where to write.
     */
    private static String originalNameOf(MultipartFile file) {
        String sent = Objects.requireNonNullElse(file.getOriginalFilename(), "");
        String leaf = sent.substring(Math.max(sent.lastIndexOf('/'), sent.lastIndexOf('\\')) + 1).strip();
        if (leaf.isEmpty()) {
            return FALLBACK_NAME;
        }
        return leaf.substring(0, Math.min(leaf.length(), ORIGINAL_NAME_LENGTH));
    }

    /** A file that cannot be removed is logged by its kind only: its path is not for logs. */
    private static void deleteFile(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException failure) {
            log.warn("A document file could not be removed: {}", failure.getClass().getSimpleName());
        }
    }

}

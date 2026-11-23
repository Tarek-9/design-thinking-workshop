package de.ichbinhier.volunteerformservice.application;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

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


    @Transactional
    public void attach(UUID applicationId, List<MultipartFile> files) {
        Application application = applications.findByIdForUpdate(applicationId)
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

    // Files go only after commit, so a rollback never leaves rows for missing files.
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
        if (!type.matches(head(target, type))
                || !matchesContainer(target, type)) {
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

    private static boolean matchesContainer(Path file, DocumentType type)
            throws IOException {
        return switch (type) {
            case DOC -> containsWordStream(file);
            case DOCX -> containsWordPackage(file);
            default -> true;
        };
    }

    private static boolean containsWordStream(Path file) throws IOException {
        // OLE directory names are UTF-16LE, so both encodings are searched.
        byte[] bytes = Files.readAllBytes(file);
        return contains(bytes,
                "WordDocument".getBytes(StandardCharsets.US_ASCII))
                || contains(bytes,
                        "WordDocument".getBytes(StandardCharsets.UTF_16LE));
    }

    private static boolean contains(byte[] bytes, byte[] token) {
        for (int start = 0; start <= bytes.length - token.length; start++) {
            int matched = 0;
            while (matched < token.length
                    && bytes[start + matched] == token[matched]) {
                matched++;
            }
            if (matched == token.length) {
                return true;
            }
        }
        return false;
    }

    private static boolean containsWordPackage(Path file) {
        try (ZipFile archive = new ZipFile(file.toFile())) {
            ZipEntry document = archive.getEntry("word/document.xml");
            if (document == null || document.isDirectory()
                    || document.getSize() == 0) {
                return false;
            }
            try (InputStream content = archive.getInputStream(document)) {
                return content.read() != -1;
            }
        } catch (IOException | IllegalArgumentException invalidArchive) {
            return false;
        }
    }

    // Only the last segment is kept, so a client folder cannot pick the write path.
    private static String originalNameOf(MultipartFile file) {
        String sent = Objects.requireNonNullElse(file.getOriginalFilename(), "");
        String leaf = sent.substring(Math.max(sent.lastIndexOf('/'), sent.lastIndexOf('\\')) + 1).strip();
        if (leaf.isEmpty()) {
            return FALLBACK_NAME;
        }
        return leaf.substring(0, Math.min(leaf.length(), ORIGINAL_NAME_LENGTH));
    }

    // Logged by exception kind only, so no file path reaches the log.
    private static void deleteFile(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException failure) {
            log.warn("A document file could not be removed: {}", failure.getClass().getSimpleName());
        }
    }

}

package de.ichbinhier.volunteerformservice.application;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import lombok.Getter;
import lombok.Setter;

/** Upload folder and limits (`A23`); folder is configured, so tests use a temporary directory. */
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "document")
public class DocumentProperties {

    /** Default bound to {@code document.max-file-size} in application.properties. */
    static final long MAX_FILE_SIZE_MB = 5;

    /** Default bound to {@code document.max-files-per-application} in application.properties. */
    static final int MAX_FILES_PER_APPLICATION = 3;

    /** Bound to {@code document.upload-dir} in application.properties. */
    private String uploadDir;

    /** Largest single file an applicant may attach (`A23`). */
    private DataSize maxFileSize = DataSize.ofMegabytes(MAX_FILE_SIZE_MB);

    /** Documents one Application may hold, counted across uploads (`A23`). */
    private int maxFilesPerApplication = MAX_FILES_PER_APPLICATION;

    public Path uploadPath() {
        return Path.of(uploadDir);
    }

}

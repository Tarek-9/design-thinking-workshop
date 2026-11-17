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

    /** Bound to {@code document.upload-dir} in application.properties. */
    private String uploadDir;

    /** Largest single file an applicant may attach (`A23`). */
    private DataSize maxFileSize = DataSize.ofMegabytes(5);

    /** Documents one Application may hold, counted across uploads (`A23`). */
    private int maxFilesPerApplication = 3;

    public Path uploadPath() {
        return Path.of(uploadDir);
    }

}

package de.ichbinhier.volunteerformservice.application;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import lombok.Getter;
import lombok.Setter;

/**
 * The limits and the folder behind an applicant's uploads (`A23`). The folder
 * is a volume in production and a temporary directory in tests, so it is
 * configured rather than compiled in.
 */
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "document")
public class DocumentProperties {

    /** Where the files are written; set by {@code document.upload-dir} in application.properties. */
    private String uploadDir;

    /** Largest single file an applicant may attach (`A23`). */
    private DataSize maxFileSize = DataSize.ofMegabytes(5);

    /** Documents one Application may hold, counted across uploads (`A23`). */
    private int maxFilesPerApplication = 3;

    public Path uploadPath() {
        return Path.of(uploadDir);
    }

}

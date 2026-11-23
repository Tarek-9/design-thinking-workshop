package de.ichbinhier.volunteerformservice.application;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import lombok.Getter;
import lombok.Setter;

@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "document")
public class DocumentProperties {

    static final long MAX_FILE_SIZE_MB = 5;

    static final int MAX_FILES_PER_APPLICATION = 3;

    private String uploadDir;

    private DataSize maxFileSize = DataSize.ofMegabytes(MAX_FILE_SIZE_MB);

    private int maxFilesPerApplication = MAX_FILES_PER_APPLICATION;

    public Path uploadPath() {
        return Path.of(uploadDir);
    }

}

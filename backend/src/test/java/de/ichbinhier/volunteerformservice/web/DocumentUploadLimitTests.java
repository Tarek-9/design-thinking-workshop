package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import com.jayway.jsonpath.JsonPath;

/**
 * The multipart ceiling answered by a real server. MockMvc hands its files over
 * without the container's limit, so this test starts Tomcat on a random port
 * with a 1 KB ceiling and posts a file above it. Tomcat refuses the request,
 * Spring raises {@code MaxUploadSizeExceededException}, and the advice answers
 * the same {@code DOCUMENT_TOO_LARGE} that {@link DocumentUploadTests} covers
 * directly. Its own context, because the limit is a server setting.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.servlet.multipart.max-file-size=1KB")
@ActiveProfiles("test")
class DocumentUploadLimitTests {

    private static final int FILE_BYTES = 4096;

    @LocalServerPort private int port;

    @Test
    void anOverlargeFileAnswersDocumentTooLargeFromTheServer() throws Exception {
        String boundary = "document-upload-limit";
        byte[] head = ("--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"files\"; filename=\"gross.pdf\"\r\n"
                + "Content-Type: application/pdf\r\n\r\n")
                .getBytes(StandardCharsets.ISO_8859_1);
        byte[] tail = ("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.ISO_8859_1);
        byte[] body = new byte[head.length + FILE_BYTES + tail.length];
        System.arraycopy(head, 0, body, 0, head.length);
        System.arraycopy(tail, 0, body, head.length + FILE_BYTES, tail.length);

        HttpResponse<String> response = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port
                                + "/api/v1/applications/" + UUID.randomUUID() + "/documents"))
                        .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                        .POST(BodyPublishers.ofByteArray(body))
                        .build(),
                BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(JsonPath.<String>read(response.body(), "$.code")).isEqualTo("VALIDATION_FAILED");
        assertThat(JsonPath.<String>read(response.body(), "$.errors[0].field")).isEqualTo("files");
        assertThat(JsonPath.<String>read(response.body(), "$.errors[0].code"))
                .isEqualTo("DOCUMENT_TOO_LARGE");
    }

}

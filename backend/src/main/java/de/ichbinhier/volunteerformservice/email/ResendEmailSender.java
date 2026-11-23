package de.ichbinhier.volunteerformservice.email;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Conditional;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import lombok.extern.slf4j.Slf4j;

// Calls the Resend HTTP API directly: one POST, so an SDK would add more than it saves.
// Not @ConditionalOnMissingBean: plain @Component classes have no guaranteed order.
@Slf4j
@Component
@Conditional(HasResendApiKey.class)
public class ResendEmailSender implements EmailSender {

    private final RestClient client;
    private final String fromAddress;

    // The change is already stored, so the timeouts must stay far below any gateway limit.
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(10);

    public ResendEmailSender(ResendProperties properties) {
        this.fromAddress = properties.getFrom();
        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(READ_TIMEOUT);
        this.client = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + properties.getApiKey())
                .requestFactory(factory)
                .build();
    }

    @Override
    public void send(String toAddress, String subject, String htmlBody) {
        client.post()
                .uri("/emails")
                .body(Map.of(
                        "from", fromAddress,
                        "to", List.of(toAddress),
                        "subject", subject,
                        "html", htmlBody))
                .retrieve()
                .toBodilessEntity();
        // No address in the log: the subject is enough to trace which mail went out.
        log.info("Resend accepted the email \"{}\"", subject);
    }

}

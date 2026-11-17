package de.ichbinhier.volunteerformservice.email;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Conditional;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// Talks to the Resend HTTP API directly — resend.com has no official Java
// SDK, and the API is one POST request, so a client library would be more
// code than it saves. Active only when resend.api-key is set to a non-blank
// value; otherwise NoopEmailSender takes over (see its class comment).
//
// Both this class and NoopEmailSender evaluate resend.api-key directly
// (negations of each other) rather than one depending on "is the other bean
// present" — @ConditionalOnMissingBean on plain @Component classes has no
// guaranteed evaluation order, which is exactly the kind of bug that is
// silent until the day it flips.
@Component
@Conditional(HasResendApiKey.class)
public class ResendEmailSender implements EmailSender {

    private final RestClient client;
    private final String fromAddress;


    // nginx answers the API host with 504 after 30s, and a status change is
    // already stored before a mail is sent: a request hanging longer than
    // that turns a saved change into an error for the staff member. Timeouts
    // stay clearly below the 30s.
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
    }

}

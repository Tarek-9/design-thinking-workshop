package de.ichbinhier.volunteerformservice.email;

import static org.assertj.core.api.Assertions.assertThatCode;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.category.Category;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

// A mail failure must never turn a stored application into a 500.
class ConfirmationMailerTests {

    @Test
    void sendConfirmationSwallowsAMailFailure() {
        EmailSender throwingSender =
                (toAddress, subject, htmlBody) -> {
                    throw new RuntimeException("resend is down");
                };
        ConfirmationMailer mailer = new ConfirmationMailer(throwingSender);

        assertThatCode(() -> mailer.sendConfirmation(application()))
                .doesNotThrowAnyException();
    }

    private static Application application() {
        Category category = Category.builder().name("Social Media").build();
        return Application.builder()
                .id(UUID.randomUUID())
                .submissionId(UUID.randomUUID())
                .category(category)
                .name("Anna Müller")
                .email("anna@example.de")
                .consentAt(Instant.now())
                .build();
    }
}

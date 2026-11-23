package de.ichbinhier.volunteerformservice.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.category.Category;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

        assertThatCode(() -> mailer.sendConfirmation(application("Anna Müller", "Social Media")))
                .doesNotThrowAnyException();
    }

    @Test
    void confirmsTheApplicationWithItsCategory() {
        List<String[]> sent = new ArrayList<>();
        ConfirmationMailer mailer = new ConfirmationMailer(
                (toAddress, subject, htmlBody) -> sent.add(new String[] {toAddress, subject, htmlBody}));

        mailer.sendConfirmation(application("Anna Müller", "Social Media"));

        assertThat(sent).hasSize(1);
        assertThat(sent.get(0)[0]).isEqualTo("anna@example.de");
        assertThat(sent.get(0)[1]).isEqualTo("Deine Bewerbung bei ichbinhier ist angekommen");
        assertThat(sent.get(0)[2])
                .startsWith("<p>Hallo Anna Müller,</p>")
                .contains("im Bereich „Social Media“")
                .contains("Dein #ichbinhier-Team");
    }

    @Test
    void escapesWhatTheApplicantTyped() {
        List<String> bodies = new ArrayList<>();
        ConfirmationMailer mailer = new ConfirmationMailer((toAddress, subject, htmlBody) -> bodies.add(htmlBody));

        mailer.sendConfirmation(application("<b>Anna</b>", "A & B"));

        assertThat(bodies.get(0))
                .contains("Hallo &lt;b&gt;Anna&lt;/b&gt;,")
                .contains("„A &amp; B“")
                .doesNotContain("<b>Anna</b>");
    }

    private static Application application(String name, String categoryName) {
        Category category = Category.builder().name(categoryName).build();
        return Application.builder()
                .id(UUID.randomUUID())
                .submissionId(UUID.randomUUID())
                .category(category)
                .name(name)
                .email("anna@example.de")
                .consentAt(Instant.now())
                .build();
    }
}

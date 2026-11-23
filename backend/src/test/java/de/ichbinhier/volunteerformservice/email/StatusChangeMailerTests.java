package de.ichbinhier.volunteerformservice.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

// A mail error must never fail a change that has already happened.
class StatusChangeMailerTests {

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            NEW | Deine Bewerbung bei ichbinhier ist wieder offen
            IN_REVIEW | Deine Bewerbung bei ichbinhier wird geprüft
            INTRO_BOOKED | Dein Kennenlerntermin bei ichbinhier ist vorgemerkt
            ACTIVE | Willkommen im Team von ichbinhier
            WAITLISTED | Deine Bewerbung bei ichbinhier steht auf der Warteliste
            DECLINED | Zu deiner Bewerbung bei ichbinhier
            """)
    void sendsOneGermanMailForEachStatus(ApplicationStatus status, String subject) {
        RecordingSender sender = new RecordingSender();
        StatusChangeMailer mailer = new StatusChangeMailer(sender);

        mailer.sendStatusChange(application(status));

        assertThat(sender.sent).hasSize(1);
        Sent mail = sender.sent.get(0);
        assertThat(mail.to()).isEqualTo("anna@example.de");
        assertThat(mail.subject()).isEqualTo(subject);
        assertThat(mail.body())
                .startsWith("<p>Hallo Anna Müller,</p>")
                .contains("info@ichbinhier.online")
                .contains("Dein #ichbinhier-Team</p>");
    }

    @Test
    void escapesTheApplicantsName() {
        RecordingSender sender = new RecordingSender();
        StatusChangeMailer mailer = new StatusChangeMailer(sender);
        Application application = application(ApplicationStatus.IN_REVIEW);
        application.setName("<b>Anna</b>");

        mailer.sendStatusChange(application);

        assertThat(sender.sent.get(0).body())
                .startsWith("<p>Hallo &lt;b&gt;Anna&lt;/b&gt;,</p>")
                .doesNotContain("<b>Anna</b>");
    }

    @Test
    void leavesDashesOutOfEveryText() {
        RecordingSender sender = new RecordingSender();
        StatusChangeMailer mailer = new StatusChangeMailer(sender);

        for (ApplicationStatus status : ApplicationStatus.values()) {
            mailer.sendStatusChange(application(status));
        }

        for (Sent mail : sender.sent) {
            assertThat(mail.subject() + mail.body())
                    .doesNotContain("\u2013")
                    .doesNotContain("\u2014")
                    .doesNotContain("&ndash;")
                    .doesNotContain("&mdash;");
        }
    }

    @Test
    void sendStatusChangeSwallowsAMailFailure() {
        EmailSender throwingSender =
                (toAddress, subject, htmlBody) -> {
                    throw new RuntimeException("resend is down");
                };
        StatusChangeMailer mailer = new StatusChangeMailer(throwingSender);

        assertThatCode(() -> mailer.sendStatusChange(application(ApplicationStatus.DECLINED)))
                .doesNotThrowAnyException();
    }

    private static Application application(ApplicationStatus status) {
        return Application.builder()
                .id(UUID.randomUUID())
                .submissionId(UUID.randomUUID())
                .name("Anna Müller")
                .email("anna@example.de")
                .consentAt(Instant.now())
                .status(status)
                .build();
    }

    private record Sent(String to, String subject, String body) {}

    private static class RecordingSender implements EmailSender {

        private final List<Sent> sent = new ArrayList<>();

        @Override
        public void send(String toAddress, String subject, String htmlBody) {
            sent.add(new Sent(toAddress, subject, htmlBody));
        }

    }
}

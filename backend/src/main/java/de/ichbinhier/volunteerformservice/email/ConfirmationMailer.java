package de.ichbinhier.volunteerformservice.email;

import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import de.ichbinhier.volunteerformservice.application.Application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// Generic: never name a Category the backend cannot back.
@Slf4j
@Component
@RequiredArgsConstructor
public class ConfirmationMailer {

    private final EmailSender sender;

    // The Application is already committed, so a mail failure must not surface
    // as a 500: it would look like a failed submission and invite a duplicate.
    public void sendConfirmation(Application application) {
        String subject = "Deine Bewerbung bei ichbinhier ist angekommen";
        String body = """
                <p>Hallo %s,</p>
                <p>vielen Dank für deine Bewerbung im Bereich „%s“! Sie ist gut bei uns angekommen.</p>
                <p>Wir schauen sie uns in Ruhe an und melden uns bei dir, sobald es weitergeht. \
                Bei jedem Schritt bekommst du von uns eine kurze Nachricht.</p>
                <p>Bei Fragen erreichst du uns unter info@ichbinhier.online.</p>
                <p>Viele Grüße<br>Dein #ichbinhier-Team</p>
                """.formatted(
                        HtmlUtils.htmlEscape(application.getName(), "UTF-8"),
                        HtmlUtils.htmlEscape(application.getCategory().getName(), "UTF-8"));

        try {
            sender.send(application.getEmail(), subject, body);
        } catch (RuntimeException exception) {
            log.warn("Confirmation email failed for application {}", application.getId(), exception);
        }
    }

}

package de.ichbinhier.volunteerformservice.email;

import org.springframework.stereotype.Component;

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
        String subject = "Deine Bewerbung bei ichbinhier ist da";
        String body = """
                <p>Hallo %s,</p>
                <p>wir haben deine Bewerbung im Bereich &bdquo;%s&ldquo; erhalten. \
                Wir melden uns bei dir, sobald es weitergeht.</p>
                <p>Vielen Dank f&uuml;r dein Interesse!<br>Dein #ichbinhier-Team</p>
                """.formatted(application.getName(), application.getCategory().getName());

        try {
            sender.send(application.getEmail(), subject, body);
        } catch (RuntimeException exception) {
            log.warn("Confirmation email failed for application {}", application.getId(), exception);
        }
    }

}

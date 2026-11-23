package de.ichbinhier.volunteerformservice.email;

import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// Every Status change mails the applicant. No text names the Category: it is a
// lazy association and no session is open after the commit.
@Slf4j
@Component
@RequiredArgsConstructor
public class StatusChangeMailer {

    private final EmailSender sender;

    // The change is already stored, so a mail failure is only logged.
    public void sendStatusChange(Application application) {
        Text text = textFor(application.getStatus());
        String body = """
                <p>Hallo %s,</p>
                <p>%s</p>
                <p>%s</p>
                <p>Bei Fragen erreichst du uns unter info@ichbinhier.online.</p>
                <p>Viele Grüße<br>Dein #ichbinhier-Team</p>
                """.formatted(
                        HtmlUtils.htmlEscape(application.getName(), "UTF-8"),
                        text.news(),
                        text.next());

        try {
            sender.send(application.getEmail(), text.subject(), body);
        } catch (RuntimeException exception) {
            log.warn("Status email failed for application {}", application.getId(), exception);
        }
    }

    private record Text(String subject, String news, String next) {}

    private static Text textFor(ApplicationStatus status) {
        return switch (status) {
            case NEW -> new Text(
                    "Deine Bewerbung bei ichbinhier ist wieder offen",
                    "wir haben deine Bewerbung wieder geöffnet und schauen sie uns noch einmal in Ruhe an.",
                    "Du musst nichts weiter tun. Sobald es Neuigkeiten gibt, melden wir uns bei dir.");
            case IN_REVIEW -> new Text(
                    "Deine Bewerbung bei ichbinhier wird geprüft",
                    "danke für deine Geduld! Deine Bewerbung liegt jetzt bei unserem Team, und wir schauen "
                            + "uns genau an, wo du mit deiner Zeit und deinen Ideen am besten zu uns passt.",
                    "Das kann ein wenig dauern. Sobald wir den nächsten Schritt festgelegt haben, hörst du von uns.");
            case INTRO_BOOKED -> new Text(
                    "Dein Kennenlerntermin bei ichbinhier ist vorgemerkt",
                    "wir freuen uns darauf, dich kennenzulernen! Für ein erstes Gespräch haben wir dir "
                            + "einen Termin vorgemerkt.",
                    "Die genauen Angaben zu Zeit und Ort schicken wir dir in einer eigenen Mail. Passt dir "
                            + "der Termin nicht, schreib uns kurz, dann finden wir gemeinsam einen anderen.");
            case ACTIVE -> new Text(
                    "Willkommen im Team von ichbinhier",
                    "herzlich willkommen! Ab jetzt bist du aktiv bei ichbinhier dabei, und wir freuen uns "
                            + "sehr auf die Zusammenarbeit mit dir.",
                    "Als Nächstes schicken wir dir alles, was du für deinen Einstieg brauchst.");
            case WAITLISTED -> new Text(
                    "Deine Bewerbung bei ichbinhier steht auf der Warteliste",
                    "vielen Dank für deine Bewerbung und dein Interesse an unserer Arbeit. Im Moment können "
                            + "wir nicht alle neuen Ehrenamtlichen gleichzeitig gut begleiten, deshalb steht "
                            + "deine Bewerbung vorerst auf unserer Warteliste.",
                    "Du musst nichts weiter tun. Sobald wieder Platz ist, melden wir uns von selbst bei dir.");
            case DECLINED -> new Text(
                    "Zu deiner Bewerbung bei ichbinhier",
                    "vielen Dank, dass du dir die Zeit für deine Bewerbung genommen hast. Wir haben sie "
                            + "sorgfältig gelesen, können dich im Moment aber leider nicht in unser Team aufnehmen.",
                    "Das ist keine Entscheidung gegen dich als Person. Wir wünschen dir alles Gute und "
                            + "freuen uns, wenn du unsere Arbeit weiter verfolgst.");
        };
    }

}

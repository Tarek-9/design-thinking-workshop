package de.ichbinhier.volunteerformservice.email;

import org.springframework.stereotype.Component;

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
                <p>Dein #ichbinhier-Team</p>
                """.formatted(application.getName(), text.paragraph());

        try {
            sender.send(application.getEmail(), text.subject(), body);
        } catch (RuntimeException exception) {
            log.warn("Status email failed for application {}", application.getId(), exception);
        }
    }


    private record Text(String subject, String paragraph) {}

    private static Text textFor(ApplicationStatus status) {
        return switch (status) {
            case NEW -> new Text(
                    "Deine Bewerbung bei ichbinhier ist wieder offen",
                    "Wir haben deine Bewerbung wieder ge&ouml;ffnet und schauen sie uns erneut an. "
                            + "Wir melden uns bei dir, sobald es weitergeht.");
            case IN_REVIEW -> new Text(
                    "Deine Bewerbung bei ichbinhier wird geprüft",
                    "Wir pr&uuml;fen deine Bewerbung gerade genauer. Das braucht etwas Zeit. "
                            + "Wir melden uns bei dir, sobald wir den n&auml;chsten Schritt festgelegt haben.");
            case INTRO_BOOKED -> new Text(
                    "Dein Termin bei ichbinhier ist vorgemerkt",
                    "Wir haben dir einen Termin vorgemerkt, damit wir uns kennenlernen k&ouml;nnen. "
                            + "Die genauen Angaben dazu schicken wir dir gesondert zu.");
            case ACTIVE -> new Text(
                    "Willkommen bei ichbinhier",
                    "Sch&ouml;n, dass du dabei bist! Du bist jetzt aktiv bei uns. "
                            + "Die n&auml;chsten Schritte f&uuml;r deinen Einstieg schicken wir dir gesondert zu.");
            case WAITLISTED -> new Text(
                    "Deine Bewerbung bei ichbinhier steht auf der Warteliste",
                    "Deine Bewerbung steht jetzt auf der Warteliste. Im Moment k&ouml;nnen wir nicht alle "
                            + "Bewerbungen gleichzeitig begleiten. Sobald wieder Platz ist, melden wir uns bei dir. "
                            + "Bis dahin musst du nichts tun.");
            case DECLINED -> new Text(
                    "Zu deiner Bewerbung bei ichbinhier",
                    "Vielen Dank, dass du dich bei uns beworben hast. Wir haben deine Bewerbung "
                            + "sorgf&auml;ltig gelesen. Leider k&ouml;nnen wir dich im Moment nicht aufnehmen. "
                            + "Fragen dazu beantwortet unser Team gern unter info@ichbinhier.online.");
        };
    }

}

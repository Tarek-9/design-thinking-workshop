package de.ichbinhier.volunteerformservice.email;

import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/*
 * Tells an applicant that their Application moved to another Status (A24).
 * Every change sends a mail, the rejection included: a status the applicant
 * never hears about is the silence A8 names as the thing that loses people.
 * Applicant-facing text is German (AGENTS.md, "Language split").
 *
 * The texts name no Category. The category is a lazy association, and the
 * status change runs outside a transaction (see ApplicationDto), so reading
 * its name here would fail.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StatusChangeMailer {

    private final EmailSender sender;


    // The status change is already stored when this runs (see
    // DashboardApplicationController.update). A mail provider failure must
    // not turn a saved status change into an error for the staff member, so
    // failures are logged, not thrown, the same as ConfirmationMailer.
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

package de.ichbinhier.volunteerformservice.demo;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityManager;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.ApplicationStatus;
import de.ichbinhier.volunteerformservice.application.StateChange;
import de.ichbinhier.volunteerformservice.application.StateChangeField;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.application.StoredInstant;
import de.ichbinhier.volunteerformservice.application.WeeklyTime;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// Behind the demo profile, so applicant-shaped rows exist only on request.
// Addresses sit at example.org (RFC 2606), so no real mailbox can be hit.
@Component
@Profile("demo")
@Order(DemoSeeder.AFTER_THE_CATEGORIES_AND_THE_STAFF_ACCOUNTS)
@RequiredArgsConstructor
@Slf4j
public class DemoSeeder implements ApplicationRunner {

    // After CategorySeeder (1) and StaffSeeder (2): Applications need both.
    static final int AFTER_THE_CATEGORIES_AND_THE_STAFF_ACCOUNTS = 3;

    private static final String CONSENT_TEXT_VERSION = "2026-09";

    // Indexes into the form's Category order.
    private static final int SOCIAL_MEDIA = 0;
    private static final int EDITORIAL = 1;
    private static final int LEGAL = 2;
    private static final int SOMETHING_ELSE = 3;

    // The trailing week must hold movement, or Übersicht's sparklines go flat.
    static final List<Seed> SEEDS = List.of(
            new Seed(
                    "Mara Weber",
                    "mara.weber@example.org",
                    SOCIAL_MEDIA,
                    WeeklyTime.HOURS_3_5,
                    "Ich arbeite seit zwei Jahren in der Social-Media-Redaktion eines"
                            + " Vereins und würde gern bei euch mithelfen.",
                    "",
                    ago(0, 3),
                    List.of()),
            new Seed(
                    "Jonas Krüger",
                    "j.krueger@example.org",
                    LEGAL,
                    WeeklyTime.HOURS_1_2,
                    "Ich bin Volljurist und kann euch bei Fragen zum Persönlichkeitsrecht"
                            + " unterstützen.",
                    "",
                    ago(1, 4),
                    List.of()),
            new Seed(
                    "Ayla Çetin",
                    "ayla.cetin@example.org",
                    SOMETHING_ELSE,
                    WeeklyTime.IRREGULAR,
                    "Ich weiß noch nicht genau, wo ich helfen kann, habe aber abends oft"
                            + " Zeit.",
                    "Kurz telefoniert, meldet sich mit einem Wunschbereich.",
                    ago(2, 6),
                    List.of(
                            owner(2, 3, 3),
                            status(1, 7, ApplicationStatus.IN_REVIEW))),
            new Seed(
                    "Lea Fischer",
                    "lea.fischer@example.org",
                    EDITORIAL,
                    WeeklyTime.HOURS_5_PLUS,
                    "Ich schreibe gern und hätte Zeit für die Öffentlichkeitsarbeit.",
                    "Schreibprobe angefragt.",
                    ago(3, 9),
                    List.of(
                            owner(3, 2, 1),
                            status(2, 8, ApplicationStatus.IN_REVIEW),
                            status(0, 5, ApplicationStatus.INTRO_BOOKED))),
            new Seed(
                    "Tobias Hoffmann",
                    "tobias.hoffmann@example.org",
                    SOCIAL_MEDIA,
                    WeeklyTime.HOURS_3_5,
                    "Ich bin über Instagram auf euch gestoßen und möchte bei der Moderation"
                            + " helfen.",
                    "Info-Runde in der nächsten Woche.",
                    ago(5, 10),
                    // Owner and Status share a timestamp: one PATCH set both.
                    List.of(
                            owner(4, 9, 2),
                            status(4, 9, ApplicationStatus.IN_REVIEW),
                            status(1, 6, ApplicationStatus.INTRO_BOOKED))),
            new Seed(
                    "Nina Baumann",
                    "nina.baumann@example.org",
                    SOCIAL_MEDIA,
                    WeeklyTime.HOURS_5_PLUS,
                    "Ich möchte die Aktionsgruppe bei Kampagnen unterstützen.",
                    "Onboarding abgeschlossen.",
                    ago(9, 8),
                    List.of(
                            owner(8, 9, 2),
                            status(8, 9, ApplicationStatus.IN_REVIEW),
                            status(6, 7, ApplicationStatus.INTRO_BOOKED),
                            status(2, 9, ApplicationStatus.ACTIVE))),
            new Seed(
                    "Peter Schmitt",
                    "p.schmitt@example.org",
                    EDITORIAL,
                    WeeklyTime.HOURS_3_5,
                    "Ich bin Rentner und habe viel Zeit für Korrekturen und Recherche.",
                    "Warteliste, bis die Redaktion wieder Kapazität hat.",
                    ago(12, 7),
                    List.of(
                            owner(11, 8, 1),
                            status(10, 9, ApplicationStatus.IN_REVIEW),
                            status(8, 8, ApplicationStatus.WAITLISTED))),
            new Seed(
                    "Christoph Vogel",
                    "c.vogel@example.org",
                    LEGAL,
                    WeeklyTime.HOURS_1_2,
                    "Ich hätte Interesse an einer bezahlten Stelle in der Rechtsberatung.",
                    "Kein Ehrenamt gesucht, abgelehnt und weiterverwiesen.",
                    ago(14, 6),
                    List.of(
                            owner(13, 7, 4),
                            status(12, 9, ApplicationStatus.IN_REVIEW),
                            status(10, 10, ApplicationStatus.DECLINED))),
            new Seed(
                    "Aylin Demir",
                    "aylin.demir@example.org",
                    SOMETHING_ELSE,
                    WeeklyTime.IRREGULAR,
                    "Ich weiß noch nicht, wo ich helfen kann. Schreibt mir gern.",
                    "",
                    ago(8, 5),
                    // No rows: reads as NEW and unowned, since it was never touched.
                    List.of()),
            new Seed(
                    "Kerem Aydın",
                    "kerem.aydin@example.org",
                    SOCIAL_MEDIA,
                    WeeklyTime.HOURS_1_2,
                    "Ich kenne mich mit Community-Management aus und würde eine Schicht pro"
                            + " Woche übernehmen.",
                    "Zurück in den Pool: keine Kapazität in der Betreuung.",
                    ago(10, 4),
                    List.of(
                            owner(9, 6, 5),
                            ownerCleared(5, 8))),
            new Seed(
                    "Sabine Lorenz",
                    "s.lorenz@example.org",
                    EDITORIAL,
                    WeeklyTime.HOURS_1_2,
                    "Ich suche eine Festanstellung im Bereich Kommunikation.",
                    "Bewerbung auf eine Stelle, kein Ehrenamt. Verworfen.",
                    ago(6, 9),
                    List.of(discarded(4, 8, true))),
            new Seed(
                    "Hendrik Sauer",
                    "hendrik.sauer@example.org",
                    SOMETHING_ELSE,
                    WeeklyTime.IRREGULAR,
                    "Ich könnte bei der Technik und beim Newsletter helfen, aber nur"
                            + " unregelmäßig.",
                    "Erst verworfen, dann zurückgeholt. Technik fehlt uns.",
                    ago(11, 5),
                    List.of(
                            discarded(10, 7, true),
                            discarded(3, 9, false),
                            owner(3, 9, 3),
                            status(2, 7, ApplicationStatus.IN_REVIEW))),
            new Seed(
                    "Ingo Herbst",
                    "ingo.herbst@example.org",
                    LEGAL,
                    WeeklyTime.HOURS_1_2,
                    "Ich möchte über euch Strafanzeigen gegen einzelne Nutzer stellen"
                            + " lassen.",
                    "Kein Anliegen für das Ehrenamt, verworfen.",
                    ago(4, 7),
                    List.of(discarded(3, 6, true))));

    private final ApplicationRepository applications;
    private final StateChangeRepository stateChanges;
    private final CategoryRepository categories;
    private final StaffRepository staffMembers;
    private final EntityManager entityManager;

    // Skipped once any Application exists, so a restart neither duplicates the week
    // nor revives a set that was cleared.
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (applications.count() > 0) {
            log.info("Demo data left alone: the applications table is not empty.");
            return;
        }

        List<Category> categoryList = categories.findByOrderByDisplayOrderAsc();
        List<Staff> staffList = staffMembers.findAll(Sort.by("name"));
        if (categoryList.isEmpty() || staffList.isEmpty()) {
            log.warn("Demo data skipped: no Categories or no Staff accounts to hang it on.");
            return;
        }

        Instant startedAt = StoredInstant.now();
        SEEDS.forEach(seed -> seed(seed, startedAt, categoryList, staffList));
        log.info("Seeded {} demo Applications with their State changes.", SEEDS.size());
    }

    private void seed(Seed seed, Instant startedAt, List<Category> cats, List<Staff> staff) {
        Instant submittedAt = startedAt.minus(seed.hoursAgo(), ChronoUnit.HOURS);

        Application application = applications.saveAndFlush(Application.builder()
                .submissionId(UUID.randomUUID())
                .category(cats.get(seed.categoryIndex() % cats.size()))
                .name(seed.name())
                .email(seed.email())
                .weeklyTime(seed.weeklyTime())
                .about(seed.about())
                .internalNotes(seed.internalNotes())
                .consentTextVersion(CONSENT_TEXT_VERSION)
                .consentAt(submittedAt)
                .build());

        List<StateChange> history = new ArrayList<>();
        for (Step step : seed.steps()) {
            Instant at = startedAt.minus(step.hoursAgo(), ChronoUnit.HOURS);
            Staff owner = step.field() == StateChangeField.OWNER
                    ? staffAt(staff, step.value())
                    : null;

            switch (step.field()) {
                case STATUS -> application.setStatus(ApplicationStatus.valueOf(step.value()));
                case OWNER -> application.setOwner(owner);
                case DISCARDED -> application.setDiscardedAt(
                        Boolean.parseBoolean(step.value()) ? at : null);
            }

            history.add(StateChange.builder()
                    .application(application)
                    .changedAt(at)
                    .field(step.field())
                    .toValue(step.field() == StateChangeField.OWNER
                            ? (owner == null ? null : owner.getId().toString())
                            : step.value())
                    .build());
        }

        applications.save(application);
        stateChanges.saveAll(history);
        backdate(application.getId(), submittedAt);
    }

    // JPA cannot move submittedAt (@CreationTimestamp, not updatable). This native
    // update is kept off ApplicationRepository so no production path can reach it.
    private void backdate(UUID id, Instant submittedAt) {
        entityManager
                .createNativeQuery("update applications set submitted_at = :at where id = :id")
                .setParameter("at", submittedAt)
                .setParameter("id", id)
                .executeUpdate();
    }

    // Wraps around, so a database with fewer than five accounts still gets a demo.
    private static Staff staffAt(List<Staff> staff, String position) {
        return position == null ? null : staff.get((Integer.parseInt(position) - 1) % staff.size());
    }

    // Hours before start-up.
    private static int ago(int days, int hours) {
        return days * 24 + hours;
    }

    private static Step status(int days, int hours, ApplicationStatus status) {
        return new Step(ago(days, hours), StateChangeField.STATUS, status.name());
    }

    private static Step owner(int days, int hours, int staffPosition) {
        return new Step(
                ago(days, hours), StateChangeField.OWNER, Integer.toString(staffPosition));
    }

    private static Step ownerCleared(int days, int hours) {
        return new Step(ago(days, hours), StateChangeField.OWNER, null);
    }

    private static Step discarded(int days, int hours, boolean discarded) {
        return new Step(
                ago(days, hours), StateChangeField.DISCARDED, Boolean.toString(discarded));
    }

    record Seed(
            String name,
            String email,
            int categoryIndex,
            WeeklyTime weeklyTime,
            String about,
            String internalNotes,
            int hoursAgo,
            List<Step> steps) {
    }

    // value is typed by field, as in to_value: a status name, a 1-based Staff
    // position, null for a cleared Owner, or "true" or "false".
    record Step(int hoursAgo, StateChangeField field, String value) {
    }

}

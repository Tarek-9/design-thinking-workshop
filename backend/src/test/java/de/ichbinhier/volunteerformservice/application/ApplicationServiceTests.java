package de.ichbinhier.volunteerformservice.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;

import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.email.ConfirmationMailer;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

class ApplicationServiceTests {

    private final ApplicationRepository applications = mock(ApplicationRepository.class);
    private final CategoryRepository categories = mock(CategoryRepository.class);
    private final ConfirmationMailer mailer = mock(ConfirmationMailer.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final ApplicationService service = new ApplicationService(
            applications, categories, mailer, events);

    private Category category;
    private ApplicationRequest request;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(UUID.randomUUID()).active(true).build();
        request = new ApplicationRequest(UUID.randomUUID(), category.getId(),
                "  Anna Müller  ", "  anna@example.org  ", WeeklyTime.HOURS_1_2,
                "  Moderation  ", true, "2026-09", "");
    }

    @Test
    void ignoresABotBeforeLookingUpOrSendingAnything() {
        request.setWebsite("spam");

        assertThat(service.submit(request)).isNotNull();
        verifyNoInteractions(applications, categories, mailer, events);
    }

    @Test
    void returnsAnExistingIdBeforeRevalidatingTheCategory() {
        Application existing = Application.builder().id(UUID.randomUUID()).build();
        when(applications.findBySubmissionId(request.getSubmissionId()))
                .thenReturn(Optional.of(existing));

        assertThat(service.submit(request)).isEqualTo(existing.getId());
        verifyNoInteractions(categories, mailer, events);
    }

    @Test
    void rejectsAnUnknownCategoryWithoutNotifying() {
        when(categories.findById(category.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.submit(request))
                .isInstanceOf(FieldValidationException.class)
                .hasMessage("CATEGORY_UNKNOWN");
        verifyNoInteractions(mailer, events);
    }

    @Test
    void rejectsAnInactiveCategoryWithoutNotifying() {
        category.setActive(false);
        when(categories.findById(category.getId())).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> service.submit(request))
                .isInstanceOf(FieldValidationException.class)
                .hasMessage("CATEGORY_UNAVAILABLE");
        verifyNoInteractions(mailer, events);
    }

    @Test
    void normalizesTheApplicationBeforeSavingAndNotifiesInOrder() {
        acceptApplication();
        Instant before = Instant.now();

        UUID id = service.submit(request);

        ArgumentCaptor<Application> captured = ArgumentCaptor.forClass(Application.class);
        var ordered = inOrder(applications, events, mailer);
        ordered.verify(applications).findBySubmissionId(request.getSubmissionId());
        ordered.verify(applications).saveAndFlush(captured.capture());
        Application saved = captured.getValue();
        assertThat(saved.getId()).isEqualTo(id);
        assertThat(saved.getSubmissionId()).isEqualTo(request.getSubmissionId());
        assertThat(saved.getCategory()).isSameAs(category);
        assertThat(saved.getName()).isEqualTo("Anna Müller");
        assertThat(saved.getEmail()).isEqualTo("anna@example.org");
        assertThat(saved.getWeeklyTime()).isEqualTo(WeeklyTime.HOURS_1_2);
        assertThat(saved.getAbout()).isEqualTo("Moderation");
        assertThat(saved.getConsentTextVersion()).isEqualTo("2026-09");
        assertThat(saved.getConsentAt()).isBetween(before.minusMillis(1), Instant.now());
        assertThat(saved.getStatus()).isEqualTo(ApplicationStatus.NEW);
        ordered.verify(events).publishEvent(new ApplicationSubmitted(saved));
        ordered.verify(mailer).sendConfirmation(saved);
    }

    @Test
    void keepsAnAbsentAboutNull() {
        assertAboutStoredAsNull(null);
    }

    @Test
    void normalizesAnEmptyAboutToNull() {
        assertAboutStoredAsNull("");
    }

    @Test
    void normalizesAWhitespaceOnlyAboutToNull() {
        assertAboutStoredAsNull(" \t ");
    }

    @Test
    void returnsTheConcurrentWinnerWithoutSendingADuplicateNotification() {
        when(categories.findById(category.getId())).thenReturn(Optional.of(category));
        Application winner = Application.builder().id(UUID.randomUUID()).build();
        when(applications.findBySubmissionId(request.getSubmissionId()))
                .thenReturn(Optional.empty(), Optional.of(winner));
        when(applications.saveAndFlush(any(Application.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThat(service.submit(request)).isEqualTo(winner.getId());
        verifyNoInteractions(mailer, events);
    }

    @Test
    void rethrowsAnUnrelatedIntegrityFailureWithoutNotifying() {
        when(categories.findById(category.getId())).thenReturn(Optional.of(category));
        DataIntegrityViolationException failure = new DataIntegrityViolationException("invalid");
        when(applications.saveAndFlush(any(Application.class))).thenThrow(failure);

        assertThatThrownBy(() -> service.submit(request)).isSameAs(failure);
        verifyNoInteractions(mailer, events);
    }

    private void assertAboutStoredAsNull(String about) {
        request.setAbout(about);
        acceptApplication();
        service.submit(request);
        ArgumentCaptor<Application> captured = ArgumentCaptor.forClass(Application.class);
        verify(applications).saveAndFlush(captured.capture());
        assertThat(captured.getValue().getAbout()).isNull();
    }

    private void acceptApplication() {
        when(categories.findById(category.getId())).thenReturn(Optional.of(category));
        when(applications.saveAndFlush(any(Application.class))).thenAnswer(call -> {
            Application saved = call.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
    }
}

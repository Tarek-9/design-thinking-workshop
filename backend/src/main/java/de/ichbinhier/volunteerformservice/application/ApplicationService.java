package de.ichbinhier.volunteerformservice.application;

import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.email.ConfirmationMailer;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applications;
    private final CategoryRepository categories;
    private final ConfirmationMailer confirmationMailer;
    private final ApplicationEventPublisher events;


    public UUID submit(ApplicationRequest request) {
        if (request.looksLikeABot()) {
            return UUID.randomUUID();
        }

        var existing = applications.findBySubmissionId(request.getSubmissionId());
        if (existing.isPresent()) {
            return existing.get().getId();
        }

        Category category = categories.findById(request.getCategoryId())
                .orElseThrow(() -> new FieldValidationException("categoryId", "CATEGORY_UNKNOWN"));
        if (!category.isActive()) {
            throw new FieldValidationException("categoryId", "CATEGORY_UNAVAILABLE");
        }

        Application saved;
        try {
            saved = applications.saveAndFlush(ApplicationMapper.from(request, category));
        } catch (DataIntegrityViolationException exception) {
            return applications.findBySubmissionId(request.getSubmissionId())
                    .orElseThrow(() -> exception)
                    .getId();
        }

        events.publishEvent(new ApplicationSubmitted(saved));
        confirmationMailer.sendConfirmation(saved);
        return saved.getId();
    }
}

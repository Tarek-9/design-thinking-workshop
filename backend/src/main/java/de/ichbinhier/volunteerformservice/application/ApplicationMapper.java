package de.ichbinhier.volunteerformservice.application;

import de.ichbinhier.volunteerformservice.category.Category;

final class ApplicationMapper {

    private ApplicationMapper() {
    }

    static Application from(ApplicationRequest request, Category category) {
        String about = request.getAbout() == null ? null : request.getAbout().trim();

        return Application.builder()
                .submissionId(request.getSubmissionId())
                .category(category)
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .weeklyTime(request.getWeeklyTime())
                .about(about == null || about.isEmpty() ? null : about)
                .consentAt(StoredInstant.now())
                .consentTextVersion(request.getConsentTextVersion())
                .build();
    }
}

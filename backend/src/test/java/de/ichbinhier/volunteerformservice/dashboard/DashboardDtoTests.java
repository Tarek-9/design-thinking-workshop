package de.ichbinhier.volunteerformservice.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.StateChange;
import de.ichbinhier.volunteerformservice.application.StateChangeField;
import de.ichbinhier.volunteerformservice.category.Category;

class DashboardDtoTests {

    private final UUID applicationId = UUID.randomUUID();
    private final Instant changedAt = Instant.parse("2026-09-08T10:00:00Z");

    @Test
    void mapsAllCategoryFieldsWithoutNormalizingThem() {
        Category category = Category.builder()
                .id(UUID.randomUUID())
                .name("Social Media")
                .description(null)
                .active(false)
                .displayOrder(3)
                .build();

        assertThat(CategoryDto.of(category))
                .isEqualTo(new CategoryDto(category.getId(), "Social Media", null, false));
    }

    @Test
    void keepsAStatusValueAsAString() {
        assertThat(StateChangeDto.of(change(StateChangeField.STATUS, "IN_REVIEW")))
                .isEqualTo(new StateChangeDto(applicationId, changedAt, "STATUS", "IN_REVIEW"));
    }

    @Test
    void keepsAnOwnerIdentifierAsAStringAndAClearedOwnerAsNull() {
        String ownerId = UUID.randomUUID().toString();

        assertThat(StateChangeDto.of(change(StateChangeField.OWNER, ownerId)))
                .isEqualTo(new StateChangeDto(applicationId, changedAt, "OWNER", ownerId));
        assertThat(StateChangeDto.of(change(StateChangeField.OWNER, null)))
                .isEqualTo(new StateChangeDto(applicationId, changedAt, "OWNER", null));
    }

    @Test
    void convertsBothDiscardedValuesToBooleans() {
        assertThat(StateChangeDto.of(change(StateChangeField.DISCARDED, "true")))
                .isEqualTo(new StateChangeDto(applicationId, changedAt, "DISCARDED", true));
        assertThat(StateChangeDto.of(change(StateChangeField.DISCARDED, "false")))
                .isEqualTo(new StateChangeDto(applicationId, changedAt, "DISCARDED", false));
    }

    private StateChange change(StateChangeField field, String toValue) {
        return StateChange.builder()
                .application(Application.builder().id(applicationId).build())
                .changedAt(changedAt)
                .field(field)
                .toValue(toValue)
                .build();
    }
}

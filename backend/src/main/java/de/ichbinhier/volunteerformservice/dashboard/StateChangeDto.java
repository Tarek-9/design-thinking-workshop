package de.ichbinhier.volunteerformservice.dashboard;

import java.time.Instant;
import java.util.UUID;

import de.ichbinhier.volunteerformservice.application.StateChange;
import de.ichbinhier.volunteerformservice.application.StateChangeField;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StateChangeDto {
    private UUID applicationId;
    private Instant at;
    private String field;
    private Object to;

    static StateChangeDto of(StateChange change) {
        Object toValue = change.getToValue();
        if (change.getField() == StateChangeField.DISCARDED) {
            toValue = Boolean.parseBoolean(change.getToValue());
        }

        StateChangeDto dto = new StateChangeDto();
        dto.setApplicationId(change.getApplication().getId());
        dto.setAt(change.getChangedAt());
        dto.setField(change.getField().name());
        dto.setTo(toValue);
        return dto;
    }
}

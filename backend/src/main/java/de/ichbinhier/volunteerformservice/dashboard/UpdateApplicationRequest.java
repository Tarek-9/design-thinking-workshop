package de.ichbinhier.volunteerformservice.dashboard;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import de.ichbinhier.volunteerformservice.FieldLimits;

import lombok.Data;
import lombok.NoArgsConstructor;

// No all-args constructor: Jackson would use it and skip setOwnerId, and an
// absent ownerId must differ from an explicit null.
@Data
@NoArgsConstructor
public class UpdateApplicationRequest {

    // Sent immutable fields are rejected; ignoring them would hide client bugs.
    private static final Set<String> IMMUTABLE_FIELDS = Set.of(
        "name", "email", "about", "weeklyTime", "categoryId", "consentAt", "consentTextVersion");

    private String status;
    private UUID ownerId;

    @Size(max = FieldLimits.NOTES_MAX, message = "NOTES_TOO_LONG")
    private String internalNotes;

    private Boolean discarded;

    @JsonIgnore
    private final Set<String> fieldsSent = new LinkedHashSet<>();

    @JsonIgnore
    private final Set<String> immutableFieldsSent = new LinkedHashSet<>();

    // Absent leaves the Owner alone and null clears it: the setter records which was sent.
    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
        this.fieldsSent.add("ownerId");
    }

    @JsonIgnore
    boolean isOwnerIdSent() {
        return fieldsSent.contains("ownerId");
    }

    @JsonAnySetter
    void unmapped(String field, Object value) {
        if (IMMUTABLE_FIELDS.contains(field)) {
            immutableFieldsSent.add(field);
        }
    }

    @JsonIgnore
    String firstImmutableFieldSent() {
        return immutableFieldsSent.stream().findFirst().orElse(null);
    }

}

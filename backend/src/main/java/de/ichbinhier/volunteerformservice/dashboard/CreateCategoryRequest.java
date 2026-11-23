package de.ichbinhier.volunteerformservice.dashboard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import de.ichbinhier.volunteerformservice.FieldLimits;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {

    private String name;

    private String description;

    private Boolean active;

    @NotBlank(message = "CATEGORY_NAME_REQUIRED")
    @Size(max = FieldLimits.CATEGORY_NAME_MAX, message = "CATEGORY_NAME_TOO_LONG")
    public String getName() {
        return name != null ? name.trim() : null;
    }

    @Size(max = FieldLimits.CATEGORY_DESCRIPTION_MAX, message = "CATEGORY_DESCRIPTION_TOO_LONG")
    public String getDescription() {
        return description;
    }

}

package de.ichbinhier.volunteerformservice.category;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoriesResponse {
    List<Item> categories;

    // The frontend rejects any other shape, so the field must stay "label".
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        UUID id;
        String label;
    }

}

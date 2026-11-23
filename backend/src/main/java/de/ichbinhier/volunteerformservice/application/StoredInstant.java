package de.ichbinhier.volunteerformservice.application;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

// Truncated to microseconds, what the database keeps, so a value held in memory
// equals the one a later read returns.
public final class StoredInstant {

    public static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    private StoredInstant() {}

}

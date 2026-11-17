package de.ichbinhier.volunteerformservice.web.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * The two invented durations behind a Sign-in: how long inactivity is tolerated
 * (`A17`) and how a run of failed attempts from one address is throttled
 * (`A20`). Both are configured rather than compiled in, because both are values
 * the association may want different once the platform is theirs.
 */
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "sign-in")
public class SignInProperties {

    private static final int DEFAULT_INACTIVITY_HOURS = 12;
    private static final int DEFAULT_ATTEMPT_LIMIT = 5;
    private static final int DEFAULT_ATTEMPT_WINDOW_MINUTES = 15;
    private static final int DEFAULT_ATTEMPT_ADDRESS_LIMIT = 10_000;

    /** Twelve hours of sliding inactivity ends a Sign-in (`A17`). */
    private Duration inactivity = Duration.ofHours(DEFAULT_INACTIVITY_HOURS);

    /** Failures from one address tolerated inside {@link #attemptWindow} (`A20`). */
    private int attemptLimit = DEFAULT_ATTEMPT_LIMIT;

    /** How long a run of failed attempts is remembered (`A20`). */
    private Duration attemptWindow =
            Duration.ofMinutes(DEFAULT_ATTEMPT_WINDOW_MINUTES);

    /**
     * How many addresses may be remembered at once. A throttle put up against
     * password guessing must not itself become a way to fill the heap from a
     * changing address, so the count is bounded and the bound is a value, not a
     * magic number in the store.
     */
    private int attemptAddressLimit = DEFAULT_ATTEMPT_ADDRESS_LIMIT;

}

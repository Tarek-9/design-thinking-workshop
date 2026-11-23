package de.ichbinhier.volunteerformservice.web.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

// Configurable: the association may want other values later.
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "sign-in")
public class SignInProperties {

    private static final int DEFAULT_INACTIVITY_HOURS = 12;
    private static final int DEFAULT_ATTEMPT_LIMIT = 5;
    private static final int DEFAULT_ATTEMPT_WINDOW_MINUTES = 15;
    private static final int DEFAULT_ATTEMPT_ADDRESS_LIMIT = 10_000;

    private Duration inactivity = Duration.ofHours(DEFAULT_INACTIVITY_HOURS);

    private int attemptLimit = DEFAULT_ATTEMPT_LIMIT;

    private Duration attemptWindow =
            Duration.ofMinutes(DEFAULT_ATTEMPT_WINDOW_MINUTES);

    // Bounded, so the throttle cannot be used to fill the heap from changing addresses.
    private int attemptAddressLimit = DEFAULT_ATTEMPT_ADDRESS_LIMIT;

}

package de.ichbinhier.volunteerformservice.web.config;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.staff.Staff;

// In memory, so a restart ends every Sign-in. Holds the Staff id, so a corrected
// or deleted member shows on the next request.
@Component
public class SignIns {

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final int TOKEN_BYTES = 32;

    private final ConcurrentHashMap<String, OpenSignIn> byToken = new ConcurrentHashMap<>();

    private final Duration inactivity;

    SignIns(SignInProperties properties) {
        this.inactivity = properties.getInactivity();
    }

    public String open(Staff staff) {
        String token = freshToken();
        byToken.put(token, new OpenSignIn(staff.getId(), Instant.now()));
        return token;
    }

    // Reading a Sign-in slides its expiry. Expired entries are dropped on access,
    // with no sweep.
    public Optional<UUID> touch(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        OpenSignIn open = byToken.compute(token, (ignored, existing) -> {
            if (existing == null || existing.hasExpiredBy(now, inactivity)) {
                return null;
            }
            return existing.seenAt(now);
        });

        return Optional.ofNullable(open).map(OpenSignIn::staffId);
    }

    public void close(String token) {
        if (token != null) {
            byToken.remove(token);
        }
    }

    public Duration getInactivity() {
        return inactivity;
    }

    private static String freshToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private record OpenSignIn(UUID staffId, Instant lastSeen) {

        boolean hasExpiredBy(Instant now, Duration inactivity) {
            return lastSeen.plus(inactivity).isBefore(now);
        }

        OpenSignIn seenAt(Instant now) {
            return new OpenSignIn(staffId, now);
        }

    }

}

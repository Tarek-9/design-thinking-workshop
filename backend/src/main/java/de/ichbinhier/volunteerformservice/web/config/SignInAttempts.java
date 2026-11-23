package de.ichbinhier.volunteerformservice.web.config;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

// Throttles by address: with no administrator, a lock on an account could never
// be released.
@Component
public class SignInAttempts {

    private static final Logger log = LoggerFactory.getLogger(SignInAttempts.class);

    private final ConcurrentHashMap<String, FailureRun> byAddress = new ConcurrentHashMap<>();

    private final int limit;

    private final Duration window;

    private final int addressLimit;

    SignInAttempts(SignInProperties properties) {
        this.limit = properties.getAttemptLimit();
        this.window = properties.getAttemptWindow();
        this.addressLimit = properties.getAttemptAddressLimit();
    }

    // Checked before the password, so a throttled address learns nothing and costs no bcrypt.
    public Optional<Duration> throttleFor(String address) {
        Instant now = Instant.now();
        FailureRun run = byAddress.compute(address, (ignored, existing) -> {
            if (existing == null || existing.hasLapsedBy(now, window)) {
                return null;
            }
            return existing;
        });

        if (run == null || run.count() < limit) {
            return Optional.empty();
        }
        return Optional.of(run.remainingOf(now, window));
    }

    public void failed(String address) {
        Instant now = Instant.now();
        forgetEverythingIfFull(address);
        byAddress.compute(address, (ignored, existing) -> {
            if (existing == null || existing.hasLapsedBy(now, window)) {
                return new FailureRun(1, now);
            }
            return existing.andAnother();
        });
    }

    // A successful sign-in is not guessing, so the address starts fresh.
    public void succeeded(String address) {
        byAddress.remove(address);
    }

    // Clears all entries when full, which needs no eviction order.
    private void forgetEverythingIfFull(String address) {
        if (byAddress.size() >= addressLimit && !byAddress.containsKey(address)) {
            log.warn("Remembering {} addresses with failed sign-ins, the limit; dropping all of them",
                    byAddress.size());
            byAddress.clear();
        }
    }

    private record FailureRun(int count, Instant firstAt) {

        boolean hasLapsedBy(Instant now, Duration window) {
            return firstAt.plus(window).isBefore(now);
        }

        Duration remainingOf(Instant now, Duration window) {
            Duration left = Duration.between(now, firstAt.plus(window));
            return left.isNegative() ? Duration.ZERO : left;
        }

        FailureRun andAnother() {
            return new FailureRun(count + 1, firstAt);
        }

    }

}

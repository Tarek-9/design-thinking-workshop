package de.ichbinhier.volunteerformservice.web.config;

import java.time.Duration;
import java.util.Optional;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

// The cookie carries the token because EventSource cannot set headers, and a
// token in the stream URL would reach proxy logs.
@Component
public class SignInCookie {

    public static final String NAME = "ibh_session";

    private final Duration maxAge;

    SignInCookie(SignInProperties properties) {
        this.maxAge = properties.getInactivity();
    }

    // Re-sent on every response, so Max-Age slides with the Sign-in.
    public ResponseCookie carrying(String token) {
        return base(token).maxAge(maxAge).build();
    }

    public ResponseCookie cleared() {
        return base("").maxAge(0).build();
    }

    public static Optional<String> tokenIn(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName())) {
                return Optional.ofNullable(cookie.getValue());
            }
        }
        return Optional.empty();
    }

    private static ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/");
    }

}

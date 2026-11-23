package de.ichbinhier.volunteerformservice.web;

import java.net.URI;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;

// The dashboard looks its wording up by code and never reads the message.
public final class ApiProblem {

    private static final String TYPE_PREFIX = "https://ichbinhier.eu/problems/";

    private ApiProblem() {
    }

    // The security filter chain answers before controller advice, so no Jackson here.
    public static String asJson(HttpStatusCode status, String code) {
        return """
               {"type":"%s","title":"%s","status":%d,"code":"%s"}"""
                .formatted(type(code), title(code), status.value(), code);
    }

    public static ProblemDetail of(HttpStatusCode status, String code) {
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setType(type(code));
        problem.setTitle(title(code));
        problem.setProperty("code", code);
        return problem;
    }

    // Unknown statuses map to a general code the dashboard can word.
    public static String codeFor(HttpStatusCode status) {
        if (status.is5xxServerError()) {
            return "INTERNAL_ERROR";
        }
        if (status.value() == HttpStatus.UNAUTHORIZED.value()) {
            return "UNAUTHENTICATED";
        }
        HttpStatus known = HttpStatus.resolve(status.value());
        return known != null ? known.name() : "INTERNAL_ERROR";
    }

    private static URI type(String code) {
        return URI.create(TYPE_PREFIX + code.toLowerCase(Locale.ROOT).replace('_', '-'));
    }

    private static String title(String code) {
        String words = code.toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }

}

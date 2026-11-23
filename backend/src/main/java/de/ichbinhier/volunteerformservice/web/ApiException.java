package de.ichbinhier.volunteerformservice.web;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private final HttpHeaders headers;

    public ApiException(HttpStatus status, String code) {
        this(status, code, HttpHeaders.EMPTY);
    }

    public ApiException(HttpStatus status, String code, HttpHeaders headers) {
        super(code);
        this.status = status;
        this.code = code;
        this.headers = headers;
    }

    public static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    // 403, not 401: a 401 makes browsers drop cached Basic Auth credentials.
    public static ApiException unauthenticated() {
        return new ApiException(HttpStatus.FORBIDDEN, "UNAUTHENTICATED");
    }

    public static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.FORBIDDEN, "INVALID_CREDENTIALS");
    }

    public static ApiException notDiscarded() {
        return new ApiException(HttpStatus.BAD_REQUEST, "NOT_DISCARDED");
    }

    public static ApiException categoryInUse() {
        return new ApiException(HttpStatus.CONFLICT, "CATEGORY_IN_USE");
    }

    // Retry-After is for clients reading the API by hand; the dashboard ignores it.
    public static ApiException rateLimited(Duration retryAfter) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, String.valueOf(Math.max(1, retryAfter.toSeconds())));
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", headers);
    }

}

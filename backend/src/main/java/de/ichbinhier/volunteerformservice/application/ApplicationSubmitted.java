package de.ichbinhier.volunteerformservice.application;

// Published only once stored, so the form need not know a dashboard exists.
// A repeated submissionId stores nothing, so it publishes nothing.
public record ApplicationSubmitted(Application application) {}

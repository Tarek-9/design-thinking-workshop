package de.ichbinhier.volunteerformservice.email;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

// Shared with NoopEmailSender (its negation): exactly one EmailSender bean exists.
class HasResendApiKey implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String apiKey = context.getEnvironment().getProperty("resend.api-key");
        return StringUtils.hasText(apiKey);
    }


    static class NotSet implements Condition {

        private final HasResendApiKey delegate = new HasResendApiKey();

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return !delegate.matches(context, metadata);
        }

    }

}

package de.ichbinhier.volunteerformservice.email;

import org.springframework.context.annotation.Conditional;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

// Used when resend.api-key is unset, so local runs and tests send nothing.
@Slf4j
@Component
@Conditional(HasResendApiKey.NotSet.class)
public class NoopEmailSender implements EmailSender {

    @Override
    public void send(String toAddress, String subject, String htmlBody) {
        log.info("Email not sent (no RESEND_API_KEY configured), to={}, subject={}", toAddress, subject);
    }

}

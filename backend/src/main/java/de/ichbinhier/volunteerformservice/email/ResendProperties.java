package de.ichbinhier.volunteerformservice.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.Getter;

@Component
@Getter
@ConfigurationProperties(prefix = "resend")
public class ResendProperties {

    // Set via RESEND_API_KEY, never committed.
    private String apiKey;

    // Stays onboarding@resend.dev until a domain is verified in Resend.
    private String from = "onboarding@resend.dev";


    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    // An empty RESEND_FROM (set but blank in .env) must fall back to the default.
    public void setFrom(String from) {
        if (StringUtils.hasText(from)) {
            this.from = from;
        }
    }

}

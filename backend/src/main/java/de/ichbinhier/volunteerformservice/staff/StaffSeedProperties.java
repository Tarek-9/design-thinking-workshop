package de.ichbinhier.volunteerformservice.staff;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.Getter;
import lombok.Setter;

// An unset variable binds as an empty string, so blank passwords count as missing.
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "staff")
public class StaffSeedProperties {

    private List<String> seedPasswords = new ArrayList<>();

    // Fail fast: without seeded accounts nobody can sign in.
    public String passwordFor(int position) {
        String password = position <= seedPasswords.size() ? seedPasswords.get(position - 1) : null;
        if (!StringUtils.hasText(password)) {
            throw new IllegalStateException(
                    "STAFF_" + position + "_PASSWORD is not set, so the seeded staff account "
                            + position + " of " + StaffSeeder.MEMBERS.size()
                            + " cannot be created. See .env.example.");
        }
        return password;
    }

}

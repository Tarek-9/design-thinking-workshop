package de.ichbinhier.volunteerformservice.demo;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;

import lombok.RequiredArgsConstructor;

// A fixed login for the presentation, so a fresh volume can be shown at once.
// Demo profile only. Runs after DemoSeeder, which picks Owners by position in the staff list.
@Component
@Profile("demo")
@Order(DemoAccountSeeder.AFTER_THE_DEMO_DATA)
@RequiredArgsConstructor
public class DemoAccountSeeder implements ApplicationRunner {

    static final int AFTER_THE_DEMO_DATA = DemoSeeder.AFTER_THE_CATEGORIES_AND_THE_STAFF_ACCOUNTS + 1;
    static final String EMAIL = "test@test.de";
    static final String PASSWORD = "test";
    static final String NAME = "Test";

    private final StaffRepository staffMembers;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (staffMembers.findByEmail(EMAIL).isPresent()) {
            return;
        }
        staffMembers.save(Staff.builder()
                .name(NAME)
                .email(EMAIL)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .build());
    }

}

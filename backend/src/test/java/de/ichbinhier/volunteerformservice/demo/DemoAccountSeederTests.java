package de.ichbinhier.volunteerformservice.demo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;

// The seeder is a demo bean, so it is built by hand here; the suite runs under test.
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DemoAccountSeederTests {

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    private DemoAccountSeeder seeder;

    @BeforeEach
    void reset() {
        staffMembers.findByEmail(DemoAccountSeeder.EMAIL).ifPresent(staffMembers::delete);
        seeder = new DemoAccountSeeder(staffMembers, passwordEncoder);
    }

    @Test
    void createsTheDemoLoginOnAFreshDatabase() {
        seeder.run(null);

        Staff account = staffMembers.findByEmail("test@test.de").orElseThrow();
        assertThat(account.getName()).isEqualTo("Test");
        assertThat(passwordEncoder.matches("test", account.getPasswordHash())).isTrue();
    }

    @Test
    void leavesAnExistingAccountAsItIs() {
        staffMembers.save(Staff.builder()
                .name("Someone")
                .email("test@test.de")
                .passwordHash("kept")
                .build());

        seeder.run(null);
        seeder.run(null);

        Staff account = staffMembers.findByEmail("test@test.de").orElseThrow();
        assertThat(account.getName()).isEqualTo("Someone");
        assertThat(account.getPasswordHash()).isEqualTo("kept");
    }

    @Test
    void runsAfterTheDemoData() {
        int order = DemoAccountSeeder.class.getAnnotation(Order.class).value();
        int demoData = DemoSeeder.class.getAnnotation(Order.class).value();

        assertThat(order).isGreaterThan(demoData);
    }

}

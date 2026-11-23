package de.ichbinhier.volunteerformservice.staff;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;

import lombok.RequiredArgsConstructor;

@Component
@Profile("!test")
@Order(2)
@RequiredArgsConstructor
public class StaffSeeder implements ApplicationRunner {

    private static final String RETIRED_ACCOUNT = "staff@ichbinhier.example";

    static final List<SeededMember> MEMBERS = List.of(
            new SeededMember("Ashton Blackwell", "ashton.blackwell@ichbinhier.online"),
            new SeededMember("Samuel Adeyemi", "samuel.adeyemi@ichbinhier.online"),
            new SeededMember("Marlene Kirchner", "marlene.kirchner@ichbinhier.online"),
            new SeededMember("Tomasz Wieczorek", "tomasz.wieczorek@ichbinhier.online"),
            new SeededMember("Yasmin Sadeghi", "yasmin.sadeghi@ichbinhier.online"));

    private final StaffRepository staffRepo;
    private final ApplicationRepository applications;
    private final PasswordEncoder passwordEncoder;
    private final StaffSeedProperties passwords;

    // Seeded per address, so a partly seeded database gets the rest. A missing
    // password only matters for an account still to create.
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (int position = 1; position <= MEMBERS.size(); position++) {
            SeededMember member = MEMBERS.get(position - 1);
            if (staffRepo.findByEmail(member.email()).isPresent()) {
                continue;
            }
            staffRepo.save(Staff.builder()
                    .name(member.name())
                    .email(member.email())
                    .passwordHash(passwordEncoder.encode(passwords.passwordFor(position)))
                    .build());
        }

        retireTheHardCodedAccount();
    }

    // A leftover account with a literal password would stay a working key.
    // Its Applications are unowned first, in the same transaction.
    private void retireTheHardCodedAccount() {
        staffRepo.findByEmail(RETIRED_ACCOUNT).ifPresent(retired -> {
            List<Application> owned = applications.findAllByOwnerId(retired.getId());
            owned.forEach(application -> application.setOwner(null));
            applications.saveAll(owned);
            staffRepo.delete(retired);
        });
    }

    record SeededMember(String name, String email) {
    }

}

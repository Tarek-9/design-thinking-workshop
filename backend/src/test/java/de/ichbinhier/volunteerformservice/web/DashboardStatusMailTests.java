package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.application.WeeklyTime;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.email.EmailSender;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.config.SignIns;

// A failing mail provider must never fail the change, and a PATCH that keeps the
// Status mails nothing.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardStatusMailTests {

    @Autowired private MockMvc mvc;

    @Autowired private ApplicationRepository applications;

    @Autowired private StateChangeRepository changes;

    @Autowired private CategoryRepository categories;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @Autowired private SignIns signIns;

    @MockitoBean private EmailSender sender;

    private Application onFile;

    private Cookie signIn;

    @BeforeEach
    void reset() {
        changes.deleteAll();
        applications.deleteAll();
        categories.deleteAll();
        staffMembers.deleteAll();

        Category socialMedia = categories.save(
                Category.builder().name("Social Media").displayOrder(1).active(true).build());
        Staff ashton = staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email("ashton.blackwell@ichbinhier.online")
                .passwordHash(passwordEncoder.encode("correct horse"))
                .build());
        signIn = new Cookie("ibh_session", signIns.open(ashton));
        onFile = applications.save(application(socialMedia));
    }

    @AfterEach
    void clear() {
        changes.deleteAll();
        applications.deleteAll();
    }

    @Test
    void mailsTheApplicantOnEveryStatusChange() throws Exception {
        for (String status : new String[] {"IN_REVIEW", "INTRO_BOOKED", "ACTIVE", "WAITLISTED", "DECLINED", "NEW"}) {
            patchStatus(status).andExpect(status().isOk());

            verify(sender, times(1))
                    .send(eq("anna@example.de"), anyString(), anyString());
            clearInvocations(sender);
        }
    }

    @Test
    void sendsNothingWhenTheStatusStaysTheSame() throws Exception {
        patchStatus("NEW").andExpect(status().isOk());

        verify(sender, never()).send(any(), any(), any());
    }

    @Test
    void aFailingMailDoesNotBlockTheStatusChange() throws Exception {
        doThrow(new RuntimeException("resend is down"))
                .when(sender).send(any(), any(), any());

        patchStatus("DECLINED").andExpect(status().isOk());

        assertThat(applications.findById(onFile.getId()).orElseThrow().getStatus().name())
                .isEqualTo("DECLINED");
    }

    private ResultActions patchStatus(String status) throws Exception {
        return mvc.perform(patch("/api/v1/staff/applications/" + onFile.getId())
                .cookie(signIn)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\"}"));
    }

    private static Application application(Category category) {
        return Application.builder()
                .submissionId(UUID.randomUUID())
                .category(category)
                .name("Anna Müller")
                .email("anna@example.de")
                .weeklyTime(WeeklyTime.HOURS_1_2)
                .about("Ich arbeite seit drei Jahren in der Moderation.")
                .consentTextVersion("2026-09")
                .consentAt(Instant.now())
                .build();
    }

}

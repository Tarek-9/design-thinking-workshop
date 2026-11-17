package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff/applications")
@RequiredArgsConstructor
public class DashboardApplicationController {

    private final DashboardApplicationService applications;

    @GetMapping
    ResponseEntity<ApplicationsResponse> list() {
        ApplicationsResponse response = new ApplicationsResponse();
        response.setApplications(applications.list());
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(response);
    }

    @GetMapping("/changes")
    ResponseEntity<ChangesResponse> changes(@RequestParam(defaultValue = "30") int days) {
        ChangesResponse response = new ChangesResponse();
        response.setChanges(applications.changes(days));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(response);
    }

    @PatchMapping("/{id}")
    ResponseEntity<ApplicationDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateApplicationRequest req) {

        return ResponseEntity.ok(applications.update(id, req));
    }

    @DeleteMapping("/{id}/permanently")
    ResponseEntity<Void> deletePermanently(@PathVariable UUID id) {
        applications.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }

}

package de.ichbinhier.volunteerformservice.dashboard;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationDocumentService;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.ApplicationStatus;
import de.ichbinhier.volunteerformservice.application.StateChange;
import de.ichbinhier.volunteerformservice.application.StateChangeField;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.application.StoredInstant;
import de.ichbinhier.volunteerformservice.email.StatusChangeMailer;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class DashboardApplicationService {

    private final ApplicationRepository applications;
    private final StaffRepository staffMembers;
    private final StateChangeRepository changes;
    private final ApplicationDocumentService documents;
    private final ApplicationEventStream stream;
    private final StatusChangeMailer statusMailer;

    List<ApplicationDto> list() {
        return applications.findAllByOrderBySubmittedAtDesc().stream()
                .map(ApplicationDto::of)
                .toList();
    }

    List<StateChangeDto> changes(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return changes.findByChangedAtGreaterThanEqualOrderByChangedAtAsc(since).stream()
                .map(StateChangeDto::of)
                .toList();
    }

    @Transactional
    ApplicationDto update(UUID id, UpdateApplicationRequest request) {
        String immutable = request.firstImmutableFieldSent();
        if (immutable != null) {
            throw new FieldValidationException(immutable, "IMMUTABLE_FIELD");
        }

        var application = applications.findByIdForUpdate(id)
                .orElseThrow(ApiException::notFound);

        boolean statusChanged = false;
        if (request.getStatus() != null) {
            ApplicationStatus status = statusOf(request.getStatus());
            String oldStatus = application.getStatus().name();
            application.setStatus(status);
            if (!oldStatus.equals(request.getStatus())) {
                recordChange(application, StateChangeField.STATUS, request.getStatus());
                statusChanged = true;
            }
        }

        if (request.isOwnerIdSent()) {
            Staff owner = request.getOwnerId() == null
                    ? null
                    : staffMembers.findById(request.getOwnerId())
                            .orElseThrow(() -> new FieldValidationException("ownerId", "OWNER_UNKNOWN"));
            String oldOwner = application.getOwner() != null
                    ? application.getOwner().getId().toString() : null;
            String newOwner = owner != null ? owner.getId().toString() : null;
            application.setOwner(owner);
            if (!Objects.equals(oldOwner, newOwner)) {
                recordChange(application, StateChangeField.OWNER, newOwner);
            }
        }

        if (request.getInternalNotes() != null) {
            application.setInternalNotes(request.getInternalNotes());
        }

        if (request.getDiscarded() != null
                && request.getDiscarded() != (application.getDiscardedAt() != null)) {
            application.setDiscardedAt(request.getDiscarded() ? StoredInstant.now() : null);
            recordChange(application, StateChangeField.DISCARDED, request.getDiscarded().toString());
        }

        applications.save(application);

        if (statusChanged) {
            mailAfterCommit(application);
        }

        ApplicationDto updated = ApplicationDto.of(application);
        stream.updated(updated);
        return updated;
    }

    // The mail fires only after commit: sent before it, a failed commit would
    // announce a change that never landed; sent here, it would hold the row
    // lock for the whole attempt.
    private void mailAfterCommit(Application application) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                statusMailer.sendStatusChange(application);
            }
        });
    }

    /**
     * Documents and State changes own non-nullable foreign keys, so they are erased first.
     * All deletes keep the existing transaction; a failure rolls them back.
     * The stream waits for that transaction to commit before announcing erase.
     */
    @Transactional
    void deletePermanently(UUID id) {
        var application = applications.findById(id)
                .orElseThrow(ApiException::notFound);

        if (application.getDiscardedAt() == null) {
            throw ApiException.notDiscarded();
        }

        ApplicationDto erased = ApplicationDto.of(application);

        documents.eraseAll(id);
        changes.deleteByApplicationId(id);
        applications.deleteById(id);

        stream.deleted(erased);
    }

    private static ApplicationStatus statusOf(String status) {
        try {
            return ApplicationStatus.valueOf(status);
        } catch (IllegalArgumentException unknown) {
            throw new FieldValidationException("status", "STATUS_UNKNOWN");
        }
    }

    private void recordChange(Application application, StateChangeField field, String toValue) {
        changes.save(StateChange.builder()
                .application(application)
                .changedAt(StoredInstant.now())
                .field(field)
                .toValue(toValue)
                .build());
    }

}

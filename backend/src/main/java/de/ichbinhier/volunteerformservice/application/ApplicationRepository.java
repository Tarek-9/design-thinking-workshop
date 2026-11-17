package de.ichbinhier.volunteerformservice.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Application a where a.id = :id")
    Optional<Application> findByIdForUpdate(@Param("id") UUID id);

    Optional<Application> findBySubmissionId(UUID submissionId);

    List<Application> findAllByOrderBySubmittedAtDesc();

    List<Application> findAllByOwnerId(UUID ownerId);

    long countByCategoryId(UUID categoryId);

}

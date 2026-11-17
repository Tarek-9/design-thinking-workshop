package de.ichbinhier.volunteerformservice.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;


public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, UUID> {

    List<ApplicationDocument> findByApplicationIdOrderByUploadedAtAsc(UUID applicationId);

    Optional<ApplicationDocument> findByIdAndApplicationId(UUID id, UUID applicationId);

    List<ApplicationDocument> findByApplicationId(UUID applicationId);

    long countByApplicationId(UUID applicationId);

}

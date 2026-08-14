package com.civix.civix_backend.repository;

import com.civix.civix_backend.entity.Signature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface SignatureRepository extends JpaRepository<Signature, Long> {
    long countByPetitionId(Long petitionId);
    boolean existsByPetitionIdAndUserId(Long petitionId, Long userId);
    Optional<Signature> findByPetitionIdAndUserId(Long petitionId, Long userId);

    @Modifying
    @Query("DELETE FROM Signature s WHERE s.petition.id = :petitionId")
    void deleteByPetitionId(@Param("petitionId") Long petitionId);

    java.util.List<Signature> findAllByTimestampBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}

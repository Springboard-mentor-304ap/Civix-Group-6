package com.civix.civix_backend.repository;

import com.civix.civix_backend.entity.Signature;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SignatureRepository extends JpaRepository<Signature, Long> {
    long countByPetitionId(Long petitionId);
    boolean existsByPetitionIdAndUserId(Long petitionId, Long userId);
    Optional<Signature> findByPetitionIdAndUserId(Long petitionId, Long userId);
}

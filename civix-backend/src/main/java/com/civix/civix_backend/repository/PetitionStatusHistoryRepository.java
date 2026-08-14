package com.civix.civix_backend.repository;

import com.civix.civix_backend.entity.PetitionStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PetitionStatusHistoryRepository extends JpaRepository<PetitionStatusHistory, Long> {
    List<PetitionStatusHistory> findByPetitionIdOrderByUpdatedAtAsc(Long petitionId);
}

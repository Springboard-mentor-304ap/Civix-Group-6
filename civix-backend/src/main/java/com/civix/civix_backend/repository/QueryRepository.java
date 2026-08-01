package com.civix.civix_backend.repository;

import com.civix.civix_backend.entity.CitizenQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QueryRepository extends JpaRepository<CitizenQuery, Long> {
    List<CitizenQuery> findByCitizenId(Long citizenId);
    List<CitizenQuery> findByOfficialId(Long officialId);
    long countByCitizenIdAndStatus(Long citizenId, String status);
}

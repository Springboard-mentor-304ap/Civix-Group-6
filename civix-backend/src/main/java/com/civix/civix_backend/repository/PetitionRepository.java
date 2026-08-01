package com.civix.civix_backend.repository;

import com.civix.civix_backend.entity.Petition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PetitionRepository extends JpaRepository<Petition, Long> {

    List<Petition> findByLocationContainingIgnoreCase(String location);

    List<Petition> findByCreatorId(Long creatorId);

    long countByStatus(String status);

    long countByStatusAndCreatorId(String status, Long creatorId);

    /**
     * Milestone 2: petitions are filterable by location and category (and, additionally,
     * status and creator). Any parameter left null is simply ignored, so this single query
     * backs the plain listing endpoint as well as every combination of filters.
     */
    @Query("SELECT p FROM Petition p WHERE " +
           "(:location IS NULL OR LOWER(p.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:category IS NULL OR LOWER(p.category) = LOWER(:category)) AND " +
           "(:status IS NULL OR UPPER(p.status) = UPPER(:status)) AND " +
           "(:creatorId IS NULL OR p.creator.id = :creatorId) " +
           "ORDER BY p.createdAt DESC")
    List<Petition> search(@Param("location") String location,
                           @Param("category") String category,
                           @Param("status") String status,
                           @Param("creatorId") Long creatorId);
}

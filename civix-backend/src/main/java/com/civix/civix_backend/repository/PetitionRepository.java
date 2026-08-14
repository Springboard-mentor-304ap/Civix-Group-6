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
     * Milestone 2 & 4: petitions are filterable by location, category, status, priority,
     * date range, creator, and text search matching title, creator name, or ID.
     */
    @Query("SELECT p FROM Petition p WHERE " +
           "(:location IS NULL OR LOWER(p.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:category IS NULL OR LOWER(p.category) = LOWER(:category)) AND " +
           "(:status IS NULL OR UPPER(p.status) = UPPER(:status)) AND " +
           "(:creatorId IS NULL OR p.creator.id = :creatorId) AND " +
           "(:priority IS NULL OR UPPER(p.priority) = UPPER(:priority)) AND " +
           "(:startDate IS NULL OR p.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR p.createdAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.creator.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (:searchId IS NOT NULL AND p.id = :searchId)) " +
           "ORDER BY p.createdAt DESC")
    List<Petition> search(@Param("location") String location,
                          @Param("category") String category,
                          @Param("status") String status,
                          @Param("creatorId") Long creatorId,
                          @Param("priority") String priority,
                          @Param("startDate") java.time.LocalDateTime startDate,
                          @Param("endDate") java.time.LocalDateTime endDate,
                          @Param("search") String search,
                          @Param("searchId") Long searchId);

    java.util.List<Petition> findAllByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}

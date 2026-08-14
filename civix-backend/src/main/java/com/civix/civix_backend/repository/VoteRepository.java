package com.civix.civix_backend.repository;

import com.civix.civix_backend.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    long countByPollIdAndSelectedOption(Long pollId, String selectedOption);
    boolean existsByPollIdAndUserId(Long pollId, Long userId);
    List<Vote> findByPollId(Long pollId);
    long countByUserId(Long userId);
    java.util.List<Vote> findAllByTimestampBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}

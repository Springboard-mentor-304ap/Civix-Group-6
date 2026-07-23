package com.civix.civix_backend.repository;

import com.civix.civix_backend.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findByTargetLocationIgnoreCase(String location);
}

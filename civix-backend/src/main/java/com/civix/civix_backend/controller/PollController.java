package com.civix.civix_backend.controller;

import com.civix.civix_backend.dto.PollRequest;
import com.civix.civix_backend.dto.PollResponse;
import com.civix.civix_backend.dto.VoteRequest;
import com.civix.civix_backend.entity.Poll;
import com.civix.civix_backend.entity.Vote;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.repository.PollRepository;
import com.civix.civix_backend.repository.VoteRepository;
import com.civix.civix_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/polls")
public class PollController {

    private final PollRepository pollRepository;
    private final VoteRepository voteRepository;
    private final UserRepository userRepository;

    public PollController(PollRepository pollRepository,
                          VoteRepository voteRepository,
                          UserRepository userRepository) {
        this.pollRepository = pollRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/count/participated")
    public ResponseEntity<Long> countParticipatedPolls(@RequestParam Long userId) {
        return ResponseEntity.ok(voteRepository.countByUserId(userId));
    }

    @GetMapping
    public ResponseEntity<List<PollResponse>> getPolls(Principal principal) {
        final User user;
        if (principal != null) {
            user = userRepository.findByEmail(principal.getName()).orElse(null);
        } else {
            user = null;
        }

        List<Poll> polls = pollRepository.findAll();

        List<PollResponse> responses = polls.stream().map(p -> {
            PollResponse resp = new PollResponse();
            resp.setId(p.getId());
            resp.setTitle(p.getTitle());
            resp.setDescription(p.getDescription());
            resp.setOptions(p.getOptions());
            resp.setStartDate(p.getCreatedAt());
            resp.setEndDate(p.getClosesOn());
            resp.setStatus(p.getStatus());

            // Build results mapping
            Map<String, Long> results = new HashMap<>();
            for (String option : p.getOptions()) {
                long count = voteRepository.countByPollIdAndSelectedOption(p.getId(), option);
                results.put(option, count);
            }
            resp.setResults(results);

            if (user != null) {
                boolean voted = voteRepository.existsByPollIdAndUserId(p.getId(), user.getId());
                resp.setUserVoted(voted);
                if (voted) {
                    voteRepository.findByPollId(p.getId()).stream()
                        .filter(v -> v.getUser().getId().equals(user.getId()))
                        .findFirst()
                        .ifPresent(v -> resp.setSelectedOption(v.getSelectedOption()));
                }
            }

            return resp;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<PollResponse> createPoll(@RequestBody PollRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Poll poll = new Poll();
        poll.setTitle(request.getTitle());
        poll.setDescription(request.getDescription());
        poll.setOptions(request.getOptions());
        poll.setCreatedBy(user);
        poll.setTargetLocation(request.getTargetLocation() != null ? request.getTargetLocation() : user.getCity());
        
        // Convert LocalDate to LocalDateTime
        if (request.getStartDate() != null) {
            poll.setCreatedAt(request.getStartDate().atStartOfDay());
        } else {
            poll.setCreatedAt(LocalDateTime.now());
        }
        if (request.getEndDate() != null) {
            poll.setClosesOn(request.getEndDate().atTime(LocalTime.MAX));
        } else {
            poll.setClosesOn(LocalDateTime.now().plusDays(7));
        }
        poll.setStatus("ACTIVE");

        Poll saved = pollRepository.save(poll);

        PollResponse resp = new PollResponse();
        resp.setId(saved.getId());
        resp.setTitle(saved.getTitle());
        resp.setDescription(saved.getDescription());
        resp.setOptions(saved.getOptions());
        resp.setStartDate(saved.getCreatedAt());
        resp.setEndDate(saved.getClosesOn());
        resp.setStatus(saved.getStatus());

        Map<String, Long> results = new HashMap<>();
        for (String option : saved.getOptions()) {
            results.put(option, 0L);
        }
        resp.setResults(results);

        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<String> voteOnPoll(@PathVariable Long id, @RequestBody VoteRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        if ("CLOSED".equalsIgnoreCase(poll.getStatus())) {
            return ResponseEntity.badRequest().body("This poll has already closed.");
        }

        boolean alreadyVoted = voteRepository.existsByPollIdAndUserId(poll.getId(), user.getId());
        if (alreadyVoted) {
            return ResponseEntity.badRequest().body("You have already voted in this poll.");
        }

        Vote vote = new Vote();
        vote.setPoll(poll);
        vote.setUser(user);
        vote.setSelectedOption(request.getSelectedOption());

        voteRepository.save(vote);

        return ResponseEntity.ok("Vote cast successfully");
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<PollResponse> closePoll(@PathVariable Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        poll.setStatus("CLOSED");
        poll.setClosesOn(LocalDateTime.now());
        Poll saved = pollRepository.save(poll);

        PollResponse resp = new PollResponse();
        resp.setId(saved.getId());
        resp.setTitle(saved.getTitle());
        resp.setDescription(saved.getDescription());
        resp.setOptions(saved.getOptions());
        resp.setStartDate(saved.getCreatedAt());
        resp.setEndDate(saved.getClosesOn());
        resp.setStatus(saved.getStatus());

        Map<String, Long> results = new HashMap<>();
        for (String option : saved.getOptions()) {
            long count = voteRepository.countByPollIdAndSelectedOption(saved.getId(), option);
            results.put(option, count);
        }
        resp.setResults(results);

        return ResponseEntity.ok(resp);
    }
}

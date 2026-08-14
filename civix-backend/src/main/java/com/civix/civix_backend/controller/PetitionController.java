package com.civix.civix_backend.controller;

import com.civix.civix_backend.dto.PetitionRequest;
import com.civix.civix_backend.dto.PetitionResponse;
import com.civix.civix_backend.dto.ReplyRequest;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.exception.ResourceNotFoundException;
import com.civix.civix_backend.repository.UserRepository;
import com.civix.civix_backend.service.PetitionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/petitions")
public class PetitionController {

    private final PetitionService petitionService;
    private final UserRepository userRepository;

    public PetitionController(PetitionService petitionService,
                               UserRepository userRepository) {
        this.petitionService = petitionService;
        this.userRepository = userRepository;
    }

    /**
     * Milestone 2: petition listing and filter view.
     * Supports filtering by location, category, status, and/or creator (userId),
     * any combination of which may be supplied.
     */
    @GetMapping
    public ResponseEntity<List<PetitionResponse>> getPetitions(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @RequestParam(required = false) String search,
            Principal principal) {

        User currentUser = resolveUser(principal);

        // Locality Restriction: Officials can view petitions belonging only to their locality
        if (currentUser != null && currentUser.getRole() == com.civix.civix_backend.entity.Role.OFFICIAL) {
            location = currentUser.getCity();
        }

        java.time.LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        java.time.LocalDateTime endDateTime = endDate != null ? endDate.atTime(java.time.LocalTime.MAX) : null;

        List<PetitionResponse> responses =
                petitionService.listPetitions(location, category, status, userId, currentUser,
                        priority, startDateTime, endDateTime, search);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/count/active")
    public ResponseEntity<Long> countActivePetitions(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(petitionService.countActive(userId));
    }

    @PostMapping
    public ResponseEntity<PetitionResponse> createPetition(
            @Valid @RequestBody PetitionRequest request, Principal principal) {

        User user = requireUser(principal);
        PetitionResponse response = petitionService.createPetition(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Milestone 2: users can edit petitions they created (while still ACTIVE/UNDER_REVIEW).
     * Officials may also edit as a moderation capability.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PetitionResponse> updatePetition(
            @PathVariable Long id,
            @Valid @RequestBody PetitionRequest request,
            Principal principal) {

        User user = requireUser(principal);
        PetitionResponse response = petitionService.updatePetition(id, request, user);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePetition(
            @PathVariable Long id,
            Principal principal) {

        User user = requireUser(principal);
        petitionService.deletePetition(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<PetitionResponse> signPetition(@PathVariable Long id, Principal principal) {
        User user = requireUser(principal);
        PetitionResponse response = petitionService.signPetition(id, user);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<java.util.Map<String, Boolean>> updateStatus(
            @PathVariable Long id,
            @RequestBody ReplyRequest request,
            Principal principal) {
        User official = requireUser(principal);
        petitionService.updateStatus(id, request, official);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<com.civix.civix_backend.dto.PetitionTimelineResponse>> getTimeline(@PathVariable Long id) {
        List<com.civix.civix_backend.dto.PetitionTimelineResponse> timeline = petitionService.getTimeline(id);
        return ResponseEntity.ok(timeline);
    }

    // ========================
    // Helpers
    // ========================

    private User resolveUser(Principal principal) {
        if (principal == null) {
            return null;
        }
        return userRepository.findByEmail(principal.getName()).orElse(null);
    }

    private User requireUser(Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Authentication required");
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }
}

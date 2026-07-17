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
            Principal principal) {

        User currentUser = resolveUser(principal);
        List<PetitionResponse> responses =
                petitionService.listPetitions(location, category, status, userId, currentUser);
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

    @PostMapping("/{id}/sign")
    public ResponseEntity<PetitionResponse> signPetition(@PathVariable Long id, Principal principal) {
        User user = requireUser(principal);
        PetitionResponse response = petitionService.signPetition(id, user);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<PetitionResponse> updateStatus(@PathVariable Long id, @RequestBody ReplyRequest request) {
        PetitionResponse response = petitionService.updateStatus(id, request);
        return ResponseEntity.ok(response);
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

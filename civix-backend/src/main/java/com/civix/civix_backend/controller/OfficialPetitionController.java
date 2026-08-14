package com.civix.civix_backend.controller;

import com.civix.civix_backend.dto.PetitionResponse;
import com.civix.civix_backend.dto.OfficialResponseRequest;
import com.civix.civix_backend.dto.OfficialResponseDTO;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.service.PetitionService;
import com.civix.civix_backend.repository.UserRepository;
import com.civix.civix_backend.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/official/petitions")
public class OfficialPetitionController {

    private final PetitionService petitionService;
    private final UserRepository userRepository;

    public OfficialPetitionController(PetitionService petitionService, UserRepository userRepository) {
        this.petitionService = petitionService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<List<PetitionResponse>> getOfficialPetitions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "desc") String sort,
            Principal principal) {

        User official = requireUser(principal);
        String locality = official.getCity();

        // Fetch petitions for official's locality
        List<PetitionResponse> petitions = petitionService.listPetitions(
                locality, category, status, null, official, null, null, null, null
        );

        // Sort by date (createdAt)
        if ("asc".equalsIgnoreCase(sort)) {
            petitions.sort(Comparator.comparing(PetitionResponse::getCreatedAt));
        } else {
            petitions.sort(Comparator.comparing(PetitionResponse::getCreatedAt).reversed());
        }

        return ResponseEntity.ok(petitions);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<PetitionResponse> getOfficialPetitionById(
            @PathVariable Long id,
            Principal principal) {

        User official = requireUser(principal);
        PetitionResponse petition = petitionService.getPetitionForOfficial(id, official);
        return ResponseEntity.ok(petition);
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<PetitionResponse> respondToPetition(
            @PathVariable Long id,
            @Valid @RequestBody OfficialResponseRequest request,
            Principal principal) {

        User official = requireUser(principal);
        PetitionResponse response = petitionService.respondToPetition(id, request, official);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/responses")
    @PreAuthorize("hasAnyRole('OFFICIAL', 'CITIZEN')")
    public ResponseEntity<List<OfficialResponseDTO>> getOfficialResponses(
            @PathVariable Long id,
            Principal principal) {

        requireUser(principal);
        List<OfficialResponseDTO> responses = petitionService.getOfficialResponses(id);
        return ResponseEntity.ok(responses);
    }

    private User requireUser(Principal principal) {
        if (principal == null) {
            throw new InsufficientAuthenticationException("Authentication required");
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }
}

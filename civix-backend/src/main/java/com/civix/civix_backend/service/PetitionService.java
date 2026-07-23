package com.civix.civix_backend.service;

import com.civix.civix_backend.dto.PetitionRequest;
import com.civix.civix_backend.dto.PetitionResponse;
import com.civix.civix_backend.dto.ReplyRequest;
import com.civix.civix_backend.entity.Petition;
import com.civix.civix_backend.entity.Role;
import com.civix.civix_backend.entity.Signature;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.exception.ConflictException;
import com.civix.civix_backend.exception.ForbiddenActionException;
import com.civix.civix_backend.exception.ResourceNotFoundException;
import com.civix.civix_backend.repository.PetitionRepository;
import com.civix.civix_backend.repository.SignatureRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PetitionService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String STATUS_CLOSED = "CLOSED";
    private static final int DEFAULT_SIGNATURE_GOAL = 100;

    private final PetitionRepository petitionRepository;
    private final SignatureRepository signatureRepository;

    public PetitionService(PetitionRepository petitionRepository,
                            SignatureRepository signatureRepository) {
        this.petitionRepository = petitionRepository;
        this.signatureRepository = signatureRepository;
    }

    // ========================
    // Listing / filtering
    // ========================

    public List<PetitionResponse> listPetitions(String location, String category, String status,
                                                 Long creatorId, User currentUser) {
        String normalizedLocation = blankToNull(location);
        String normalizedCategory = blankToNull(category);
        String normalizedStatus = blankToNull(status);

        List<Petition> petitions = petitionRepository.search(
                normalizedLocation, normalizedCategory, normalizedStatus, creatorId);

        return petitions.stream()
                .map(p -> toResponse(p, currentUser))
                .collect(Collectors.toList());
    }

    public long countActive(Long userId) {
        if (userId != null) {
            return petitionRepository.countByStatusAndCreatorId(STATUS_ACTIVE, userId)
                 + petitionRepository.countByStatusAndCreatorId(STATUS_UNDER_REVIEW, userId);
        }
        return petitionRepository.countByStatus(STATUS_ACTIVE)
             + petitionRepository.countByStatus(STATUS_UNDER_REVIEW);
    }

    // ========================
    // Create
    // ========================

    public PetitionResponse createPetition(PetitionRequest request, User user) {
        Petition petition = new Petition();
        petition.setCreator(user);
        petition.setTitle(request.getTitle().trim());
        petition.setDescription(request.getDescription().trim());
        petition.setCategory(request.getCategory().trim());
        petition.setLocation(request.getLocation().trim());
        petition.setSignatureGoal(request.getTargetSignatures() > 0
                ? request.getTargetSignatures() : DEFAULT_SIGNATURE_GOAL);
        petition.setStatus(STATUS_ACTIVE);

        Petition saved = petitionRepository.save(petition);
        return toResponse(saved, user);
    }

    // ========================
    // Edit
    // ========================

    public PetitionResponse updatePetition(Long id, PetitionRequest request, User user) {
        Petition petition = getPetitionOrThrow(id);

        boolean isOwner = petition.getCreator().getId().equals(user.getId());
        boolean isOfficial = user.getRole() == Role.OFFICIAL;
        if (!isOwner && !isOfficial) {
            throw new ForbiddenActionException("You can only edit petitions you created.");
        }

        if (STATUS_CLOSED.equalsIgnoreCase(petition.getStatus())) {
            throw new ConflictException("Closed petitions can no longer be edited.");
        }

        petition.setTitle(request.getTitle().trim());
        petition.setDescription(request.getDescription().trim());
        petition.setCategory(request.getCategory().trim());
        petition.setLocation(request.getLocation().trim());
        if (request.getTargetSignatures() > 0) {
            petition.setSignatureGoal(request.getTargetSignatures());
        }

        Petition saved = petitionRepository.save(petition);
        return toResponse(saved, user);
    }

    // ========================
    // Sign
    // ========================

    public PetitionResponse signPetition(Long id, User user) {
        Petition petition = getPetitionOrThrow(id);

        if (STATUS_CLOSED.equalsIgnoreCase(petition.getStatus())) {
            throw new ConflictException("This petition is closed and no longer accepting signatures.");
        }

        boolean alreadySigned = signatureRepository.existsByPetitionIdAndUserId(petition.getId(), user.getId());
        if (alreadySigned) {
            throw new ConflictException("You have already signed this petition.");
        }

        Signature signature = new Signature();
        signature.setPetition(petition);
        signature.setUser(user);
        signatureRepository.save(signature);

        return toResponse(petition, user);
    }

    // ========================
    // Official status update
    // ========================

    public PetitionResponse updateStatus(Long id, ReplyRequest request) {
        Petition petition = getPetitionOrThrow(id);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            petition.setStatus(request.getStatus().trim().toUpperCase());
        }
        if (request.getReply() != null) {
            petition.setOfficialResponse(request.getReply());
        }

        Petition saved = petitionRepository.save(petition);
        return toResponse(saved, null);
    }

    // ========================
    // Helpers
    // ========================

    private Petition getPetitionOrThrow(Long id) {
        return petitionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Petition not found with id " + id));
    }

    private String blankToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value.trim();
    }

    private PetitionResponse toResponse(Petition p, User currentUser) {
        PetitionResponse resp = new PetitionResponse();
        resp.setId(p.getId());
        resp.setCreatorId(p.getCreator().getId());
        resp.setCreatorName(p.getCreator().getName());
        resp.setTitle(p.getTitle());
        resp.setDescription(p.getDescription());
        resp.setCategory(p.getCategory());
        resp.setLocation(p.getLocation());
        resp.setTargetSignatures(p.getSignatureGoal());
        resp.setStatus(p.getStatus());
        resp.setOfficialResponse(p.getOfficialResponse());
        resp.setCreatedAt(p.getCreatedAt());

        long sigCount = signatureRepository.countByPetitionId(p.getId());
        resp.setCurrentSignatures(sigCount);

        if (currentUser != null) {
            boolean signed = signatureRepository.existsByPetitionIdAndUserId(p.getId(), currentUser.getId());
            resp.setSignedByMe(signed);
        }

        return resp;
    }
}

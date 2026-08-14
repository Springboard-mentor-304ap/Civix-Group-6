package com.civix.civix_backend.service;

import com.civix.civix_backend.dto.PetitionRequest;
import com.civix.civix_backend.dto.PetitionResponse;
import com.civix.civix_backend.dto.PetitionTimelineResponse;
import com.civix.civix_backend.dto.ReplyRequest;
import com.civix.civix_backend.dto.OfficialResponseRequest;
import com.civix.civix_backend.dto.OfficialResponseDTO;
import com.civix.civix_backend.entity.Petition;
import com.civix.civix_backend.entity.PetitionStatusHistory;
import com.civix.civix_backend.entity.Role;
import com.civix.civix_backend.entity.Signature;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.exception.ConflictException;
import com.civix.civix_backend.exception.ForbiddenActionException;
import com.civix.civix_backend.exception.ResourceNotFoundException;
import com.civix.civix_backend.repository.PetitionRepository;
import com.civix.civix_backend.repository.PetitionStatusHistoryRepository;
import com.civix.civix_backend.repository.SignatureRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
    private final PetitionStatusHistoryRepository petitionStatusHistoryRepository;

    public PetitionService(PetitionRepository petitionRepository,
                            SignatureRepository signatureRepository,
                            PetitionStatusHistoryRepository petitionStatusHistoryRepository) {
        this.petitionRepository = petitionRepository;
        this.signatureRepository = signatureRepository;
        this.petitionStatusHistoryRepository = petitionStatusHistoryRepository;
    }

    // ========================
    // Listing / filtering
    // ========================

    public List<PetitionResponse> listPetitions(String location, String category, String status,
                                                 Long creatorId, User currentUser,
                                                 String priority, LocalDateTime startDate,
                                                 LocalDateTime endDate, String search) {
        String normalizedLocation = blankToNull(location);
        String normalizedCategory = blankToNull(category);
        String normalizedStatus = blankToNull(status);
        String normalizedPriority = blankToNull(priority);
        String normalizedSearch = blankToNull(search);

        Long searchId = null;
        if (normalizedSearch != null) {
            try {
                searchId = Long.parseLong(normalizedSearch);
            } catch (NumberFormatException e) {
                // not an ID
            }
        }

        List<Petition> petitions = petitionRepository.search(
                normalizedLocation, normalizedCategory, normalizedStatus, creatorId,
                normalizedPriority, startDate, endDate, normalizedSearch, searchId);

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

        // Initial timeline entry: SUBMITTED
        PetitionStatusHistory history = new PetitionStatusHistory();
        history.setPetition(saved);
        history.setStatus("SUBMITTED");
        history.setUpdatedAt(saved.getCreatedAt());
        petitionStatusHistoryRepository.save(history);

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
    // Delete
    // ========================

    @org.springframework.transaction.annotation.Transactional
    public void deletePetition(Long id, User user) {
        Petition petition = getPetitionOrThrow(id);

        boolean isOwner = petition.getCreator().getId().equals(user.getId());
        boolean isOfficial = user.getRole() == Role.OFFICIAL;
        if (!isOwner && !isOfficial) {
            throw new ForbiddenActionException("You can only delete petitions you created.");
        }

        signatureRepository.deleteByPetitionId(petition.getId());
        petitionRepository.delete(petition);
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

    public PetitionResponse updateStatus(Long id, ReplyRequest request, User official) {
        Petition petition = getPetitionOrThrow(id);

        String oldStatus = petition.getStatus();
        String newStatus = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus().trim().toUpperCase() : null;

        if (newStatus != null) {
            petition.setStatus(newStatus);
        }
        if (request.getReply() != null) {
            petition.setOfficialResponse(request.getReply());
        }
        if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            petition.setAssignedDepartment(request.getDepartment().trim());
        }
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            petition.setPriority(request.getPriority().trim().toUpperCase());
        }
        if (request.getInternalNotes() != null) {
            petition.setInternalNotes(request.getInternalNotes().trim());
        }

        if (official != null) {
            petition.setReviewedBy(official);
            petition.setReviewedAt(LocalDateTime.now());
        }

        Petition saved = petitionRepository.save(petition);

        // Record history tracking when status changes or a new official response is provided
        boolean statusChanged = newStatus != null && !newStatus.equalsIgnoreCase(oldStatus);
        boolean responseProvided = request.getReply() != null && !request.getReply().trim().isEmpty();

        if (statusChanged || responseProvided) {
            PetitionStatusHistory history = new PetitionStatusHistory();
            history.setPetition(saved);
            history.setStatus(saved.getStatus());
            history.setOfficial(official);
            if (official != null) {
                history.setOfficialName(official.getName());
            }
            history.setResponse(saved.getOfficialResponse());
            history.setUpdatedAt(saved.getReviewedAt() != null ? saved.getReviewedAt() : LocalDateTime.now());
            petitionStatusHistoryRepository.save(history);
        }

        return toResponse(saved, official);
    }

    public List<PetitionTimelineResponse> getTimeline(Long petitionId) {
        List<PetitionStatusHistory> historyList =
                petitionStatusHistoryRepository.findByPetitionIdOrderByUpdatedAtAsc(petitionId);

        return historyList.stream().map(h -> new PetitionTimelineResponse(
                h.getStatus(),
                h.getUpdatedAt(),
                h.getOfficialName(),
                h.getResponse()
        )).collect(Collectors.toList());
    }

    public PetitionResponse getPetitionForOfficial(Long id, User official) {
        Petition petition = getPetitionOrThrow(id);
        String locality = official.getCity();
        if (locality == null || petition.getLocation() == null ||
                !petition.getLocation().toLowerCase().contains(locality.toLowerCase())) {
            throw new ForbiddenActionException("You can only view petitions in your assigned locality.");
        }
        return toResponse(petition, official);
    }

    @org.springframework.transaction.annotation.Transactional
    public PetitionResponse respondToPetition(Long id, OfficialResponseRequest request, User official) {
        Petition petition = getPetitionOrThrow(id);

        String locality = official.getCity();
        if (locality == null || petition.getLocation() == null ||
                !petition.getLocation().toLowerCase().contains(locality.toLowerCase())) {
            throw new ForbiddenActionException("You can only respond to petitions in your assigned locality.");
        }

        String statusStr = request.getStatus().trim().toUpperCase();
        if (!List.of("PENDING", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED").contains(statusStr)) {
            throw new IllegalArgumentException("Invalid status: " + statusStr);
        }

        petition.setStatus(statusStr);
        petition.setOfficialResponse(request.getComment());
        petition.setReviewedBy(official);
        petition.setReviewedAt(LocalDateTime.now());

        Petition saved = petitionRepository.save(petition);

        // Record history tracking when official responds
        PetitionStatusHistory history = new PetitionStatusHistory();
        history.setPetition(saved);
        history.setStatus(statusStr);
        history.setOfficial(official);
        history.setOfficialName(official.getName());
        history.setResponse(request.getComment());
        history.setUpdatedAt(LocalDateTime.now());
        petitionStatusHistoryRepository.save(history);

        return toResponse(saved, official);
    }

    public List<OfficialResponseDTO> getOfficialResponses(Long petitionId) {
        getPetitionOrThrow(petitionId);

        List<PetitionStatusHistory> historyList =
                petitionStatusHistoryRepository.findByPetitionIdOrderByUpdatedAtAsc(petitionId);

        return historyList.stream()
                .filter(h -> h.getOfficial() != null || (h.getOfficialName() != null && !h.getStatus().equalsIgnoreCase("SUBMITTED")))
                .map(h -> new OfficialResponseDTO(
                        h.getPetition().getId(),
                        h.getResponse(),
                        h.getStatus(),
                        h.getOfficial() != null ? h.getOfficial().getId() : null,
                        h.getOfficialName(),
                        h.getUpdatedAt()
                )).collect(Collectors.toList());
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
        resp.setAssignedDepartment(p.getAssignedDepartment());
        resp.setPriority(p.getPriority() != null ? p.getPriority() : "MEDIUM");
        resp.setInternalNotes(p.getInternalNotes());
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

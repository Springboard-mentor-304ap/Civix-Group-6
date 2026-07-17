package com.civix.civix_backend.controller;

import com.civix.civix_backend.dto.QueryRequest;
import com.civix.civix_backend.dto.QueryResponse;
import com.civix.civix_backend.dto.ReplyRequest;
import com.civix.civix_backend.entity.CitizenQuery;
import com.civix.civix_backend.entity.Role;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.repository.QueryRepository;
import com.civix.civix_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/queries")
public class QueryController {

    private final QueryRepository queryRepository;
    private final UserRepository userRepository;

    public QueryController(QueryRepository queryRepository,
                           UserRepository userRepository) {
        this.queryRepository = queryRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<QueryResponse>> getQueries(
            @RequestParam(required = false) Long citizenId,
            @RequestParam(required = false) Long officialId,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<CitizenQuery> queries;
        if (citizenId != null) {
            queries = queryRepository.findByCitizenId(citizenId);
        } else if (officialId != null) {
            queries = queryRepository.findByOfficialId(officialId);
        } else {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
            if (user.getRole() == Role.CITIZEN) {
                queries = queryRepository.findByCitizenId(user.getId());
            } else {
                queries = queryRepository.findByOfficialId(user.getId());
            }
        }

        List<QueryResponse> responses = queries.stream().map(q -> {
            QueryResponse resp = new QueryResponse();
            resp.setId(q.getId());
            resp.setCitizenId(q.getCitizen().getId());
            resp.setCitizenName(q.getCitizen().getName());
            resp.setCitizenEmail(q.getCitizen().getEmail());
            resp.setOfficialId(q.getOfficial().getId());
            resp.setOfficialName(q.getOfficial().getName());
            resp.setMessage(q.getMessage());
            resp.setReply(q.getReply());
            resp.setStatus(q.getStatus());
            resp.setPriority(q.getPriority());
            resp.setSubmittedAt(q.getCreatedAt());
            return resp;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/count/responses")
    public ResponseEntity<Long> countResponses(@RequestParam Long citizenId) {
        return ResponseEntity.ok(queryRepository.countByCitizenIdAndStatus(citizenId, "RESOLVED"));
    }

    @PostMapping
    public ResponseEntity<QueryResponse> createQuery(@RequestBody QueryRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User citizen = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        User official = userRepository.findById(request.getOfficialId())
                .orElseThrow(() -> new RuntimeException("Official representative not found"));

        if (official.getRole() != Role.OFFICIAL) {
            return ResponseEntity.badRequest().build();
        }

        CitizenQuery query = new CitizenQuery();
        query.setCitizen(citizen);
        query.setOfficial(official);
        query.setMessage(request.getMessage());
        query.setPriority(request.getPriority() != null ? request.getPriority().toUpperCase() : "NORMAL");
        query.setStatus("PENDING");

        CitizenQuery saved = queryRepository.save(query);

        QueryResponse resp = new QueryResponse();
        resp.setId(saved.getId());
        resp.setCitizenId(saved.getCitizen().getId());
        resp.setCitizenName(saved.getCitizen().getName());
        resp.setCitizenEmail(saved.getCitizen().getEmail());
        resp.setOfficialId(saved.getOfficial().getId());
        resp.setOfficialName(saved.getOfficial().getName());
        resp.setMessage(saved.getMessage());
        resp.setStatus(saved.getStatus());
        resp.setPriority(saved.getPriority());
        resp.setSubmittedAt(saved.getCreatedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PatchMapping("/{id}/reply")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<QueryResponse> replyToQuery(@PathVariable Long id, @RequestBody ReplyRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User official = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        CitizenQuery query = queryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Query not found"));

        // Confirm query is addressed to this official
        if (!query.getOfficial().getId().equals(official.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (request.getReply() != null) {
            query.setReply(request.getReply());
        }
        if (request.getStatus() != null) {
            query.setStatus(request.getStatus());
        } else {
            query.setStatus("RESOLVED"); // default resolution on reply
        }

        CitizenQuery saved = queryRepository.save(query);

        QueryResponse resp = new QueryResponse();
        resp.setId(saved.getId());
        resp.setCitizenId(saved.getCitizen().getId());
        resp.setCitizenName(saved.getCitizen().getName());
        resp.setCitizenEmail(saved.getCitizen().getEmail());
        resp.setOfficialId(saved.getOfficial().getId());
        resp.setOfficialName(saved.getOfficial().getName());
        resp.setMessage(saved.getMessage());
        resp.setReply(saved.getReply());
        resp.setStatus(saved.getStatus());
        resp.setPriority(saved.getPriority());
        resp.setSubmittedAt(saved.getCreatedAt());

        return ResponseEntity.ok(resp);
    }
}

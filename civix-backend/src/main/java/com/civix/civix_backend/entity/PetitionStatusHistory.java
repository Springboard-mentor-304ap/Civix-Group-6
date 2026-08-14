package com.civix.civix_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "petition_status_history")
public class PetitionStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "petition_id", nullable = false)
    private Petition petition;

    @Column(nullable = false, length = 50)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "official_id")
    private User official;

    @Column(name = "official_name", length = 100)
    private String officialName;

    @Column(columnDefinition = "TEXT")
    private String response;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PetitionStatusHistory() {
    }

    @PrePersist
    public void prePersist() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    // ========================
    // Getters & Setters
    // ========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Petition getPetition() {
        return petition;
    }

    public void setPetition(Petition petition) {
        this.petition = petition;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public User getOfficial() {
        return official;
    }

    public void setOfficial(User official) {
        this.official = official;
    }

    public String getOfficialName() {
        return officialName;
    }

    public void setOfficialName(String officialName) {
        this.officialName = officialName;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

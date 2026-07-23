package com.civix.civix_backend.dto;

import java.time.LocalDateTime;

public class PetitionResponse {
    private Long id;
    private Long creatorId;
    private String creatorName;
    private String title;
    private String description;
    private String category;
    private String location;
    private int targetSignatures;
    private long currentSignatures;
    private String status;
    private String officialResponse;
    private LocalDateTime createdAt;

    public PetitionResponse() {
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

    public Long getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getTargetSignatures() {
        return targetSignatures;
    }

    public void setTargetSignatures(int targetSignatures) {
        this.targetSignatures = targetSignatures;
    }

    public long getCurrentSignatures() {
        return currentSignatures;
    }

    public void setCurrentSignatures(long currentSignatures) {
        this.currentSignatures = currentSignatures;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOfficialResponse() {
        return officialResponse;
    }

    public void setOfficialResponse(String officialResponse) {
        this.officialResponse = officialResponse;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    private boolean signedByMe;

    public boolean isSignedByMe() {
        return signedByMe;
    }

    public void setSignedByMe(boolean signedByMe) {
        this.signedByMe = signedByMe;
    }
}

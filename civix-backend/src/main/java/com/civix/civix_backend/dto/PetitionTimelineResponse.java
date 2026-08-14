package com.civix.civix_backend.dto;

import java.time.LocalDateTime;

public class PetitionTimelineResponse {
    private String status;
    private LocalDateTime updatedAt;
    private String officialName;
    private String response;

    public PetitionTimelineResponse() {
    }

    public PetitionTimelineResponse(String status, LocalDateTime updatedAt, String officialName, String response) {
        this.status = status;
        this.updatedAt = updatedAt;
        this.officialName = officialName;
        this.response = response;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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
}

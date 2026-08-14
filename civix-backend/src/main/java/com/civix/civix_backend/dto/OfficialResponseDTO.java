package com.civix.civix_backend.dto;

import java.time.LocalDateTime;

public class OfficialResponseDTO {
    private Long petitionId;
    private String comment;
    private String status;
    private Long officialId;
    private String officialName;
    private LocalDateTime timestamp;

    public OfficialResponseDTO() {}

    public OfficialResponseDTO(Long petitionId, String comment, String status, Long officialId, String officialName, LocalDateTime timestamp) {
        this.petitionId = petitionId;
        this.comment = comment;
        this.status = status;
        this.officialId = officialId;
        this.officialName = officialName;
        this.timestamp = timestamp;
    }

    public Long getPetitionId() {
        return petitionId;
    }

    public void setPetitionId(Long petitionId) {
        this.petitionId = petitionId;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getOfficialId() {
        return officialId;
    }

    public void setOfficialId(Long officialId) {
        this.officialId = officialId;
    }

    public String getOfficialName() {
        return officialName;
    }

    public void setOfficialName(String officialName) {
        this.officialName = officialName;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

package com.civix.civix_backend.dto;

import jakarta.validation.constraints.NotBlank;

public class OfficialResponseRequest {
    @NotBlank(message = "Comment cannot be blank")
    private String comment;

    @NotBlank(message = "Status cannot be blank")
    private String status;

    public OfficialResponseRequest() {}

    public OfficialResponseRequest(String comment, String status) {
        this.comment = comment;
        this.status = status;
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
}

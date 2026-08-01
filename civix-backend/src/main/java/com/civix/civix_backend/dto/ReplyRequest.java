package com.civix.civix_backend.dto;

public class ReplyRequest {
    private String reply;
    private String status;

    public ReplyRequest() {
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

package com.civix.civix_backend.dto;

public class ReplyRequest {
    private String reply;
    private String response;
    private String status;
    private String department;
    private String priority;
    private String internalNotes;

    public ReplyRequest() {
    }

    public String getReply() {
        return (reply != null && !reply.isEmpty()) ? reply : response;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getInternalNotes() {
        return internalNotes;
    }

    public void setInternalNotes(String internalNotes) {
        this.internalNotes = internalNotes;
    }
}

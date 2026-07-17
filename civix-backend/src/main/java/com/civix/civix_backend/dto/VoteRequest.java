package com.civix.civix_backend.dto;

public class VoteRequest {
    private String selectedOption;

    public VoteRequest() {
    }

    public String getSelectedOption() {
        return selectedOption;
    }

    public void setSelectedOption(String selectedOption) {
        this.selectedOption = selectedOption;
    }
}

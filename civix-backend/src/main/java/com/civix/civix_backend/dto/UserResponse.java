package com.civix.civix_backend.dto;

import com.civix.civix_backend.entity.Role;

public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private boolean verified;

    public UserResponse() {
    }

    public UserResponse(Long id, String name, String email, Role role, boolean verified) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.verified = verified;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public boolean isVerified() {
        return verified;
    }
}
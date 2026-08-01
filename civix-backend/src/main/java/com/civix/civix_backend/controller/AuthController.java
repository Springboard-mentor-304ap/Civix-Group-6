package com.civix.civix_backend.controller;

import com.civix.civix_backend.dto.AuthResponse;
import com.civix.civix_backend.dto.LoginRequest;
import com.civix.civix_backend.dto.RegisterRequest;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public ResponseEntity<User> me(Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        System.out.println("GET /api/auth/me - Response class: User, Email: " + (user != null ? user.getEmail() : "null"));
        return ResponseEntity.ok(user);
    }
}
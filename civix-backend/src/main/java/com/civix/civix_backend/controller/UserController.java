package com.civix.civix_backend.controller;

import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.repository.UserRepository;
import com.civix.civix_backend.entity.Role;
import com.civix.civix_backend.dto.ProfileUpdateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> getUsersByRole(@RequestParam(required = false) Role role) {
        if (role != null) {
            return ResponseEntity.ok(userRepository.findByRole(role));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody ProfileUpdateRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(request.getName());
        user.setCity(request.getCity());
        user.setState(request.getState());
        user.setLocation(request.getLocation());

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<String> verifyUser(@PathVariable Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);

        userRepository.save(user);

        return ResponseEntity.ok("User verified successfully");
    }
}
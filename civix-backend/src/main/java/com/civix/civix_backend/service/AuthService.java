package com.civix.civix_backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.civix.civix_backend.dto.AuthResponse;
import com.civix.civix_backend.dto.LoginRequest;
import com.civix.civix_backend.dto.RegisterRequest;
import com.civix.civix_backend.entity.User;
import com.civix.civix_backend.repository.UserRepository;
import com.civix.civix_backend.security.JwtService;

import org.springframework.security.authentication.BadCredentialsException;
import java.math.BigDecimal;
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    public AuthService(UserRepository userRepository,
                   PasswordEncoder passwordEncoder,
                   JwtService jwtService) {

    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
}
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Validate Coordinates
        if (request.getLatitude() != null && (request.getLatitude().compareTo(new BigDecimal("-90.0")) < 0 || request.getLatitude().compareTo(new BigDecimal("90.0")) > 0)) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (request.getLongitude() != null && (request.getLongitude().compareTo(new BigDecimal("-180.0")) < 0 || request.getLongitude().compareTo(new BigDecimal("180.0")) > 0)) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setState(request.getState());
        user.setCity(request.getCity());
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }
}
package com.civix.civix_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Simple endpoint to confirm the server booted and is reachable.
 * Hit http://localhost:8080/api/health after starting the app.
 */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "UP",
                "service", "civix-backend"
        );
    }
}

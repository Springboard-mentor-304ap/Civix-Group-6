package com.civix.civix_backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.Principal;

public class SecurityUtils {

    private SecurityUtils() {
    }

    public static String getEmailFromPrincipal(Principal principal) {
        if (principal == null) {
            return null;
        }
        if (principal instanceof Authentication auth) {
            Object p = auth.getPrincipal();
            if (p instanceof UserDetails ud) {
                return ud.getUsername();
            }
            return auth.getName();
        }
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }
        return principal.getName();
    }
}

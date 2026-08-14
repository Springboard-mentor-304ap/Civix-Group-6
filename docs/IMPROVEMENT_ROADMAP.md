# CIVIX PLATFORM - TECHNICAL IMPROVEMENT ROADMAP

---

## 1. CRITICAL PRIORITIES (Immediate Action Required)

### 1. Externalize Application Credentials & JWT Secrets
* **Target:** `civix-backend/src/main/resources/application.yml`
* **Task:** Replace hardcoded database passwords and JWT secrets with environment variables (`${DB_PASSWORD}`, `${JWT_SECRET}`).
* **Value:** Prevents security leaks when pushing code to public/team repositories.

### 2. Sanitize `/api/auth/me` Response Payload
* **Target:** `AuthController.java`
* **Task:** Return `UserResponse` DTO instead of raw `User` domain model to hide BCrypt password hashes.
* **Value:** Eliminates high-severity credential hash disclosure risk.

---

## 2. HIGH PRIORITIES (Near-Term Improvements)

### 1. Resolve Poll Results N+1 Query Bottleneck
* **Target:** `PollController.java` & `VoteRepository.java`
* **Task:** Replace iterative `countByPollIdAndSelectedOption` calls with JPQL `GROUP BY` aggregation query.
* **Value:** Reduces database query latency from O(N*M) to O(1) per poll.

### 2. Implement Server-Side Pagination & Search Indexing
* **Target:** `PetitionService.java` & `PetitionController.java`
* **Task:** Introduce `Pageable` parameters to `/api/petitions` and `/api/queries`. Add full-text search capability.
* **Value:** Ensures consistent response times and low RAM usage as database grows.

### 3. Implement JWT Refresh Token Mechanism
* **Target:** `JwtService.java` & `AuthService.java`
* **Task:** Shorten access token lifetime (e.g. 15 minutes) and issue HTTP-only secure cookie refresh tokens.
* **Value:** Improves platform security posture against stolen access tokens.

---

## 3. MEDIUM PRIORITIES (Enhancements & Features)

### 1. Interactive Geolocation Map Component
* **Target:** `civix-frontend/src/app/pages/register/` & `petitions/`
* **Task:** Integrate OpenStreetMap / Leaflet map widget for visually dropping pins to capture coordinates.
* **Value:** Enhances citizen UX during registration and petition creation.

### 2. Official Audit Logging System
* **Target:** `civix-backend/src/main/java/com/civix/civix_backend/entity/AdminLog.java`
* **Task:** Create JPA Entity for `admin_logs` table and record official actions (status changes, poll closures).
* **Value:** Provides complete compliance and moderation audit trail.

### 3. Real-Time Notification System (WebSockets / SSE)
* **Target:** Backend & Frontend messaging
* **Task:** Add Spring WebSocket / Server-Sent Events to notify citizens when an official replies to their query or updates a petition.
* **Value:** Significantly increases user engagement and instant feedback.

---

## 4. LOW PRIORITIES (Technical Debt & Refactoring)

### 1. Dynamic CORS Environment Configuration
* **Target:** `SecurityConfig.java`
* **Task:** Load allowed origins from environment configuration rather than hardcoding `http://localhost:4200`.
* **Value:** Simplifies multi-environment staging/production deployment.

### 2. Automated Test Coverage Expansion
* **Target:** `civix-backend/src/test/` & `civix-frontend/`
* **Task:** Write Integration tests using `@SpringBootTest`, `MockMvc`, and Vitest component specs.
* **Value:** Prevents regressions during future refactoring.

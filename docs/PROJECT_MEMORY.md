# PROJECT MEMORY - CIVIX PLATFORM

## 1. Overall Architecture
Civix is a modern digital civic engagement and petition platform designed with a decoupled full-stack architecture:
* **Frontend:** Angular 21 Single Page Application (SPA) using standalone components, Angular Router, template-driven & reactive forms, RxJS, and vanilla CSS.
* **Backend:** Java 17 & Spring Boot 3.3.4 RESTful web service.
* **Security Layer:** Stateless JWT (JSON Web Token) authentication using `io.jsonwebtoken` (jjwt `0.12.6`) and Spring Security with BCrypt password hashing.
* **Database & Persistence:** MySQL 8 database, Spring Data JPA / Hibernate ORM, and Flyway versioned SQL migrations (`V1`, `V2`, `V3`).
* **Documentation & Tools:** OpenAPI 3 / Swagger (`/swagger-ui.html`), Lombok, Vitest, JSDOM.

---

## 2. Folder Responsibilities

### Backend (`civix-backend/`)
* `src/main/java/com/civix/civix_backend/config/`: Security configuration (`SecurityConfig.java`) defining CORS policies, PasswordEncoder beans, and stateless SecurityFilterChain rules.
* `src/main/java/com/civix/civix_backend/controller/`: REST API controllers (`AuthController`, `PetitionController`, `PollController`, `QueryController`, `UserController`, `HealthController`).
* `src/main/java/com/civix/civix_backend/dto/`: Request and Response Data Transfer Objects preventing domain model exposure and handling validation.
* `src/main/java/com/civix/civix_backend/entity/`: JPA entities (`User`, `Petition`, `Signature`, `Poll`, `Vote`, `CitizenQuery`, `Role`).
* `src/main/java/com/civix/civix_backend/exception/`: Custom exception types and `@RestControllerAdvice` global exception handling mapping errors to standard HTTP status codes.
* `src/main/java/com/civix/civix_backend/repository/`: Spring Data JPA interfaces (`UserRepository`, `PetitionRepository`, `SignatureRepository`, `PollRepository`, `VoteRepository`, `QueryRepository`).
* `src/main/java/com/civix/civix_backend/security/`: JWT token provider (`JwtService`) and Spring Security filter (`JwtAuthFilter`).
* `src/main/java/com/civix/civix_backend/service/`: Business logic services (`AuthService`, `PetitionService`, `CustomUserDetailsService`).
* `src/main/resources/application.yml`: Configuration file for DB credentials, Flyway, Hibernate, and JWT secrets.
* `src/main/resources/db/migration/`: Flyway migration SQL scripts (`V1__init_schema.sql`, `V2__add_geolocation.sql`, `V3__extend_petition_status_and_queries.sql`).

### Frontend (`civix-frontend/`)
* `src/app/app.config.ts`: Global application configuration registering Angular router and HTTP interceptors.
* `src/app/app.routes.ts`: Client route declarations with route guards (`authGuard`, `roleGuard`, `guestGuard`).
* `src/app/guards/`: Functional route guards protecting routes based on authentication state and user roles (`CITIZEN` / `OFFICIAL`).
* `src/app/interceptors/`: HTTP Interceptor (`auth.interceptor.ts`) attaching `Authorization: Bearer <token>` to requests.
* `src/app/services/`: Client services (`AuthService`) managing authentication state and client-side storage (`localStorage`).
* `src/app/pages/`: Modular view components:
  * `home/`: Public landing page.
  * `login/` & `register/`: Authentication views with geolocation inputs.
  * `citizen-dashboard/`: Citizen workspace (`home`, `petitions`, `polls`, `officials`, `profile`).
  * `official-dashboard/`: Official workspace (`home`, `petitions`, `polls`, `queries`, `profile`).

---

## 3. Coding Conventions
* **Java / Spring Boot:**
  * Package-by-feature / layer architecture.
  * Constructor injection over field injection for Spring components.
  * Clear separation between JPA Entities and REST DTOs.
  * Enums for standard static values (`Role.CITIZEN`, `Role.OFFICIAL`).
* **Angular / TypeScript:**
  * Standalone Angular components (`standalone: true`).
  * RxJS `BehaviorSubject` pattern for global reactive state.
  * Vanilla CSS scoped per component.

---

## 4. Authentication Flow
1. **User Registration (`POST /api/auth/register`):** Validates email uniqueness, encodes password via BCrypt, validates geographic coordinates (Latitude [-90,90], Longitude [-180,180]), persists user, generates JWT token, returns `AuthResponse`.
2. **User Login (`POST /api/auth/login`):** Authenticates email and BCrypt password hash. Returns JWT token.
3. **Session Persistence:** Client stores `token`, `user_id`, `role`, and `name` in `localStorage`.
4. **Request Interception:** `auth.interceptor.ts` reads token from `localStorage` and appends `Authorization: Bearer <token>` header to all outgoing HTTP calls.
5. **Backend Verification:** `JwtAuthFilter` extracts Bearer token, validates HMAC-SHA256 signature, loads `UserDetails` via `CustomUserDetailsService`, and sets `SecurityContextHolder`.

---

## 5. State Management
* **Backend:** Stateless session management (`SessionCreationPolicy.STATELESS`). Authentication state is derived strictly from incoming signed JWT headers.
* **Frontend:** Reactive state in `AuthService` using RxJS `BehaviorSubject<User | null>`. Initialized from `localStorage` on page refresh.

---

## 6. Backend Architecture
```
[ HTTP Request ] ──▶ [ JwtAuthFilter ] ──▶ [ SecurityConfig ]
                                                  │
                                                  ▼
[ Database (MySQL) ] ◀── [ Repository ] ◀── [ Service ] ◀── [ Controller ]
```

---

## 7. Database Schema Overview
* **`users`**: Core user accounts (`id`, `name`, `email`, `password`, `role`, `location`, `state`, `city`, `latitude`, `longitude`, `verified`, `created_at`).
* **`petitions`**: Petitions created by users (`id`, `creator_id`, `title`, `description`, `category`, `location`, `signature_goal`, `status`, `official_response`, `created_at`).
* **`signatures`**: Junction table tracking signed petitions (`id`, `petition_id`, `user_id`, `timestamp`). Constrained by UNIQUE (`petition_id`, `user_id`).
* **`polls`**: Community polls (`id`, `created_by`, `title`, `description`, `options` [JSON], `target_location`, `status`, `closes_on`, `created_at`).
* **`votes`**: Junction table tracking votes (`id`, `poll_id`, `user_id`, `selected_option`, `timestamp`). Constrained by UNIQUE (`poll_id`, `user_id`).
* **`queries`**: Direct citizen-official messaging (`id`, `citizen_id`, `official_id`, `message`, `reply`, `status`, `priority`, `created_at`).
* **`admin_logs`**: Database log table (currently unmapped in entity layer).

---

## 8. Important Business Rules
* **Role Rights:** Only citizens can sign petitions, vote in polls, and send direct queries. Only officials can create polls, update petition status, publish official petition responses, reply to citizen queries, and verify official accounts.
* **Single Vote & Signature Constraint:** Database unique indexes enforce that a user can sign a petition only once and vote in a poll only once.
* **Petition Lifecycle:** Status transitions: `ACTIVE` -> `UNDER_REVIEW` -> `CLOSED` / `APPROVED` / `REJECTED` / `RESOLVED`. Closed petitions cannot be edited or signed.
* **Geographic Constraints:** Latitude must be between -90 and 90; Longitude between -180 and 180.

---

## 9. API Summary
* **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
* **Users:** `/api/users`, `/api/users/profile`, `/api/users/{id}/verify`
* **Petitions:** `/api/petitions`, `/api/petitions/count/active`, `/api/petitions/{id}`, `/api/petitions/{id}/sign`, `/api/petitions/{id}/status`
* **Polls:** `/api/polls`, `/api/polls/count/participated`, `/api/polls/{id}/vote`, `/api/polls/{id}/close`
* **Queries:** `/api/queries`, `/api/queries/count/responses`, `/api/queries/{id}/reply`
* **System:** `/api/health`

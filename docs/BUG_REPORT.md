# CIVIX PLATFORM - DETAILED BUG REPORT & CODE DEFECTS

---

## 1. BUG SUMMARY MATRIX

| Bug ID | Severity | Affected File | Root Cause | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | **HIGH** | `application.yml` | Hardcoded database password & JWT secret in source code | Security risk of credential exposure |
| **BUG-02** | **HIGH** | `AuthController.java` | Endpoint `/api/auth/me` returns raw `User` entity containing hashed password | Information disclosure of password hash |
| **BUG-03** | **MEDIUM** | `PollController.java` | N+1 database count query inside nested option loop | Performance degradation under load |
| **BUG-04** | **MEDIUM** | `PetitionService.java` | `listPetitions()` executes unpaginated queries | High memory consumption with large datasets |
| **BUG-05** | **LOW** | `V1__init_schema.sql` | `admin_logs` DB table has no JPA entity or backend references | Dead schema footprint in database |
| **BUG-06** | **LOW** | `SecurityConfig.java` | CORS origins hardcoded to `http://localhost:4200` | Deployment restriction on production hosts |

---

## 2. DETAILED BUG DESCRIPTIONS & REMEDIATIONS

### BUG-01: Hardcoded Secrets in Configuration
* **Severity:** **HIGH**
* **File:** `civix-backend/src/main/resources/application.yml` (Lines 11 & 33)
* **Root Cause:** Sensitive database credentials (`password: YashGoel1234`) and JWT secret string (`12345678901234567890...`) are stored in plain text inside source control.
* **Suggested Fix:** Replace hardcoded strings with environment property references:
  ```yaml
  spring:
    datasource:
      password: ${DB_PASSWORD:YashGoel1234}
  jwt:
    secret: ${JWT_SECRET:default_dev_secret_key_minimum_32_bytes_length}
  ```

---

### BUG-02: Password Hash Disclosure on Profile Retrieval
* **Severity:** **HIGH**
* **File:** `civix-backend/src/main/java/com/civix/civix_backend/controller/AuthController.java` (Line 37)
* **Root Cause:** Endpoint `GET /api/auth/me` directly casts `authentication.getPrincipal()` to `User` and returns it as JSON. The `User` domain entity includes the BCrypt hashed password field.
* **Suggested Fix:** Map `User` entity to a sanitized `UserResponse` DTO before returning:
  ```java
  @GetMapping("/me")
  public ResponseEntity<UserResponse> me(Authentication authentication) {
      User user = (User) authentication.getPrincipal();
      UserResponse response = new UserResponse(
          user.getId(), user.getName(), user.getEmail(),
          user.getRole().name(), user.getCity(), user.getState(), user.isVerified()
      );
      return ResponseEntity.ok(response);
  }
  ```

---

### BUG-03: N+1 Database Query in Community Poll Results
* **Severity:** **MEDIUM**
* **File:** `civix-backend/src/main/java/com/civix/civix_backend/controller/PollController.java` (Lines 70 & 194)
* **Root Cause:** When fetching polls in `getPolls()`, the application executes `voteRepository.countByPollIdAndSelectedOption(pollId, option)` in a loop for every option of every poll. For 100 polls with 4 options each, this triggers 400 separate SQL queries.
* **Suggested Fix:** Use a single GROUP BY JPQL aggregation query in `VoteRepository`:
  ```java
  @Query("SELECT v.selectedOption, COUNT(v) FROM Vote v WHERE v.poll.id = :pollId GROUP BY v.selectedOption")
  List<Object[]> countVotesByPollGrouped(@Param("pollId") Long pollId);
  ```

---

### BUG-04: Unpaginated Database Lookups
* **Severity:** **MEDIUM**
* **File:** `civix-backend/src/main/java/com/civix/civix_backend/service/PetitionService.java` (Line 47)
* **Root Cause:** `listPetitions()` loads all petitions matching filters without a `Pageable` offset limit.
* **Suggested Fix:** Introduce `Pageable pageable` parameter to `PetitionRepository` and `PetitionService`.

---

### BUG-05: Unused Database Table (`admin_logs`)
* **Severity:** **LOW**
* **File:** `civix-backend/src/main/resources/db/migration/V1__init_schema.sql` (Line 65)
* **Root Cause:** Schema migration V1 creates `admin_logs` table, but no Java `@Entity` or audit log mechanism uses it.
* **Suggested Fix:** Create an `AdminLog` JPA entity and service to record official moderation actions, or drop the unused table.

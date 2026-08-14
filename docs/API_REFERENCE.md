# CIVIX PLATFORM - API REFERENCE DOCUMENTATION

---

## 1. AUTHENTICATION ENDPOINTS

### `POST /api/auth/register`
* **Description:** Registers a new user (Citizen or Official).
* **Authentication Required:** No
* **Roles Allowed:** Public
* **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123",
    "role": "CITIZEN", // "CITIZEN" or "OFFICIAL"
    "state": "California",
    "city": "San Francisco",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
  ```
* **Response Body (201 Created):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "CITIZEN"
  }
  ```
* **Validation Rules:**
  * Email must be unique.
  * Latitude must be between -90 and 90 (if provided).
  * Longitude must be between -180 and 180 (if provided).
* **Possible Errors:**
  * `400 Bad Request`: Email already exists, invalid coordinates range, or missing required fields.

---

### `POST /api/auth/login`
* **Description:** Authenticates user credentials and returns a signed JWT token.
* **Authentication Required:** No
* **Roles Allowed:** Public
* **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
* **Response Body (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "CITIZEN"
  }
  ```
* **Validation Rules:** Email and password must not be blank (`@NotBlank`).
* **Possible Errors:**
  * `401 Unauthorized`: Invalid email or password.

---

### `GET /api/auth/me`
* **Description:** Returns profile data of currently logged-in user.
* **Authentication Required:** Yes (Bearer Token)
* **Roles Allowed:** `CITIZEN`, `OFFICIAL`
* **Response Body (200 OK):**
  ```json
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "CITIZEN",
    "location": "San Francisco",
    "state": "California",
    "city": "San Francisco",
    "latitude": 37.7749000,
    "longitude": -122.4194000,
    "verified": false,
    "createdAt": "2026-07-20T10:00:00"
  }
  ```

---

## 2. USER MANAGEMENT ENDPOINTS

### `GET /api/users`
* **Description:** Retrieves list of users (optionally filtered by role).
* **Authentication Required:** Yes
* **Roles Allowed:** `CITIZEN`, `OFFICIAL`
* **Query Parameters:** `role` (Optional: `CITIZEN` or `OFFICIAL`)
* **Response Body (200 OK):** Array of user objects.

---

### `PUT /api/users/profile`
* **Description:** Updates current user profile details.
* **Authentication Required:** Yes
* **Roles Allowed:** `CITIZEN`, `OFFICIAL`
* **Request Body:**
  ```json
  {
    "name": "Jane Doe Updated",
    "city": "Oakland",
    "state": "California",
    "location": "Oakland, CA"
  }
  ```
* **Response Body (200 OK):** Updated user object.

---

### `PUT /api/users/{id}/verify`
* **Description:** Verifies an official account.
* **Authentication Required:** Yes
* **Roles Allowed:** `OFFICIAL`
* **Response Body (200 OK):** `"User verified successfully"`

---

## 3. PETITION ENDPOINTS

### `GET /api/petitions`
* **Description:** Searches and returns list of petitions matching filters.
* **Authentication Required:** Yes (Optional identification for `signedByMe` flag)
* **Query Parameters:**
  * `location` (Optional String)
  * `category` (Optional String)
  * `status` (Optional String: `ACTIVE`, `UNDER_REVIEW`, `CLOSED`, `APPROVED`, `REJECTED`, `RESOLVED`)
  * `userId` (Optional Long - Creator ID)
* **Response Body (200 OK):**
  ```json
  [
    {
      "id": 1,
      "creatorId": 1,
      "creatorName": "Jane Doe",
      "title": "Fix Main Street Potholes",
      "description": "The potholes on 4th and Main are causing traffic hazards.",
      "category": "Infrastructure",
      "location": "San Francisco",
      "targetSignatures": 100,
      "currentSignatures": 42,
      "status": "ACTIVE",
      "officialResponse": null,
      "signedByMe": true,
      "createdAt": "2026-07-20T10:00:00"
    }
  ]
  ```

---

### `POST /api/petitions`
* **Description:** Creates a new petition.
* **Authentication Required:** Yes
* **Roles Allowed:** `CITIZEN`, `OFFICIAL`
* **Request Body:**
  ```json
  {
    "title": "Fix Main Street Potholes",
    "description": "Detailed description here...",
    "category": "Infrastructure",
    "location": "San Francisco",
    "targetSignatures": 250
  }
  ```
* **Response Body (201 Created):** Created `PetitionResponse` object.

---

### `PUT /api/petitions/{id}`
* **Description:** Updates an existing petition. Allowed for owner or official moderator.
* **Authentication Required:** Yes
* **Possible Errors:**
  * `403 Forbidden`: User is not creator and not official.
  * `409 Conflict`: Petition status is `CLOSED`.

---

### `POST /api/petitions/{id}/sign`
* **Description:** Signs a petition for the current user.
* **Authentication Required:** Yes
* **Roles Allowed:** `CITIZEN`, `OFFICIAL`
* **Response Body (200 OK):** Updated `PetitionResponse`.
* **Possible Errors:**
  * `409 Conflict`: User has already signed petition or petition is closed.

---

### `PATCH /api/petitions/{id}/status`
* **Description:** Updates petition status and posts official response.
* **Authentication Required:** Yes
* **Roles Allowed:** `OFFICIAL`
* **Request Body:**
  ```json
  {
    "status": "APPROVED",
    "reply": "Public Works department has scheduled repairs for next Monday."
  }
  ```
* **Response Body (200 OK):** Updated `PetitionResponse`.

---

## 4. COMMUNITY POLL ENDPOINTS

### `GET /api/polls`
* **Description:** Fetches all community polls, current voting breakdown, and user vote status.
* **Authentication Required:** Yes

---

### `POST /api/polls`
* **Description:** Creates a community poll.
* **Authentication Required:** Yes
* **Roles Allowed:** `OFFICIAL`
* **Request Body:**
  ```json
  {
    "title": "New Bike Lane Proposal",
    "description": "Should the city add a bike lane on 5th Ave?",
    "options": ["Support", "Oppose", "Need More Info"],
    "targetLocation": "San Francisco",
    "startDate": "2026-07-20",
    "endDate": "2026-07-27"
  }
  ```

---

### `POST /api/polls/{id}/vote`
* **Description:** Casts a vote on a poll option.
* **Authentication Required:** Yes
* **Request Body:**
  ```json
  {
    "selectedOption": "Support"
  }
  ```
* **Possible Errors:**
  * `400 Bad Request`: Poll is closed or user already voted.

---

### `PATCH /api/polls/{id}/close`
* **Description:** Manually closes an active poll.
* **Authentication Required:** Yes
* **Roles Allowed:** `OFFICIAL`

---

## 5. DIRECT QUERY ENDPOINTS

### `GET /api/queries`
* **Description:** Lists queries for citizen (sent) or official (received).

### `POST /api/queries`
* **Description:** Citizen sends a direct query to an official representative.
* **Request Body:**
  ```json
  {
    "officialId": 2,
    "message": "When will the city council vote on park renovation?",
    "priority": "URGENT" // "NORMAL" or "URGENT"
  }
  ```

### `PATCH /api/queries/{id}/reply`
* **Description:** Official replies to citizen inquiry and updates status (`RESOLVED`).
* **Roles Allowed:** `OFFICIAL`
* **Request Body:**
  ```json
  {
    "reply": "The vote is scheduled for August 12th.",
    "status": "RESOLVED"
  }
  ```

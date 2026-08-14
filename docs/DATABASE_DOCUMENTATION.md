# CIVIX PLATFORM - DATABASE DOCUMENTATION

---

## 1. DATABASE DESIGN OVERVIEW
* **RDBMS Engine:** MySQL 8.x (InnoDB Engine, UTF-8 collation).
* **Database Name:** `civic_engagement`
* **Schema Management:** Version-controlled Flyway migrations (`db/migration/V1__init_schema.sql`, `V2__add_geolocation.sql`, `V3__extend_petition_status_and_queries.sql`).

---

## 2. ENTITY RELATIONSHIP (ER) DIAGRAM

```
+-----------------------------------------------------------------------------------+
|                                      USERS                                        |
+-----------------------------------------------------------------------------------+
| PK  id          BIGINT AUTO_INCREMENT                                             |
|     name        VARCHAR(100) NOT NULL                                             |
|     email       VARCHAR(150) NOT NULL UNIQUE                                      |
|     password    VARCHAR(255) NOT NULL                                             |
|     role        VARCHAR(20)  NOT NULL  CHECK(role IN ('CITIZEN', 'OFFICIAL'))     |
|     location    VARCHAR(100) NULL                                                 |
|     state       VARCHAR(100) NULL                                                 |
|     city        VARCHAR(100) NULL                                                 |
|     latitude    DECIMAL(10,7) NULL                                                |
|     longitude   DECIMAL(10,7) NULL                                                |
|     verified    BOOLEAN NOT NULL DEFAULT FALSE                                    |
|     created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP                      |
+-----------------------------------------------------------------------------------+
       |                 |                  |                 |
       | 1:N             | 1:N              | 1:N (Citizen)   | 1:N (Official)
       v                 v                  v                 v
+---------------+  +---------------+  +---------------+ +---------------+
|   PETITIONS   |  |     POLLS     |  |    QUERIES    | |    QUERIES    |
+---------------+  +---------------+  +---------------+ +---------------+
| PK id         |  | PK id         |  | PK id         | | citizen_id FK |
| FK creator_id |  | FK created_by |  | FK citizen_id | | official_idFK |
+---------------+  +---------------+  +---------------+ +---------------+
       |                 |
       | 1:N             | 1:N
       v                 v
+---------------+  +---------------+
|  SIGNATURES   |  |     VOTES     |
+---------------+  +---------------+
| PK id         |  | PK id         |
| FK petition_id|  | FK poll_id    |
| FK user_id    |  | FK user_id    |
+---------------+  +---------------+
```

---

## 3. DETAILED TABLE SCHEMAS

### Table: `users`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique user identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full user name |
| `email` | `VARCHAR(150)` | `NOT NULL, UNIQUE` | Login email address |
| `password` | `VARCHAR(255)` | `NOT NULL` | BCrypt encrypted password hash |
| `role` | `VARCHAR(20)` | `NOT NULL` | Enum: `CITIZEN`, `OFFICIAL` |
| `location` | `VARCHAR(100)` | `NULL` | Free-text address/neighborhood |
| `state` | `VARCHAR(100)` | `NULL` | State/province |
| `city` | `VARCHAR(100)` | `NULL` | City |
| `latitude` | `DECIMAL(10,7)`| `NULL` | Geographic latitude |
| `longitude` | `DECIMAL(10,7)`| `NULL` | Geographic longitude |
| `verified` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Official verification badge |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |

---

### Table: `petitions`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique petition identifier |
| `creator_id` | `BIGINT` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | User who created petition |
| `title` | `VARCHAR(200)` | `NOT NULL` | Petition headline |
| `description` | `TEXT` | `NULL` | Full petition statement |
| `category` | `VARCHAR(100)` | `NULL` | e.g., Infrastructure, Environment |
| `location` | `VARCHAR(100)` | `NULL` | Target city/district |
| `signature_goal`| `INT` | `NOT NULL, DEFAULT 100` | Target signature goal |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | `ACTIVE`, `UNDER_REVIEW`, `CLOSED`, etc. |
| `official_response`| `TEXT` | `NULL` | Published official response statement |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

---

### Table: `signatures`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique signature ID |
| `petition_id` | `BIGINT` | `NOT NULL, FK -> petitions(id) ON DELETE CASCADE` | Signed petition reference |
| `user_id` | `BIGINT` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | Signer user reference |
| `timestamp` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Signing timestamp |

* **Unique Key:** `uq_petition_user` on `(petition_id, user_id)` — Prevents duplicate signatures.

---

### Table: `polls`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique poll ID |
| `title` | `VARCHAR(200)` | `NOT NULL` | Poll title |
| `description` | `TEXT` | `NULL` | Poll details |
| `options` | `JSON` | `NOT NULL` | Array of poll options (e.g. `["Yes", "No"]`) |
| `created_by` | `BIGINT` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | Creator official ID |
| `target_location`| `VARCHAR(100)`| `NULL` | Jurisdiction location filter |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'ACTIVE'` | Status (`ACTIVE` / `CLOSED`) |
| `closes_on` | `TIMESTAMP` | `NULL` | Expiration date |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

---

### Table: `votes`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique vote ID |
| `poll_id` | `BIGINT` | `NOT NULL, FK -> polls(id) ON DELETE CASCADE` | Poll reference |
| `user_id` | `BIGINT` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | Voter user reference |
| `selected_option`| `VARCHAR(100)`| `NOT NULL` | Option string selected by user |
| `timestamp` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Vote timestamp |

* **Unique Key:** `uq_poll_user` on `(poll_id, user_id)` — Enforces single-vote rule per user per poll.

---

### Table: `queries`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique message query ID |
| `citizen_id` | `BIGINT` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | Asking citizen user ID |
| `official_id` | `BIGINT` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | Target official user ID |
| `message` | `TEXT` | `NOT NULL` | Citizen's question text |
| `reply` | `TEXT` | `NULL` | Official's response reply text |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'PENDING'` | `PENDING`, `RESOLVED` |
| `priority` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'NORMAL'` | `NORMAL`, `URGENT` |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

---

## 4. INDEXES & OPTIMIZATION MATRIX
* `idx_users_email` on `users(email)` — Speeds up authentication lookups.
* `idx_petitions_location` on `petitions(location)` — Speeds up location-filtered petition searches.
* `idx_petitions_category` on `petitions(category)` — Speeds up category filtering.
* `idx_petitions_status` on `petitions(status)` — Optimizes filtering active vs closed petitions.
* `idx_polls_target_location` on `polls(target_location)` — Speeds up location polling lookups.

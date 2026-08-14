# CIVIX ANGULAR FRONTEND - COMPONENT MAP

---

## 1. ROOT & AUTHENTICATION COMPONENTS

### `AppComponent` (`src/app/app.ts`)
* **Purpose:** Root application shell displaying global `<router-outlet>`.
* **Parent:** Root bootstrap module.
* **Children:** Rendered page components via Angular Router.
* **Services Used:** None directly.

---

### `HomeComponent` (`src/app/pages/home/home.ts`)
* **Purpose:** Public marketing and landing page introducing platform benefits, petition highlights, and community statistics.
* **Parent:** App Router (`path: ''`).
* **Children:** Static landing sections, call-to-action links to `/login` and `/register`.
* **Services Used:** `AuthService`, `Router`.
* **APIs Called:** None (reads cached state to redirect if user is already logged in).

---

### `LoginComponent` (`src/app/pages/login/login.ts`)
* **Purpose:** Authenticates user credentials for Citizens and Officials.
* **Parent:** App Router (`path: 'login'`).
* **Services Used:** `AuthService`, `Router`.
* **APIs Called:** `POST /api/auth/login`.

---

### `RegisterComponent` (`src/app/pages/register/register.ts`)
* **Purpose:** Registers new Citizen or Official accounts with geolocation inputs (State, City, Latitude, Longitude).
* **Parent:** App Router (`path: 'register'`).
* **Services Used:** `AuthService`, `Router`.
* **APIs Called:** `POST /api/auth/register`.

---

### `DashboardComponent` (`src/app/pages/dashboard/dashboard.ts`)
* **Purpose:** Generic dashboard wrapper acting as fallback route.
* **Parent:** App Router (`path: 'dashboard'`).
* **Services Used:** `AuthService`, `Router`.

---

## 2. CITIZEN DASHBOARD COMPONENTS

### `CitizenDashboardComponent` (`src/app/pages/citizen-dashboard/citizen-dashboard.ts`)
* **Purpose:** Citizen layout container with sidebar navigation (Home, Petitions, Polls, Officials, Profile) and sub `<router-outlet>`.
* **Parent:** App Router (`path: 'citizen-dashboard'`).
* **Guards:** `authGuard`, `roleGuard` (`data: { role: 'CITIZEN' }`).
* **Children:** `CitizenHomeComponent`, `CitizenPetitionsComponent`, `CitizenPollsComponent`, `CitizenOfficialsComponent`, `CitizenProfileComponent`.

---

### `CitizenHomeComponent` (`src/app/pages/citizen-dashboard/home/home.ts`)
* **Purpose:** Overview dashboard displaying summary stats (active petitions count, response count, quick action links).
* **APIs Called:**
  * `GET /api/petitions/count/active`
  * `GET /api/queries/count/responses`
  * `GET /api/polls/count/participated`

---

### `CitizenPetitionsComponent` (`src/app/pages/citizen-dashboard/petitions/petitions.ts`)
* **Purpose:** Enables citizens to browse petitions, apply search filters (location, category, status), create new petitions, and sign active petitions.
* **APIs Called:**
  * `GET /api/petitions`
  * `POST /api/petitions`
  * `POST /api/petitions/{id}/sign`
  * `PUT /api/petitions/{id}`

---

### `CitizenPollsComponent` (`src/app/pages/citizen-dashboard/polls/polls.ts`)
* **Purpose:** Allows citizens to view active community polls, vote on poll options, and view percentage distribution of results.
* **APIs Called:**
  * `GET /api/polls`
  * `POST /api/polls/{id}/vote`

---

### `CitizenOfficialsComponent` (`src/app/pages/citizen-dashboard/officials/officials.ts`)
* **Purpose:** Displays official representative directory and allows citizens to submit direct queries.
* **APIs Called:**
  * `GET /api/users?role=OFFICIAL`
  * `POST /api/queries`
  * `GET /api/queries`

---

### `CitizenProfileComponent` (`src/app/pages/citizen-dashboard/profile/profile.ts`)
* **Purpose:** Citizen profile management, updating location details, viewing signed petitions history.
* **APIs Called:**
  * `GET /api/auth/me`
  * `PUT /api/users/profile`

---

## 3. OFFICIAL DASHBOARD COMPONENTS

### `OfficialDashboardComponent` (`src/app/pages/official-dashboard/official-dashboard.ts`)
* **Purpose:** Official layout container with sidebar navigation (Overview, Petitions, Polls, Queries, Profile).
* **Guards:** `authGuard`, `roleGuard` (`data: { role: 'OFFICIAL' }`).
* **Children:** `OfficialHomeComponent`, `OfficialPetitionsComponent`, `OfficialPollsComponent`, `OfficialQueriesComponent`, `OfficialProfileComponent`.

---

### `OfficialHomeComponent` (`src/app/pages/official-dashboard/home/home.ts`)
* **Purpose:** Metrics dashboard showing total pending petitions requiring official action, open queries, and active polls.
* **APIs Called:**
  * `GET /api/petitions`
  * `GET /api/queries`
  * `GET /api/polls`

---

### `OfficialPetitionsComponent` (`src/app/pages/official-dashboard/petitions/petitions.ts`)
* **Purpose:** Petition moderation view. Officials publish official responses and transition status (`UNDER_REVIEW`, `APPROVED`, `REJECTED`, `RESOLVED`).
* **APIs Called:**
  * `GET /api/petitions`
  * `PATCH /api/petitions/{id}/status`

---

### `OfficialPollsComponent` (`src/app/pages/official-dashboard/polls/polls.ts`)
* **Purpose:** Allows officials to create new community polls (with custom options and date limits) and close active polls.
* **APIs Called:**
  * `GET /api/polls`
  * `POST /api/polls`
  * `PATCH /api/polls/{id}/close`

---

### `OfficialQueriesComponent` (`src/app/pages/official-dashboard/queries/queries.ts`)
* **Purpose:** Manage citizen inquiry inbox, reply to questions, and change query status.
* **APIs Called:**
  * `GET /api/queries`
  * `PATCH /api/queries/{id}/reply`

---

### `OfficialProfileComponent` (`src/app/pages/official-dashboard/profile/profile.ts`)
* **Purpose:** View official account verification badge and update jurisdiction location settings.
* **APIs Called:**
  * `GET /api/auth/me`
  * `PUT /api/users/profile`
  * `PUT /api/users/{id}/verify`

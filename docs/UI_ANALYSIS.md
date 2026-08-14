# CIVIX PLATFORM - FRONTEND UI & UX ANALYSIS DOCUMENT

---

## 1. PAGE-BY-PAGE ANALYSIS

### 1. Landing Page (`/`)
* **Purpose:** Public portal presenting platform capabilities, civic engagement metrics, and entry points for user onboarding.
* **Component:** `HomeComponent` (`pages/home/`)
* **APIs Used:** Reads local authentication state to auto-redirect authenticated users.
* **Navigation Flow:** Click "Get Started" / "Sign In" -> Redirect to `/register` or `/login`.
* **Missing UI Elements:** Missing dynamic real-time stats ticker (currently relies on static counter values).
* **UX Issues:** High content density on small viewports without collapsible accordion sections.

---

### 2. Login Page (`/login`)
* **Purpose:** Form interface for authenticating existing Citizen or Official accounts.
* **Component:** `LoginComponent` (`pages/login/`)
* **APIs Used:** `POST /api/auth/login`
* **Navigation Flow:** Successful login -> Redirect to `/citizen-dashboard` or `/official-dashboard`.
* **Missing UI Elements:** Missing "Show/Hide Password" toggle button; missing "Forgot Password" self-service link.
* **UX Issues:** Validation errors only display upon form submit rather than dynamically on field blur.

---

### 3. Registration Page (`/register`)
* **Purpose:** Multi-role user registration form with location coordinate inputs (State, City, Latitude, Longitude).
* **Component:** `RegisterComponent` (`pages/register/`)
* **APIs Used:** `POST /api/auth/register`
* **Navigation Flow:** Successful register -> Auto-login -> Redirect to respective dashboard.
* **Missing UI Elements:** Interactive map picker widget for selecting latitude/longitude visually.
* **UX Issues:** Latitude and longitude fields require manual numeric entry instead of auto-geolocating via HTML5 Geolocation API.

---

### 4. Citizen Dashboard - Overview (`/citizen-dashboard`)
* **Purpose:** Summary cards showing active petitions count, direct response count, and quick links.
* **Component:** `CitizenHomeComponent` (`pages/citizen-dashboard/home/`)
* **APIs Used:**
  * `GET /api/petitions/count/active`
  * `GET /api/queries/count/responses`
  * `GET /api/polls/count/participated`
* **UX Issues:** Dashboard layout cards do not feature skeleton loading loaders during initial API fetch.

---

### 5. Citizen Dashboard - Petitions (`/citizen-dashboard/petitions`)
* **Purpose:** Primary view for filtering petitions by category, location, and status; creating new petitions; signing existing petitions.
* **Component:** `CitizenPetitionsComponent` (`pages/citizen-dashboard/petitions/`)
* **APIs Used:**
  * `GET /api/petitions`
  * `POST /api/petitions`
  * `POST /api/petitions/{id}/sign`
* **Missing UI Elements:** Pagination control bar (loads all petitions in a single infinite list); search query text box.
* **UX Issues:** After signing a petition, signature progress bar updates inline without micro-animation visual feedback.

---

### 6. Citizen Dashboard - Community Polls (`/citizen-dashboard/polls`)
* **Purpose:** Active community poll voting and live results visualization.
* **Component:** `CitizenPollsComponent` (`pages/citizen-dashboard/polls/`)
* **APIs Used:** `GET /api/polls`, `POST /api/polls/{id}/vote`
* **UX Issues:** Percentage distribution numbers do not animate smoothly when vote is recorded.

---

### 7. Citizen Dashboard - Officials Directory (`/citizen-dashboard/officials`)
* **Purpose:** Roster of local verified officials and direct query form.
* **Component:** `CitizenOfficialsComponent` (`pages/citizen-dashboard/officials/`)
* **APIs Used:** `GET /api/users?role=OFFICIAL`, `POST /api/queries`
* **Missing UI Elements:** Official bio and office hours summary cards.

---

### 8. Official Dashboard - Overview & Moderation (`/official-dashboard/*`)
* **Purpose:** Workspace for officials to review citizen petitions, publish official statements, transition petition statuses, launch community polls, and respond to incoming citizen inquiries.
* **Components:** `OfficialHomeComponent`, `OfficialPetitionsComponent`, `OfficialPollsComponent`, `OfficialQueriesComponent`, `OfficialProfileComponent`.
* **APIs Used:**
  * `PATCH /api/petitions/{id}/status`
  * `POST /api/polls`
  * `PATCH /api/polls/{id}/close`
  * `PATCH /api/queries/{id}/reply`
  * `PUT /api/users/{id}/verify`
* **Missing UI Elements:** Bulk action checkboxes for approving or acknowledging multiple queries simultaneously.
* **UX Issues:** Official reply modal lacks rich text formatting (supports plain text only).

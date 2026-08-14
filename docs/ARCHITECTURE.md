# CIVIX PLATFORM - SYSTEM ARCHITECTURE & DIAGRAMS

---

## 1. SYSTEM ARCHITECTURE

```mermaid
flowchart TB
    subgraph Client ["Frontend Layer (Angular 21)"]
        UI["Angular Standalone Components"]
        Router["Angular Router & Route Guards"]
        Store["AuthService & LocalStorage"]
        Interceptor["HttpClient AuthInterceptor"]
    end

    subgraph Security ["Security & Auth Layer"]
        JwtFilter["JwtAuthFilter (OncePerRequestFilter)"]
        SecConfig["SecurityConfig & CORS Filter"]
        UserDetailsService["CustomUserDetailsService"]
    end

    subgraph API ["REST Controller Layer"]
        AuthCtrl["AuthController"]
        PetitionCtrl["PetitionController"]
        PollCtrl["PollController"]
        QueryCtrl["QueryController"]
        UserCtrl["UserController"]
    end

    subgraph Service ["Business Logic Service Layer"]
        AuthSvc["AuthService"]
        PetitionSvc["PetitionService"]
    end

    subgraph Data ["Persistence Layer (JPA & MySQL)"]
        Repos["Spring Data JPA Repositories"]
        DB[(MySQL Database)]
    end

    UI --> Router
    Router --> Store
    UI --> Interceptor
    Interceptor -->|HTTP Bearer Request| SecConfig
    SecConfig --> JwtFilter
    JwtFilter --> UserDetailsService
    JwtFilter --> API
    AuthCtrl --> AuthSvc
    PetitionCtrl --> PetitionSvc
    PollCtrl --> Repos
    QueryCtrl --> Repos
    UserCtrl --> Repos
    AuthSvc --> Repos
    PetitionSvc --> Repos
    Repos --> DB
```

---

## 2. AUTHENTICATION FLOW

```mermaid
sequenceDiagram
    autonumber
    actor User as Citizen / Official
    participant Angular as Angular App (LoginComponent)
    participant AuthSvc as AuthService (Client)
    participant AuthCtrl as AuthController (Spring)
    participant AuthServ as AuthService (Spring)
    participant PasswordEnc as BCryptPasswordEncoder
    participant JwtServ as JwtService
    participant LocalStorage as LocalStorage

    User->>Angular: Enter Email & Password
    Angular->>AuthSvc: login(email, password)
    AuthSvc->>AuthCtrl: POST /api/auth/login
    AuthCtrl->>AuthServ: login(LoginRequest)
    AuthServ->>PasswordEnc: matches(rawPassword, encodedPassword)
    alt Passwords Match
        AuthServ->>JwtServ: generateToken(email, role)
        JwtServ-->>AuthServ: Returns HMAC SHA-256 JWT
        AuthServ-->>AuthCtrl: AuthResponse(token, userId, name, email, role)
        AuthCtrl-->>AuthSvc: 200 OK + AuthResponse
        AuthSvc->>LocalStorage: Store token, userId, role, name
        AuthSvc-->>Angular: Authentication Success
        Angular-->>User: Redirect to Role Dashboard
    else Passwords Do Not Match
        AuthServ-->>AuthCtrl: Throw BadCredentialsException
        AuthCtrl-->>Angular: 401 Unauthorized
        Angular-->>User: Display Error Message
    end
```

---

## 3. REQUEST LIFECYCLE

```mermaid
flowchart LR
    Req[HTTP Request with Bearer Token] --> SecurityFilter[Spring SecurityFilterChain]
    SecurityFilter --> CORS[CorsFilter Validation]
    CORS --> JWTFilter[JwtAuthFilter Extract & Validate Claims]
    JWTFilter --> AuthCheck{Authorized?}
    AuthCheck -- No --> 401[401 / 403 HTTP Error]
    AuthCheck -- Yes --> Controller[REST Controller Endpoint]
    Controller --> DTOVal{Valid DTO?}
    DTOVal -- No --> 400[400 Bad Request]
    DTOVal -- Yes --> Service[Service Layer Execution]
    Service --> Repo[Spring Data JPA Query]
    Repo --> MySQL[(MySQL 8 DB)]
    MySQL --> Repo
    Repo --> Service
    Service --> Controller
    Controller --> Res[200 / 201 Response JSON]
```

---

## 4. FRONTEND ROUTING MAP

```mermaid
graph TD
    Root["/"] --> Landing["HomeComponent (Public)"]
    Root --> Login["/login (guestGuard)"]
    Root --> Register["/register (guestGuard)"]
    
    Root --> CitizenDash["/citizen-dashboard (authGuard, roleGuard: CITIZEN)"]
    CitizenDash --> CitizenHome["/citizen-dashboard (Home)"]
    CitizenDash --> CitizenPetitions["/citizen-dashboard/petitions"]
    CitizenDash --> CitizenPolls["/citizen-dashboard/polls"]
    CitizenDash --> CitizenOfficials["/citizen-dashboard/officials"]
    CitizenDash --> CitizenProfile["/citizen-dashboard/profile"]

    Root --> OfficialDash["/official-dashboard (authGuard, roleGuard: OFFICIAL)"]
    OfficialDash --> OfficialHome["/official-dashboard (Home)"]
    OfficialDash --> OfficialPetitions["/official-dashboard/petitions"]
    OfficialDash --> OfficialPolls["/official-dashboard/polls"]
    OfficialDash --> OfficialQueries["/official-dashboard/queries"]
    OfficialDash --> OfficialProfile["/official-dashboard/profile"]
```

---

## 5. DATABASE RELATIONS

```mermaid
erDiagram
    USERS ||--o{ PETITIONS : "creates"
    USERS ||--o{ SIGNATURES : "signs"
    USERS ||--o{ POLLS : "creates (Official)"
    USERS ||--o{ VOTES : "casts vote"
    USERS ||--o{ QUERIES : "asks (Citizen) / replies (Official)"
    PETITIONS ||--o{ SIGNATURES : "receives signatures"
    POLLS ||--o{ VOTES : "receives votes"
```

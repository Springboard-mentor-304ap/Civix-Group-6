# CIVIX

> A modern, role-based digital platform built with Angular and Spring Boot.

[![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)](https://angular.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-green?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)](https://www.java.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📌 Overview

**CIVIX** is a full-stack web application designed to provide a secure, scalable, and user-friendly platform with role-based access and a modern web interface.

The project follows a structured **frontend–backend architecture**, with Angular powering the client-side application and Spring Boot providing backend services and APIs.

The application focuses on:

* Secure authentication
* Role-based access control
* Modular frontend architecture
* RESTful backend APIs
* Clean separation between frontend and backend
* Scalable application design
* Responsive and user-friendly interface

---

## 🎯 Problem Statement

Modern digital platforms often need to serve different categories of users while ensuring that each user can access only the features and resources permitted to their role.

CIVIX addresses this requirement by providing a centralized platform with:

* Secure user authentication
* Role-based authorization
* Dedicated interfaces based on user permissions
* Backend API integration
* Structured data and application management

---

## 💡 Solution

CIVIX implements a full-stack architecture where the Angular frontend communicates with the Spring Boot backend through REST APIs, while authentication and authorization mechanisms ensure that users can access only the resources available to their assigned roles.

```text
                    ┌─────────────────────┐
                    │       CIVIX         │
                    │    Web Platform     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Angular 21        │
                    │    Frontend         │
                    └──────────┬──────────┘
                               │
                         REST APIs
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Spring Boot       │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Database       │
                    └─────────────────────┘
```

---

## ✨ Key Features

### 🔐 Authentication

CIVIX provides a secure authentication flow for users, including:

* User login
* Authentication validation
* Session/token management
* Protected application routes
* Unauthorized access handling

### 👥 Role-Based Access Control

Different users can access different parts of the application depending on their assigned role.

```text
User
 │
 ├── Authentication
 │
 ├── Role Identification
 │
 └── Permission Validation
        │
        ├── Allowed → Access Resource
        │
        └── Denied  → Access Restricted
```

### 🖥️ Modern User Interface

The frontend is developed using Angular 21 with a modular component-based architecture, providing:

* Clean navigation
* Responsive layouts
* Reusable components
* Role-specific interfaces
* Consistent user experience

### 🔄 Frontend–Backend Integration

```text
Angular Component
       ↓
Angular Service
       ↓
HTTP Request
       ↓
Spring Boot REST API
       ↓
Business Logic
       ↓
Database
       ↓
JSON Response
       ↓
Angular UI
```

### 🛡️ Protected Routes

Application routes are protected according to authentication and authorization requirements. Unauthenticated or unauthorized users are prevented from accessing restricted resources.

### 🧑‍🤝‍🧑 Citizen & Official Dashboards

CIVIX provides dedicated dashboards tailored to each role:

* **Citizen Dashboard** — Polls, Petitions, Queries, and Reports
* **Official Dashboard** — Administrative tools for managing and responding to citizen activity

---

## 🏗️ Architecture

CIVIX follows a layered full-stack architecture.

```text
┌───────────────────────────────────────────────┐
│                   CLIENT                       │
│                                                 │
│              Angular 21 Frontend                │
│                                                 │
│  Components → Services → Guards → Routing       │
└───────────────────────┬───────────────────────┘
                        │
                        │ REST API
                        ▼
┌───────────────────────────────────────────────┐
│                  SERVER                        │
│                                                 │
│           Spring Boot 3.3.4 (Java 17)           │
│                                                 │
│ Controller → Service → Repository → Database    │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                  DATABASE                      │
│                                                 │
│              Persistent Storage                 │
└───────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology       | Purpose                 |
| ---------------- | ------------------------ |
| Angular 21 (v21.2.0) | Frontend framework    |
| TypeScript 5.9      | Application development  |
| HTML5              | Page structure           |
| CSS3                | Styling                  |
| RxJS 7.8              | Reactive programming     |
| Angular Router       | Application routing      |
| Angular Services     | API communication        |
| Vitest                | Unit testing             |

### Backend

| Technology       | Purpose                         |
| ---------------- | -------------------------------- |
| Java 17            | Backend programming language     |
| Spring Boot 3.3.4    | Backend framework                |
| Spring Data JPA      | ORM & database access            |
| Spring Security       | Authentication & authorization   |
| Flyway                 | Database migrations              |
| JJWT                    | JWT-based authentication         |
| MySQL Connector          | Database connectivity            |
| OpenPDF                    | PDF report generation            |
| Apache Commons CSV           | CSV import/export                |
| REST APIs                      | Frontend-backend communication   |

### Development Tools

| Tool                     | Purpose                  |
| ------------------------ | ------------------------- |
| Git                        | Version control            |
| GitHub                      | Source code management     |
| VS Code / IntelliJ IDEA       | Development                |
| Postman                        | API testing                 |

> The exact dependencies and database technologies should be updated according to the current project implementation.

---

## 📂 Project Structure

```text
CIVIX/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── guards/
│   │   │   ├── models/
│   │   │   └── pages/
│   │   │
│   │   ├── assets/
│   │   └── environments/
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── ...
│   │   │   └── resources/
│   │
│   └── pom.xml
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Angular CLI
* Java JDK
* Maven
* Git
* Required database

Check your installations:

```bash
node --version
npm --version
java --version
mvn --version
```

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone <REPOSITORY_URL>
cd CIVIX
```

### 2. Frontend Setup

```bash
cd frontend
npm install
ng serve
```

The application will generally be available at:

```text
http://localhost:4200
```

### 3. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will run on the configured Spring Boot port.

---

## 🔑 Authentication Flow

```text
          User
           │
           ▼
      Login Page
           │
           ▼
     Enter Credentials
           │
           ▼
     Angular Frontend
           │
           ▼
     Authentication API
           │
           ▼
     Spring Boot Backend
           │
           ▼
   Validate Credentials
           │
      ┌────┴────┐
      │         │
    Valid     Invalid
      │         │
      ▼         ▼
  Authenticate  Error
      │
      ▼
 Identify User Role
      │
      ▼
 Grant Appropriate Access
```

---

## 👥 Role-Based Authorization

CIVIX uses role-based access control to restrict application functionality according to user permissions.

```text
                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │
                    Authentication
                           │
                           ▼
                    ┌──────────────┐
                    │     Role     │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          Role A         Role B        Role C
             │             │             │
             ▼             ▼             ▼
        Features A     Features B    Features C
```

> The exact roles and permissions should be documented here based on the final CIVIX implementation.

---

## 🔌 API Integration

The Angular frontend communicates with the Spring Boot backend through REST APIs.

```text
HTTP Request
     ↓
Spring Controller
     ↓
Service Layer
     ↓
Repository Layer
     ↓
Database
     ↓
JSON Response
```

**Example:**

```http
POST /api/auth/login
```

Request:

```json
{
  "username": "example",
  "password": "********"
}
```

Response:

```json
{
  "success": true,
  "message": "Authentication successful"
}
```

> Replace the example endpoints with the actual CIVIX API endpoints before publishing the README.

---

## 📸 Screenshots

Add screenshots of the major CIVIX interfaces here.

```text
![CIVIX Login](./screenshots/login.png)
![CIVIX Dashboard](./screenshots/dashboard.png)
![CIVIX Role-Specific Interface](./screenshots/role-dashboard.png)
```

---

## ✅ Build & Verification Status

The project has been verified as fully buildable and error-free across both modules.

| Module | Command | Result |
| ------ | ------- | ------ |
| Backend (`civix-backend`) | `mvn test-compile` | ✅ Success — 52 Java source files compiled with 0 errors |
| Backend (`civix-backend`) | `mvn test` | ✅ Success — build completed |
| Frontend (`civix-frontend`) | `npm run build` | ✅ Success — Angular bundle generated |

**Verified modules and components:** Auth flow, Citizen Dashboard (Polls, Petitions, Queries, Reports), Official Dashboard, Guards, and Services.

---

## 🧪 Testing

The application should be tested across the following areas:

* Authentication
* Authorization
* Protected routes
* API responses
* Form validation
* Error handling
* Role-specific functionality
* Frontend-backend integration

API endpoints can be tested using Postman or similar API testing tools.

---

## 🔒 Security

Security is an important part of CIVIX. The application incorporates authentication and authorization mechanisms to ensure that protected resources are accessible only to authorized users.

Important security considerations include:

* Authentication validation
* Role-based authorization
* Protected routes
* Backend authorization
* Input validation
* Secure API communication
* Proper error handling

---

## 🔮 Future Enhancements

* Advanced analytics dashboard
* More granular permissions
* Enhanced audit logging
* Improved notification system
* Advanced search and filtering
* Performance optimization
* Automated testing
* CI/CD integration
* Cloud deployment
* Monitoring and observability

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Project

**CIVIX**

Built using **Angular 20 + Spring Boot** with a focus on secure authentication, role-based access control, and scalable full-stack architecture.

Developed as part of the **Infosys Springboard** program.

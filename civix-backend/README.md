# Civix Backend — Task 1 & 2 Setup (Database + Server)

Stack: **Spring Boot 3.3 + MySQL 8 + Flyway + Spring Security (JWT)**
No Docker needed — everything runs natively on your machine.

## Prerequisites
- Java 17+ (`java -version`)
- Maven (or use an IDE like IntelliJ / VS Code that bundles it)
- MySQL Server installed locally

---

## Step 1 — Install MySQL

### Windows
1. Download the installer from https://dev.mysql.com/downloads/installer/
2. Run it, choose "Server only" (or the full bundle — it includes MySQL Workbench, a GUI you can use to browse tables)
3. Set a root password during setup and remember it
4. MySQL starts automatically as a background service on `localhost:3306`

---

## Step 2 — Create the database and user

Open a terminal and log into MySQL as root:
```bash
mysql -u root -p
```
Enter your MySQL root password. Then run:
```sql
CREATE DATABASE civic_engagement;
EXIT;
```

---

## Step 3 — Run the Spring Boot server

From the project folder:
```bash
mvn spring-boot:run
```

On startup, **Flyway automatically runs** all migrations in `src/main/resources/db/migration` and creates the database schema inside `civic_engagement`.

---

## Step 4 — Verify it works

```bash
curl http://localhost:8080/api/health
```
Expected response:
```json
{"status":"UP","service":"civix-backend"}
```

Swagger API docs:
```
http://localhost:8080/swagger-ui.html
```

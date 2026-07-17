<<<<<<< HEAD
# Civix Backend — Task 1 Setup (Database + Server)

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

### Mac
```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

---

## Step 2 — Create the database and user

Open a terminal and log into MySQL as root:
```bash
mysql -u root -p
```
Enter the root password you set during install. Then run:
```sql
CREATE DATABASE civix_db;
CREATE USER 'civix'@'localhost' IDENTIFIED BY 'civix123';
GRANT ALL PRIVILEGES ON civix_db.* TO 'civix'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

This matches exactly what's already configured in `application.yml` — no need to change anything there.

---

## Step 3 — Run the Spring Boot server

From the project folder:
```bash
./mvnw spring-boot:run
```
(If `mvnw` doesn't have execute permission on Mac/Linux: `chmod +x mvnw` first. On Windows use `mvnw.cmd spring-boot:run`. Or simply open the project in IntelliJ/VS Code and run `CivixBackendApplication.java` directly — the IDE will use its bundled Maven.)

On startup, **Flyway automatically runs** `src/main/resources/db/migration/V1__init_schema.sql` and creates all 6 tables (`users`, `petitions`, `signatures`, `polls`, `votes`, `admin_logs`) inside `civix_db`.

---

## Step 4 — Verify it works

```bash
curl http://localhost:8080/api/health
```
Expected response:
```json
{"status":"UP","service":"civix-backend"}
```

Check the tables were created:
```bash
mysql -u civix -p civix_db -e "SHOW TABLES;"
```
(password: `civix123`)

Swagger API docs (once controllers are added in Task 3) will be at:
```
http://localhost:8080/swagger-ui.html
```

---

## What's already done (Task 1 ✅)
- [x] Database chosen: **MySQL 8**
- [x] Native install steps for Windows/Mac/Linux — no Docker
- [x] Spring Boot project scaffolded with all core dependencies (Web, JPA, Security, JWT, Flyway, Validation, OpenAPI)
- [x] `application.yml` configured to connect to local MySQL, with Flyway enabled
- [x] Flyway migration `V1__init_schema.sql` — full schema matching the spec, plus a `verified` boolean on `users` (needed for the "Unverified Official" badge shown in the dashboard mockup, which wasn't in the original schema)
- [x] Health check endpoint to confirm server + DB wiring

## Note on MySQL JSON column
`polls.options` uses MySQL's native `JSON` type to store the list of poll options (e.g. `["Yes", "No", "Maybe"]`). Unlike Postgres's `JSONB`, MySQL's JSON isn't indexed by default — that's fine at this project's scale.

## Troubleshooting
- **"Access denied for user 'civix'@'localhost'"** — re-check Step 2 ran without errors; re-run the `GRANT` + `FLUSH PRIVILEGES` lines.
- **"Unknown database 'civix_db'"** — the `CREATE DATABASE` line in Step 2 didn't run; log back into `mysql -u root -p` and run it again.
- **Port 3306 already in use** — another MySQL instance (or XAMPP/WAMP) may already be running; stop it or change the port in both MySQL config and `application.yml`.
- **Flyway checksum mismatch on re-run** — if you edit `V1__init_schema.sql` after it's already been applied once, drop the database and recreate it (Step 2), since Flyway won't let an already-applied migration change.

## Next (Task 2 & 3)
- Learn Spring Security + JWT hands-on while building Milestone 1
- Build: `User` entity, `UserRepository`, `AuthController` (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`), password hashing, JWT filter, role-based route protection
=======
# Civix-Group-6
>>>>>>> a209bd9bed95516b95db33ad6226aac03ec70889

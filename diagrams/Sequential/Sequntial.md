# Sequential Diagrams — SD-Capstone

This document describes all sequence diagrams for the SD-Capstone healthcare system. Each diagram captures the interaction flow between system actors and services for a specific use case.

---

## 1. User Registration Flow

![User Registration Flow](./Images/1.png)

**Actors / Participants:**
- **User** — End user submitting the registration form
- **Frontend** — Client-side application
- **Auth Service** — Handles authentication and account creation logic
- **Database** — Persistent data store

### Flow

```
User → Frontend → Auth Service → Database
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | User | Frontend | Submit registration form | Sync |
| 2 | Frontend | Auth Service | Create account request | Sync |
| 3 | Auth Service | Database | Check if user exists | Sync |

### Alt Block — `user exists` ✗

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 4.1 | Database | Auth Service | User found | Return (dashed) |
| 4.2 | Auth Service | Frontend | Registration failed | Return (dashed) |
| 4.3 | Frontend | User | Email already registered | Return (dashed) |

### Alt Block — `new user` ✓

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 5.1 | Database | Auth Service | User not found | Return (dashed) |
| 5.2 | Auth Service | Auth Service | Hash password | Self-loop |
| 5.3 | Auth Service | Database | Save new user | Sync |
| 5.4 | Database | Auth Service | User saved | Return (dashed) |
| 5.5 | Auth Service | Frontend | Account created | Return (dashed) |
| 5.6 | Frontend | User | Registration successful | Return (dashed) |

---

## 2. Patient Uploads Medical Record

![Patient Uploads Medical Record](./Images/2.png)

**Actors / Participants:**
- **Patient** — Authenticated user uploading a file
- **Frontend** — Client-side application
- **Auth Middleware** — Validates JWT tokens
- **Record Service** — Handles file processing and metadata
- **Cloudinary** — Cloud storage for medical files
- **Database** — Persistent data store

### Flow

```
Patient → Frontend → Auth Middleware → Record Service → Cloudinary / Database
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | Patient | Frontend | Select file and upload | Sync |
| 2 | Frontend | Auth Middleware | Upload request with token | Sync |
| 3 | Auth Middleware | Auth Middleware | Validate JWT | Self-loop |

### Alt Block — `token valid` ✓

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 4.1 | Auth Middleware | Record Service | Process upload | Sync |
| 4.2 | Record Service | Cloudinary | Store file | Sync |
| 4.3 | Cloudinary | Record Service | File URL | Return (dashed) |
| 4.4 | Record Service | Database | Save record metadata | Sync |
| 4.5 | Database | Record Service | Saved record | Return (dashed) |
| 4.6 | Record Service | Frontend | Upload successful | Return (dashed) |
| 4.7 | Frontend | Patient | File uploaded successfully | Return (dashed) |

### Alt Block — `token invalid` ✗

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 5.1 | Auth Middleware | Frontend | Unauthorized | Return (dashed) |
| 5.2 | Frontend | Patient | Please log in again | Return (dashed) |

---

## 3. Patient Shares Document with Doctor

![Patient Shares Document with Doctor](./Images/3.png)

**Actors / Participants:**
- **Patient** — Authenticated user sharing a file
- **Frontend** — Client-side application
- **Auth Middleware** — Validates JWT tokens
- **Document Service** — Manages document upload and share record creation
- **Cloudinary** — Cloud storage for documents
- **Database** — Persistent data store

### Flow

```
Patient → Frontend → Auth Middleware → Document Service → Cloudinary / Database
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | Patient | Frontend | Select file and choose doctors | Sync |
| 2 | Frontend | Auth Middleware | Upload request with token | Sync |
| 3 | Auth Middleware | Auth Middleware | Validate JWT | Self-loop |
| 4 | Auth Middleware | Frontend | User authenticated | Return (dashed) |
| 5 | Frontend | Document Service | Upload and share request | Sync |
| 6 | Document Service | Cloudinary | Upload file | Sync |
| 7 | Cloudinary | Document Service | File URL | Return (dashed) |
| 8 | Document Service | Database | Save document record | Sync |
| 9 | Database | Document Service | Document created | Return (dashed) |
| 10 | Document Service | Database | Create share records for doctors | Sync |
| 11 | Database | Document Service | Shares created | Return (dashed) |
| 12 | Document Service | Frontend | Success response | Return (dashed) |
| 13 | Frontend | Patient | Document shared successfully | Return (dashed) |

> **Note:** Steps 5–12 occur within a single activation bar on the Document Service, indicating it orchestrates the entire upload-and-share operation atomically.

---

## 4. Doctor Views Shared Document

![Doctor Views Shared Document](./Images/4.png)

**Actors / Participants:**
- **Doctor** — Authenticated user viewing a shared document
- **Frontend** — Client-side application
- **API** — Backend API layer
- **Database** — Persistent data store

### Flow

```
Doctor → Frontend → API → Database
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | Doctor | Frontend | Open shared documents page | Sync |
| 2 | Frontend | API | Request shared documents | Sync |
| 3 | API | Database | Query shared documents | Sync |
| 4 | Database | API | Return document list | Return (dashed) |
| 5 | API | Frontend | Document list response | Return (dashed) |
| 6 | Frontend | Doctor | Display document list | Return (dashed) |
| 7 | Doctor | Frontend | Select document to view | Sync |

### Alt Block — `access valid` ✓

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 8.1 | Frontend | API | Request document details | Sync |
| 8.2 | API | Database | Fetch document and log access | Sync |
| 8.3 | Database | API | Document data | Return (dashed) |
| 8.4 | API | Frontend | Document response | Return (dashed) |
| 8.5 | Frontend | Doctor | Display document | Return (dashed) |

### Alt Block — `access denied` ✗

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 9.1 | API | Frontend | Access denied error | Return (dashed) |
| 9.2 | Frontend | Doctor | Show error message | Return (dashed) |

---

## 5. Patient Sets Up Emergency Profile

**Actors / Participants:**
- **Patient** — Authenticated user configuring their emergency profile
- **Frontend** — Client-side application
- **Auth Middleware** — Validates JWT tokens
- **Emergency Service** — Manages emergency profile lifecycle
- **Token Service** — Generates unique emergency tokens
- **QR Code Service** — Generates QR code data URLs
- **Database** — Persistent data store

### Flow

```
Patient → Frontend → Auth Middleware → Emergency Service → Token Service / Database
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | Patient | Frontend | Fill emergency profile form and submit | Sync |
| 2 | Frontend | Auth Middleware | POST /emergency/setup with JWT | Sync |
| 3 | Auth Middleware | Auth Middleware | Validate JWT | Self-loop |

### Alt Block — `token valid` ✓

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 4.1 | Auth Middleware | Emergency Service | setupProfile(userId, payload) | Sync |
| 4.2 | Emergency Service | Emergency Service | Validate emergency payload | Self-loop |
| 4.3 | Emergency Service | Database | Find existing profile by userId | Sync |

### Alt Block — `no existing profile` (inner)

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 4.3a | Database | Emergency Service | Profile not found | Return (dashed) |
| 4.3b | Emergency Service | Token Service | generateUniqueToken() | Sync |
| 4.3c | Token Service | Token Service | Generate secure hex token | Self-loop |
| 4.3d | Token Service | Database | Check token uniqueness | Sync |
| 4.3e | Database | Token Service | Token is unique | Return (dashed) |
| 4.3f | Token Service | Emergency Service | Return unique token | Return (dashed) |
| 4.3g | Emergency Service | Database | Create new EmergencyProfile | Sync |
| 4.3h | Database | Emergency Service | Profile created | Return (dashed) |

### Continuation (profile exists or newly created)

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 5.1 | Emergency Service | Database | Update emergencyProfile data | Sync |
| 5.2 | Database | Emergency Service | Profile saved | Return (dashed) |
| 5.3 | Emergency Service | Emergency Service | Build public URL from token | Self-loop |
| 5.4 | Emergency Service | Frontend | Return profile with publicUrl | Return (dashed) |
| 5.5 | Frontend | Patient | Emergency profile saved successfully | Return (dashed) |

---

## 6. Emergency Responder Scans QR Code (Public Access)

**Actors / Participants:**
- **Emergency Responder** — Unauthenticated user scanning the QR code
- **Browser** — Responder's device browser
- **Rate Limiter** — Middleware limiting requests per IP
- **Emergency Service** — Retrieves public emergency profile
- **Database** — Persistent data store

### Flow

```
Emergency Responder → Browser → Rate Limiter → Emergency Service → Database
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | Emergency Responder | Browser | Scan QR code → opens public URL | Sync |
| 2 | Browser | Rate Limiter | GET /api/public/emergency/:token | Sync |
| 3 | Rate Limiter | Rate Limiter | Check request count for IP | Self-loop |

### Alt Block — `rate limit exceeded` ✗

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 4.1 | Rate Limiter | Browser | 429 Too Many Requests | Return (dashed) |
| 4.2 | Browser | Emergency Responder | Show rate limit error | Return (dashed) |

### Alt Block — `rate limit OK` ✓

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 5.1 | Rate Limiter | Emergency Service | getPublicProfile(token) | Sync |
| 5.2 | Emergency Service | Emergency Service | Validate and normalize token | Self-loop |
| 5.3 | Emergency Service | Database | Find profile by token where enabled=true | Sync |

### Alt Block — `profile found and enabled` ✓ (inner)

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 5.4a | Database | Emergency Service | Return EmergencyProfile | Return (dashed) |
| 5.5a | Emergency Service | Emergency Service | Map to public-safe fields only | Self-loop |
| 5.6a | Emergency Service | Browser | Return scoped emergency info | Return (dashed) |
| 5.7a | Browser | Emergency Responder | Display: name, blood group, allergies, meds, contacts | Return (dashed) |

### Alt Block — `profile not found or disabled` ✗ (inner)

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 5.4b | Database | Emergency Service | Profile not found | Return (dashed) |
| 5.5b | Emergency Service | Browser | 404 Emergency profile unavailable | Return (dashed) |
| 5.6b | Browser | Emergency Responder | Show error: profile unavailable | Return (dashed) |

> **Note:** This is a **public** endpoint — no JWT authentication required. Security is enforced via: (a) unique 48-character hex token, (b) `emergencyAccessEnabled` toggle controlled by the patient, and (c) rate limiting (30 req/min per IP).

---

## 7. Patient Logs Vitals

**Actors / Participants:**
- **Patient** — Authenticated user logging their vitals
- **Frontend** — Client-side application
- **Auth Middleware** — Validates JWT tokens
- **Analytics Controller** — Routes the vitals request
- **Vitals Service** — Handles validation, BMI calculation, and CRUD
- **Database** — Persistent data store (VitalLog collection)

### Flow

```
Patient → Frontend → Auth Middleware → Analytics Controller → Vitals Service → Database
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | Patient | Frontend | Fill vitals form (weight, BP, sugar, sleep, etc.) | Sync |
| 2 | Frontend | Auth Middleware | POST /api/analytics/vitals with JWT | Sync |
| 3 | Auth Middleware | Auth Middleware | Validate JWT | Self-loop |

### Alt Block — `token valid` ✓

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 4.1 | Auth Middleware | Analytics Controller | createVitalLog(req) | Sync |
| 4.2 | Analytics Controller | Vitals Service | createVitalLog(userId, payload) | Sync |
| 4.3 | Vitals Service | Vitals Service | Validate payload & sanitize fields | Self-loop |
| 4.4 | Vitals Service | Vitals Service | Calculate BMI from weight and height | Self-loop |
| 4.5 | Vitals Service | Database | Create VitalLog document | Sync |
| 4.6 | Database | Vitals Service | Saved vital log | Return (dashed) |
| 4.7 | Vitals Service | Analytics Controller | Return created log | Return (dashed) |
| 4.8 | Analytics Controller | Frontend | 201 Vitals log created | Return (dashed) |
| 4.9 | Frontend | Patient | Vitals logged successfully | Return (dashed) |

### Alt Block — `token invalid` ✗

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 5.1 | Auth Middleware | Frontend | 401 Unauthorized | Return (dashed) |
| 5.2 | Frontend | Patient | Please log in again | Return (dashed) |

---

## 8. Patient Views Analytics Dashboard

**Actors / Participants:**
- **Patient** — Authenticated user viewing their health analytics
- **Frontend** — Client-side application
- **Auth Middleware** — Validates JWT tokens
- **Analytics Controller** — Orchestrates the dashboard response
- **Analytics Service** — Builds the full analytics payload
- **Vitals Service** — Retrieves vitals history
- **Risk Engine Service** — Generates risk profile (BP, BMI, sugar, etc.)
- **Health Score Service** — Calculates health score (0–100)
- **Report Analysis Service** — Analyzes medical reports for signals
- **Database** — Persistent data store

### Flow

```
Patient → Frontend → Auth Middleware → Analytics Controller → Analytics Service
                                                              ├─→ Vitals Service → Database
                                                              ├─→ Report Analysis Service → Database
                                                              ├─→ Risk Engine Service
                                                              ├─→ Health Score Service
                                                              └─→ Database (persist snapshot)
```

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 1 | Patient | Frontend | Open analytics dashboard | Sync |
| 2 | Frontend | Auth Middleware | GET /api/analytics/dashboard with JWT | Sync |
| 3 | Auth Middleware | Auth Middleware | Validate JWT | Self-loop |
| 4 | Auth Middleware | Analytics Controller | getDashboard(req) | Sync |
| 5 | Analytics Controller | Analytics Service | getDashboard(userId) | Sync |

### Data Gathering Phase

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 6.1 | Analytics Service | Vitals Service | getVitalsHistory(userId, limit:200) | Sync |
| 6.2 | Vitals Service | Database | Query VitalLog sorted by date desc | Sync |
| 6.3 | Database | Vitals Service | Return vitals array | Return (dashed) |
| 6.4 | Vitals Service | Analytics Service | Vitals history | Return (dashed) |
| 6.5 | Analytics Service | Report Analysis Service | analyzeUserReports(userId) | Sync |
| 6.6 | Report Analysis Service | Database | Query MedicalRecord + MedicalDocument | Sync |
| 6.7 | Database | Report Analysis Service | Return records and documents | Return (dashed) |
| 6.8 | Report Analysis Service | Report Analysis Service | Infer signals from report text (sugar, BP, lipid, thyroid, sleep) | Self-loop |
| 6.9 | Report Analysis Service | Analytics Service | Report analysis result | Return (dashed) |

### Alt Block — `no vitals history`

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 7.1 | Analytics Service | Analytics Service | Build empty analytics with default recommendations | Self-loop |
| 7.2 | Analytics Service | Frontend | Return empty dashboard | Return (dashed) |

### Processing Phase (when vitals exist)

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 8.1 | Analytics Service | Risk Engine Service | generateRiskProfile(latestVitals) | Sync |
| 8.2 | Risk Engine Service | Risk Engine Service | Evaluate BP status, sugar risk, BMI category, sleep, activity, SpO2, HR | Self-loop |
| 8.3 | Risk Engine Service | Analytics Service | Return risk profile + risk flags | Return (dashed) |
| 8.4 | Analytics Service | Analytics Service | Build trends (weight, BP, sugar, sleep) | Self-loop |
| 8.5 | Analytics Service | Health Score Service | calculateHealthScore(vitals, history, riskProfile) | Sync |
| 8.6 | Health Score Service | Health Score Service | Evaluate penalties and bonuses (BMI, BP, sugar, sleep, steps, SpO2, HR, history count) | Self-loop |
| 8.7 | Health Score Service | Analytics Service | Return health score (0–100) + score band | Return (dashed) |
| 8.8 | Analytics Service | Analytics Service | Compose recommendations and summary insights | Self-loop |
| 8.9 | Analytics Service | Analytics Service | Build chart data for frontend graphs | Self-loop |

### Snapshot Persistence

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 9.1 | Analytics Service | Database | Upsert AnalyticsSnapshot (healthScore, riskFlags, recommendations) | Sync |
| 9.2 | Database | Analytics Service | Snapshot persisted | Return (dashed) |

### Response

| Step | From | To | Message | Type |
|------|------|----|---------|------|
| 10.1 | Analytics Service | Analytics Controller | Full dashboard payload | Return (dashed) |
| 10.2 | Analytics Controller | Frontend | 200 Dashboard response | Return (dashed) |
| 10.3 | Frontend | Patient | Render health score, trends, charts, risk indicators, recommendations | Return (dashed) |

> **Note:** The dashboard response includes: `healthScore`, `healthScoreBand`, `trends`, `riskFlags`, `recommendations`, `latestVitals`, `chartsData`, `summaryInsights`, `riskIndicators`, `reportAnalysis`, `quickSummary`, and `lastUpdated`.

---

## Summary

| # | Diagram | Key Actors | Auth Mechanism |
|---|---------|-----------|----------------|
| 1 | User Registration Flow | User, Frontend, Auth Service, Database | Email uniqueness check |
| 2 | Patient Uploads Medical Record | Patient, Frontend, Auth Middleware, Record Service, Cloudinary, Database | JWT validation |
| 3 | Patient Shares Document with Doctor | Patient, Frontend, Auth Middleware, Document Service, Cloudinary, Database | JWT validation |
| 4 | Doctor Views Shared Document | Doctor, Frontend, API, Database | Access-level check per document |
| 5 | Patient Sets Up Emergency Profile | Patient, Frontend, Auth Middleware, Emergency Service, Token Service, Database | JWT validation |
| 6 | Emergency Responder Scans QR Code | Emergency Responder, Browser, Rate Limiter, Emergency Service, Database | Token-based (public) + Rate limiting |
| 7 | Patient Logs Vitals | Patient, Frontend, Auth Middleware, Analytics Controller, Vitals Service, Database | JWT validation |
| 8 | Patient Views Analytics Dashboard | Patient, Frontend, Auth Middleware, Analytics Service, Risk Engine, Health Score, Report Analysis, Database | JWT validation |
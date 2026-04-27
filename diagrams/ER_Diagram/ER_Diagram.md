# System ER Diagram

This document contains the Entity-Relationship (ER) diagram for the system based on the implemented database models in the `backend/models` directory.

---

## Part 1 — Original Entities (First Half)

```mermaid
erDiagram
    User {
        ObjectId _id PK
        String name
        String email UK
        String password
        String role "enum: patient, doctor"
        Date createdAt
        Date updatedAt
    }

    Appointment {
        ObjectId _id PK
        ObjectId patientId FK
        ObjectId doctorId FK
        Date date
        String time
        String reason
        String status "enum: Pending, Accepted, Rejected, Completed, Cancelled"
        String notes
        Date createdAt
        Date updatedAt
    }

    DocumentAccessLog {
        ObjectId _id PK
        ObjectId documentId FK
        ObjectId doctorId FK
        String action "enum: VIEW, DOWNLOAD, REVOKE, SHARE"
        Date accessedAt
    }

    DocumentShare {
        ObjectId _id PK
        ObjectId documentId FK
        ObjectId patientId FK
        ObjectId doctorId FK
        String permission "enum: VIEW, DOWNLOAD, FULL_ACCESS"
        String expiry "enum: 1H, 24H, 7D, NEVER"
        Date expiresAt
        Date createdAt
        Date updatedAt
    }

    MedicalDocument {
        ObjectId _id PK
        ObjectId patientId FK
        String title
        String description
        String fileUrl
        String cloudinaryPublicId
        String fileType
        String documentType
        Date createdAt
        Date updatedAt
    }

    MedicalRecord {
        ObjectId _id PK
        ObjectId user FK
        String fileName
        String originalName
        String fileUrl
        String publicId
        Number size
        Date createdAt
        Date updatedAt
    }

    User ||--o{ Appointment : "acts as patient"
    User ||--o{ Appointment : "acts as doctor"
    User ||--o{ MedicalDocument : "owns (patient)"
    User ||--o{ MedicalRecord : "owns (user)"
    MedicalDocument ||--o{ DocumentShare : "is shared via"
    User ||--o{ DocumentShare : "shares (patient)"
    User ||--o{ DocumentShare : "receives share (doctor)"
    MedicalDocument ||--o{ DocumentAccessLog : "has logs"
    User ||--o{ DocumentAccessLog : "performs action (doctor)"

```

---

## Part 2 — New Entities (Second Half Update)

The following three entities were introduced in the second half of the project to support **Emergency Access**, **Vitals Tracking**, and **Health Analytics**.

```mermaid
erDiagram
    User {
        ObjectId _id PK
        String name
        String email UK
        String password
        String role "enum: patient, doctor"
        Date createdAt
        Date updatedAt
    }

    EmergencyProfile {
        ObjectId _id PK
        ObjectId user FK "unique, ref: User"
        Boolean emergencyAccessEnabled "default: false"
        String emergencyToken UK "unique hex token"
        Object emergencyProfile "embedded sub-document"
        Date createdAt
        Date updatedAt
    }

    EmergencyContact {
        String name "max: 80 chars"
        String relation "max: 80 chars"
        String phone "max: 30 chars"
    }

    VitalLog {
        ObjectId _id PK
        ObjectId userId FK "ref: User"
        Date date "indexed"
        Number weight
        Number height
        Number bmi "auto-calculated"
        Number bloodPressureSystolic
        Number bloodPressureDiastolic
        Number bloodSugarFasting
        Number bloodSugarRandom
        Number heartRate
        Number oxygenLevel
        Number temperature
        Number sleepHours
        Number steps
        String notes "max: 500 chars"
        Date createdAt
        Date updatedAt
    }

    AnalyticsSnapshot {
        ObjectId _id PK
        ObjectId userId FK "unique, ref: User"
        Number healthScore "0-100"
        Array riskFlags "list of strings"
        Array recommendations "list of strings"
        Date createdAt
    }

    User ||--o| EmergencyProfile : "configures"
    EmergencyProfile ||--o{ EmergencyContact : "contains (embedded)"
    User ||--o{ VitalLog : "logs vitals"
    User ||--o| AnalyticsSnapshot : "has snapshot"

```

> **Note:** `EmergencyContact` is an embedded sub-document within the `emergencyProfile` field of `EmergencyProfile`. It does not have its own MongoDB collection. The `emergencyProfile` field also contains: `fullName`, `age`, `bloodGroup`, `allergies[]`, `conditions[]`, `medications[]`, and `notes`.

---

## Complete ER Diagram (All Entities Combined)

```mermaid
erDiagram
    User {
        ObjectId _id PK
        String name
        String email UK
        String password
        String role "enum: patient, doctor"
        Date createdAt
        Date updatedAt
    }

    Appointment {
        ObjectId _id PK
        ObjectId patientId FK
        ObjectId doctorId FK
        Date date
        String time
        String reason
        String status "enum: Pending, Accepted, Rejected, Completed, Cancelled"
        String notes
        Date createdAt
        Date updatedAt
    }

    DocumentAccessLog {
        ObjectId _id PK
        ObjectId documentId FK
        ObjectId doctorId FK
        String action "enum: VIEW, DOWNLOAD, REVOKE, SHARE"
        Date accessedAt
    }

    DocumentShare {
        ObjectId _id PK
        ObjectId documentId FK
        ObjectId patientId FK
        ObjectId doctorId FK
        String permission "enum: VIEW, DOWNLOAD, FULL_ACCESS"
        String expiry "enum: 1H, 24H, 7D, NEVER"
        Date expiresAt
        Date createdAt
        Date updatedAt
    }

    MedicalDocument {
        ObjectId _id PK
        ObjectId patientId FK
        String title
        String description
        String fileUrl
        String cloudinaryPublicId
        String fileType
        String documentType
        Date createdAt
        Date updatedAt
    }

    MedicalRecord {
        ObjectId _id PK
        ObjectId user FK
        String fileName
        String originalName
        String fileUrl
        String publicId
        Number size
        Date createdAt
        Date updatedAt
    }

    EmergencyProfile {
        ObjectId _id PK
        ObjectId user FK "unique, ref: User"
        Boolean emergencyAccessEnabled
        String emergencyToken UK
        Object emergencyProfile "embedded"
        Date createdAt
        Date updatedAt
    }

    EmergencyContact {
        String name
        String relation
        String phone
    }

    VitalLog {
        ObjectId _id PK
        ObjectId userId FK
        Date date
        Number weight
        Number height
        Number bmi
        Number bloodPressureSystolic
        Number bloodPressureDiastolic
        Number bloodSugarFasting
        Number bloodSugarRandom
        Number heartRate
        Number oxygenLevel
        Number temperature
        Number sleepHours
        Number steps
        String notes
        Date createdAt
        Date updatedAt
    }

    AnalyticsSnapshot {
        ObjectId _id PK
        ObjectId userId FK "unique"
        Number healthScore
        Array riskFlags
        Array recommendations
        Date createdAt
    }

    User ||--o{ Appointment : "acts as patient"
    User ||--o{ Appointment : "acts as doctor"
    User ||--o{ MedicalDocument : "owns (patient)"
    User ||--o{ MedicalRecord : "owns (user)"
    MedicalDocument ||--o{ DocumentShare : "is shared via"
    User ||--o{ DocumentShare : "shares (patient)"
    User ||--o{ DocumentShare : "receives share (doctor)"
    MedicalDocument ||--o{ DocumentAccessLog : "has logs"
    User ||--o{ DocumentAccessLog : "performs action (doctor)"
    User ||--o| EmergencyProfile : "configures"
    EmergencyProfile ||--o{ EmergencyContact : "contains (embedded)"
    User ||--o{ VitalLog : "logs vitals"
    User ||--o| AnalyticsSnapshot : "has snapshot"

```

---

## System Architecture Diagram

![Chen Diagram ](./images/chen.png)

![Crowfoot Diagram ](./images/crowfoot.png)

---

## Enums

### `User.role`
| Value | Description |
|-------|-------------|
| `patient` | A registered patient on the system |
| `doctor` | A registered doctor on the system |

### `Appointment.status`
`Pending`, `Accepted`, `Rejected`, `Completed`, `Cancelled`

### `DocumentAccessLog.action`
`VIEW`, `DOWNLOAD`, `REVOKE`, `SHARE`

### `DocumentShare.permission`
`VIEW`, `DOWNLOAD`, `FULL_ACCESS`

### `DocumentShare.expiry`
`1H`, `24H`, `7D`, `NEVER`

---

## New Relationships Summary (Second Half)

| From Entity | To Entity | Cardinality | Verb |
|-------------|-----------|-------------|------|
| User | EmergencyProfile | 1 : 0..1 | configures |
| EmergencyProfile | EmergencyContact | 1 : 0..N | contains (embedded array) |
| User | VitalLog | 1 : 0..N | logs vitals |
| User | AnalyticsSnapshot | 1 : 0..1 | has snapshot (cached) |

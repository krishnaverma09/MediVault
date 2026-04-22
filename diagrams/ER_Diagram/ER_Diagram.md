# System ER Diagram

This document contains the Entity-Relationship (ER) diagram for the system based on the implemented database models in the `backend/models` directory.

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
## System Architecture Diagram

![Chen Diagram ](./images/chen.png)

![Crowfoot Diagram ](./images/crowfoot.png)

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

useCaseDiagram
    actor Patient
    actor Doctor
    actor "Emergency Responder" as ER

    package "MediVault System" {
        usecase "Register & Login" as UC1
        usecase "Manage Medical Profile" as UC2
        usecase "Upload & Categorize Records" as UC3
        usecase "View & Manage Own Records" as UC4
        usecase "Generate Share Link" as UC5
        usecase "Revoke Share Link" as UC6
        usecase "Generate Emergency QR Code" as UC7
        
        usecase "View Shared Patient Records" as UC8
        usecase "Add Consultation Notes" as UC9
        usecase "Upload Digital Prescription" as UC10
        
        usecase "Scan QR Code" as UC11
        usecase "View Scoped Emergency Info" as UC12
        
        usecase "Authentication & RBAC" as UC_SYS
    }

    Patient --> UC1
    Patient --> UC2
    Patient --> UC3
    Patient --> UC4
    Patient --> UC5
    Patient --> UC6
    Patient --> UC7

    Doctor --> UC1
    Doctor --> UC8
    Doctor --> UC9
    Doctor --> UC10

    ER --> UC11
    ER --> UC12

    UC1 ..> UC_SYS : <<include>>
    UC4 ..> UC_SYS : <<include>>
    UC8 ..> UC_SYS : <<include>>
    UC12 ..> UC_SYS : <<include>> (scoped)
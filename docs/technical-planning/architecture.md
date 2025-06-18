# Architecture Planning Document
## Overview
**DailyFlo** is a mobile-first task management app focused on quick task capture, recurring task support, and intuitive calendar views. It’s optimized for iPhone usability and offline-first usage.
### Stack Summary
| Layer        | Technology          |
|--------------|---------------------|
| Frontend     | React Native (Expo) |
| Backend      | Django REST Framework |
| Database     | PostgreSQL (prod) |
| Deployment   | Backend on Render/Fly.io [TBD], App via Expo|

---
## System Architecture

```plaintext
┌─────────────────┐    HTTP/HTTPS     ┌─────────────────┐
│  React Native   │ ◄──────────────►  │   Django API    │
│     (Expo)      │    JSON/REST      │   (Backend)     │
│                 │                   │                 │
│                 │                   │ ┌─────────────┐ │
│                 │                   │ │  Django ORM │ │
│                 │                   │ │             │ │
│                 │                   │ └─────────────┘ │
│                 │                   │        │        │
│ ┌─────────────┐ │                   │        ▼        │
│ │AsyncStorage │ │                   │ ┌─────────────┐ │
│ │ (Offline)   │ │                   │ │PostgreSQL DB│ │
│ └─────────────┘ │                   │ │             │ │
└─────────────────┘                   │ └─────────────┘ │
                                      └─────────────────┘
```
* Frontend handles UI, offline-first local storage, and minimal user input.
* Backend provides API, authentication, task logic, and data persistence.

## Frontend Architecture (React Native + Expo)
### Core Technologies
- React Native: Cross-platform mobile framework
- Expo: Development platform and toolchain
- React Navigation: Screen navigation and routing
- AsyncStorage: Local storage for offline functionality
- Axios: HTTP client for API communication
## Backend Architecture (Django)
### Core Technologies
- Django 4.2+: Web framework
- Django REST Framework: API development
- PostgreSQL: Primary database
## Database Architecture
**Primary Database: PostgreSQL**
- ACID compliance for data integrity
- JSON field support for flexible task metadata
- Full-text search capabilities
- Excellent Django ORM support
## Deployment Architecture
- Expo Development Build for frontend testing
- Local Django server with SQLite for rapid development
- Docker Compose for full-stack local development
### Production Environment (Future)
- Frontend: Expo Application Services (EAS) for app store deployment
- Backend: Cloud deployment (AWS/DigitalOcean/Railway)
- Database: Managed PostgreSQL service
- Monitoring: Error tracking and performance monitoring

---
## Security Considerations
### Authentication & Authorization
- JWT tokens with short expiration times
- Refresh token rotation
- Rate limiting on authentication endpoints
- Input validation and sanitization
### Data Protection
- HTTPS enforcement for all API communication
- SQL injection prevention through ORM usage
- User data isolation at database level
### Mobile Security
- Secure storage of authentication tokens
- Certificate pinning for API communication
- Biometric authentication (future feature)
- App transport security compliance
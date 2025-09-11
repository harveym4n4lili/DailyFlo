# API Endpoints Planning Document
## API Design Principles
* RESTful architecture with clear resource-based URLs
* Consistent response formats across all endpoints
* HTTP status codes for proper error handling
* JSON communication for all requests and responses
* Stateless design using JWT authentication
* API versioning for future compatibility
* Social authentication support (Facebook, Google, Apple)
* Hierarchical resource organization (users → lists → tasks → subtasks)
* Color-coded visual organization support
* Enhanced recurring task patterns (daily, weekly, monthly)
* Notification and reminder system integration

---
## Authentication Endpoints
### POST /auth/register
**Purpose:** Create a new user account with email/password  
**Authentication:** None required  
**Request Body:**  
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```
**Response:**  
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "auth_provider": "email",
    "is_email_verified": false
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```
- Status: 201 Created / 400 Bad Request  

### POST /auth/social
**Purpose:** Authenticate with social provider (Facebook, Google, Apple)  
**Authentication:** None required  
**Request Body:**  
```json
{
  "provider": "google",
  "access_token": "social_provider_token",
  "user_info": {
    "email": "user@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```
**Response:**  
```json
{
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "auth_provider": "google",
    "is_email_verified": true
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```
- Status: 200 OK / 201 Created / 400 Bad Request

### POST /auth/login
**Purpose:** Authenticate existing user with email/password
**Authentication:** None required
**Request Body:** 
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
**Response:** 
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "auth_provider": "email",
    "is_email_verified": true
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```
- Status: 200 OK / 401 Unauthorized

### POST /auth/refresh
**Purpose:** Get new access token using refresh token  
**Authentication:** None required  
**Request Body:**  
```json
{
  "refresh": "jwt_refresh_token"
}
```
**Response:**  
```json
{
  "access": "new_jwt_access_token"
}
```
- Status: 200 OK / 401 Unauthorized  

### POST /auth/logout
**Purpose:** Invalidate user tokens  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "refresh": "jwt_refresh_token"
}
```
**Response:**  
```json
{
  "message": "Successfully logged out"
}
```
- Status: 200 OK  

---
## User Management Endpoints
### GET /users/me
**Purpose:** Retrieve authenticated user's profile  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "auth_provider": "google",
  "is_email_verified": true,
  "preferences": {
    "theme": "light",
    "notifications": {
      "enabled": true,
      "due_date_reminders": true,
      "routine_reminders": true
    },
    "default_priority": 3,
    "default_color": "blue"
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "last_login": "2025-01-01T00:00:00Z"
}
```
- Status: 200 OK / 401 Unauthorized  

### PUT /users/me
**Purpose:** Update authenticated user's profile  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "enabled": true,
      "due_date_reminders": false,
      "routine_reminders": true
    },
    "default_priority": 4,
    "default_color": "green"
  }
}
```
**Response:**  
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "auth_provider": "google",
  "is_email_verified": true,
  "preferences": {
    "theme": "dark",
    "notifications": {
      "enabled": true,
      "due_date_reminders": false,
      "routine_reminders": true
    },
    "default_priority": 4,
    "default_color": "green"
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z",
  "last_login": "2025-01-01T00:00:00Z"
}
```
- Status: 200 OK / 400 Bad Request / 401 Unauthorized  

---
## Lists Management Endpoints
### GET /lists/
**Purpose:** Retrieve all task lists belonging to the authenticated user  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "lists": [
    {
      "id": "uuid",
      "name": "Work Tasks",
      "description": "Professional tasks and projects",
      "color": "blue",
      "icon": "briefcase",
      "is_default": false,
      "sort_order": 1,
      "task_count": 5,
      "completed_task_count": 2,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Inbox",
      "description": "Uncategorized tasks",
      "color": "blue",
      "icon": "inbox",
      "is_default": true,
      "sort_order": 0,
      "task_count": 3,
      "completed_task_count": 0,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```
- Status: 200 OK / 401 Unauthorized  

### POST /lists/
**Purpose:** Create a new task list  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "name": "Personal Tasks",
  "description": "Personal and family tasks",
  "color": "green",
  "icon": "home",
  "sort_order": 2
}
```
**Response:**  
```json
{
  "id": "uuid",
  "name": "Personal Tasks",
  "description": "Personal and family tasks",
  "color": "green",
  "icon": "home",
  "is_default": false,
  "sort_order": 2,
  "task_count": 0,
  "completed_task_count": 0,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 201 Created / 400 Bad Request / 401 Unauthorized  

### GET /lists/{id}/
**Purpose:** Retrieve a specific task list by ID  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "id": "uuid",
  "name": "Work Tasks",
  "description": "Professional tasks and projects",
  "color": "blue",
  "icon": "briefcase",
  "is_default": false,
  "sort_order": 1,
  "task_count": 5,
  "completed_task_count": 2,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

### PUT /lists/{id}/
**Purpose:** Update an existing task list  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "name": "Work Projects",
  "description": "Updated description",
  "color": "purple",
  "icon": "briefcase",
  "sort_order": 1
}
```
**Response:**  
```json
{
  "id": "uuid",
  "name": "Work Projects",
  "description": "Updated description",
  "color": "purple",
  "icon": "briefcase",
  "is_default": false,
  "sort_order": 1,
  "task_count": 5,
  "completed_task_count": 2,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```
- Status: 200 OK / 400 Bad Request / 404 Not Found / 401 Unauthorized  

### DELETE /lists/{id}/
**Purpose:** Delete a task list (moves tasks to inbox)  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "message": "List deleted successfully. Tasks moved to inbox."
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

---
## Task Management Endpoints
### GET /tasks/
**Purpose:** Retrieve all tasks belonging to the authenticated user  
**Authentication:** Required (Bearer token)  
**Query Parameters:**  
- `list_id` (optional): Filter tasks by list ID
- `completed` (optional): Filter by completion status (true/false)
- `due_date` (optional): Filter by due date (YYYY-MM-DD)
- `color` (optional): Filter by color
- `priority` (optional): Filter by priority level (1-5)
- `search` (optional): Search in title and description
- `sort` (optional): Sort by field (created_at, due_date, priority, title)
- `order` (optional): Sort order (asc, desc)

**Response:**  
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete project proposal",
      "description": "Write and submit the Q1 project proposal",
      "due_date": "2025-01-15T17:00:00Z",
      "is_completed": false,
      "completed_at": null,
      "priority_level": 4,
      "color": "blue",
      "routine_type": "once",
      "sort_order": 1,
      "list_id": "uuid",
      "list": {
        "id": "uuid",
        "name": "Work Tasks",
        "color": "blue"
      },
      "subtasks": [
        {
          "id": "uuid",
          "title": "Research requirements",
          "is_completed": true,
          "sort_order": 1
        }
      ],
      "reminders": [
        {
          "id": "uuid",
          "reminder_type": "due_date",
          "reminder_datetime": "2025-01-15T16:00:00Z"
        }
      ],
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "count": 25,
    "next": null,
    "previous": null
  }
}
```
- Status: 200 OK / 401 Unauthorized  

### POST /tasks/
**Purpose:** Create a new task  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "title": "Complete project proposal",
  "description": "Write and submit the Q1 project proposal",
  "due_date": "2025-01-15T17:00:00Z",
  "priority_level": 4,
  "color": "blue",
  "routine_type": "once",
  "list_id": "uuid",
  "subtasks": [
    {
      "title": "Research requirements",
      "sort_order": 1
    },
    {
      "title": "Draft proposal",
      "sort_order": 2
    }
  ],
  "reminders": [
    {
      "reminder_type": "due_date",
      "reminder_datetime": "2025-01-15T16:00:00Z"
    }
  ]
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Complete project proposal",
  "description": "Write and submit the Q1 project proposal",
  "due_date": "2025-01-15T17:00:00Z",
  "is_completed": false,
  "completed_at": null,
  "priority_level": 4,
  "color": "blue",
  "routine_type": "once",
  "sort_order": 1,
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Work Tasks",
    "color": "blue"
  },
  "subtasks": [
    {
      "id": "uuid",
      "title": "Research requirements",
      "is_completed": false,
      "sort_order": 1
    },
    {
      "id": "uuid",
      "title": "Draft proposal",
      "is_completed": false,
      "sort_order": 2
    }
  ],
  "reminders": [
    {
      "id": "uuid",
      "reminder_type": "due_date",
      "reminder_datetime": "2025-01-15T16:00:00Z"
    }
  ],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 201 Created / 400 Bad Request / 401 Unauthorized  

### GET /tasks/{id}/
**Purpose:** Retrieve a specific task by ID  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "id": "uuid",
  "title": "Complete project proposal",
  "description": "Write and submit the Q1 project proposal",
  "due_date": "2025-01-15T17:00:00Z",
  "is_completed": false,
  "completed_at": null,
  "priority_level": 4,
  "color": "blue",
  "routine_type": "once",
  "sort_order": 1,
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Work Tasks",
    "color": "blue"
  },
  "subtasks": [
    {
      "id": "uuid",
      "title": "Research requirements",
      "is_completed": true,
      "completed_at": "2025-01-01T10:00:00Z",
      "sort_order": 1
    }
  ],
  "reminders": [
    {
      "id": "uuid",
      "reminder_type": "due_date",
      "reminder_datetime": "2025-01-15T16:00:00Z",
      "is_sent": false
    }
  ],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

### PUT /tasks/{id}/
**Purpose:** Update an existing task  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "title": "Complete project proposal - Updated",
  "description": "Write and submit the Q1 project proposal with new requirements",
  "due_date": "2025-01-16T17:00:00Z",
  "priority_level": 5,
  "color": "red",
  "is_completed": false,
  "list_id": "uuid"
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Complete project proposal - Updated",
  "description": "Write and submit the Q1 project proposal with new requirements",
  "due_date": "2025-01-16T17:00:00Z",
  "is_completed": false,
  "completed_at": null,
  "priority_level": 5,
  "color": "red",
  "routine_type": "once",
  "sort_order": 1,
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Work Tasks",
    "color": "blue"
  },
  "subtasks": [
    {
      "id": "uuid",
      "title": "Research requirements",
      "is_completed": true,
      "completed_at": "2025-01-01T10:00:00Z",
      "sort_order": 1
    }
  ],
  "reminders": [
    {
      "id": "uuid",
      "reminder_type": "due_date",
      "reminder_datetime": "2025-01-15T16:00:00Z",
      "is_sent": false
    }
  ],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```
- Status: 200 OK / 400 Bad Request / 404 Not Found / 401 Unauthorized  

### PATCH /tasks/{id}/complete/
**Purpose:** Mark a task as completed or incomplete  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "is_completed": true
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Complete project proposal",
  "description": "Write and submit the Q1 project proposal",
  "due_date": "2025-01-15T17:00:00Z",
  "is_completed": true,
  "completed_at": "2025-01-01T15:30:00Z",
  "priority_level": 4,
  "color": "blue",
  "routine_type": "once",
  "sort_order": 1,
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Work Tasks",
    "color": "blue"
  },
  "subtasks": [],
  "reminders": [],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T15:30:00Z"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

### DELETE /tasks/{id}/
**Purpose:** Delete a task (soft delete)  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "message": "Task deleted successfully"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

---
## Routines Management Endpoints (Enhanced Recurring Tasks)
### GET /routines/
**Purpose:** Retrieve all routines belonging to the authenticated user  
**Authentication:** Required (Bearer token)  
**Query Parameters:**  
- `active` (optional): Filter by active status (true/false)
- `routine_type` (optional): Filter by type (daily, weekly, monthly)
- `list_id` (optional): Filter by list ID

**Response:**  
```json
{
  "routines": [
    {
      "id": "uuid",
      "title": "Weekly team meeting",
      "description": "Attend weekly team standup",
      "routine_type": "weekly",
      "day_of_week": 1,
      "day_of_month": null,
      "time_of_day": "09:00:00",
      "is_active": true,
      "priority_level": 3,
      "color": "blue",
      "list_id": "uuid",
      "list": {
        "id": "uuid",
        "name": "Work Tasks",
        "color": "blue"
      },
      "last_generated": "2025-01-01T00:00:00Z",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```
- Status: 200 OK / 401 Unauthorized  

### POST /routines/
**Purpose:** Create a new routine  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "title": "Daily exercise",
  "description": "30 minutes of cardio exercise",
  "routine_type": "daily",
  "day_of_week": null,
  "day_of_month": null,
  "time_of_day": "07:00:00",
  "priority_level": 4,
  "color": "green",
  "list_id": "uuid"
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Daily exercise",
  "description": "30 minutes of cardio exercise",
  "routine_type": "daily",
  "day_of_week": null,
  "day_of_month": null,
  "time_of_day": "07:00:00",
  "is_active": true,
  "priority_level": 4,
  "color": "green",
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Personal Tasks",
    "color": "green"
  },
  "last_generated": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 201 Created / 400 Bad Request / 401 Unauthorized  

### GET /routines/{id}/
**Purpose:** Retrieve a specific routine by ID  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "id": "uuid",
  "title": "Weekly team meeting",
  "description": "Attend weekly team standup",
  "routine_type": "weekly",
  "day_of_week": 1,
  "day_of_month": null,
  "time_of_day": "09:00:00",
  "is_active": true,
  "priority_level": 3,
  "color": "blue",
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Work Tasks",
    "color": "blue"
  },
  "last_generated": "2025-01-01T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

### PUT /routines/{id}/
**Purpose:** Update an existing routine  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "title": "Weekly team standup",
  "description": "Attend weekly team standup meeting",
  "routine_type": "weekly",
  "day_of_week": 2,
  "time_of_day": "10:00:00",
  "is_active": true,
  "priority_level": 4,
  "color": "purple"
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Weekly team standup",
  "description": "Attend weekly team standup meeting",
  "routine_type": "weekly",
  "day_of_week": 2,
  "day_of_month": null,
  "time_of_day": "10:00:00",
  "is_active": true,
  "priority_level": 4,
  "color": "purple",
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Work Tasks",
    "color": "blue"
  },
  "last_generated": "2025-01-01T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```
- Status: 200 OK / 400 Bad Request / 404 Not Found / 401 Unauthorized  

### PATCH /routines/{id}/toggle/
**Purpose:** Toggle routine active status  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "is_active": false
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Weekly team meeting",
  "description": "Attend weekly team standup",
  "routine_type": "weekly",
  "day_of_week": 1,
  "day_of_month": null,
  "time_of_day": "09:00:00",
  "is_active": false,
  "priority_level": 3,
  "color": "blue",
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "Work Tasks",
    "color": "blue"
  },
  "last_generated": "2025-01-01T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

### DELETE /routines/{id}/
**Purpose:** Delete a routine (soft delete)  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "message": "Routine deleted successfully"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

---
## Subtasks Management Endpoints
### GET /tasks/{task_id}/subtasks/
**Purpose:** Retrieve all subtasks for a specific task  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "subtasks": [
    {
      "id": "uuid",
      "title": "Research requirements",
      "is_completed": true,
      "completed_at": "2025-01-01T10:00:00Z",
      "sort_order": 1,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z"
    },
    {
      "id": "uuid",
      "title": "Draft proposal",
      "is_completed": false,
      "completed_at": null,
      "sort_order": 2,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

### POST /tasks/{task_id}/subtasks/
**Purpose:** Create a new subtask for a specific task  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "title": "Review proposal",
  "sort_order": 3
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Review proposal",
  "is_completed": false,
  "completed_at": null,
  "sort_order": 3,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 201 Created / 400 Bad Request / 404 Not Found / 401 Unauthorized  

### PATCH /subtasks/{id}/complete/
**Purpose:** Mark a subtask as completed or incomplete  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "is_completed": true
}
```
**Response:**  
```json
{
  "id": "uuid",
  "title": "Research requirements",
  "is_completed": true,
  "completed_at": "2025-01-01T10:00:00Z",
  "sort_order": 1,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T10:00:00Z"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

### DELETE /subtasks/{id}/
**Purpose:** Delete a subtask  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "message": "Subtask deleted successfully"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

---
## Reminders Management Endpoints
### GET /reminders/
**Purpose:** Retrieve all reminders for the authenticated user  
**Authentication:** Required (Bearer token)  
**Query Parameters:**  
- `task_id` (optional): Filter by task ID
- `routine_id` (optional): Filter by routine ID
- `upcoming` (optional): Filter for upcoming reminders (true/false)

**Response:**  
```json
{
  "reminders": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "routine_id": null,
      "reminder_type": "due_date",
      "reminder_datetime": "2025-01-15T16:00:00Z",
      "is_sent": false,
      "sent_at": null,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```
- Status: 200 OK / 401 Unauthorized  

### POST /reminders/
**Purpose:** Create a new reminder  
**Authentication:** Required (Bearer token)  
**Request Body:**  
```json
{
  "task_id": "uuid",
  "reminder_type": "custom",
  "reminder_datetime": "2025-01-15T14:00:00Z"
}
```
**Response:**  
```json
{
  "id": "uuid",
  "task_id": "uuid",
  "routine_id": null,
  "reminder_type": "custom",
  "reminder_datetime": "2025-01-15T14:00:00Z",
  "is_sent": false,
  "sent_at": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```
- Status: 201 Created / 400 Bad Request / 401 Unauthorized  

### DELETE /reminders/{id}/
**Purpose:** Delete a reminder  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "message": "Reminder deleted successfully"
}
```
- Status: 200 OK / 404 Not Found / 401 Unauthorized  

---
## Calendar Endpoints
### GET /calendar/tasks/
**Purpose:** Retrieve tasks for a specific date range  
**Authentication:** Required (Bearer token)  
**Query Parameters:**  
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `list_id` (optional): Filter by list ID

**Response:**  
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Team meeting",
      "due_date": "2025-01-15T09:00:00Z",
      "is_completed": false,
      "priority_level": 3,
      "color": "blue",
      "list": {
        "id": "uuid",
        "name": "Work Tasks",
        "color": "blue"
      }
    }
  ],
  "date_range": {
    "start_date": "2025-01-15",
    "end_date": "2025-01-21"
  }
}
```
- Status: 200 OK / 400 Bad Request / 401 Unauthorized  

### GET /calendar/month/{year}/{month}/
**Purpose:** Retrieve tasks for a specific month  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "month": {
    "year": 2025,
    "month": 1,
    "days": {
      "15": [
        {
          "id": "uuid",
          "title": "Team meeting",
          "due_date": "2025-01-15T09:00:00Z",
          "is_completed": false,
          "priority_level": 3,
          "color": "blue"
        }
      ],
      "16": [],
      "17": [
        {
          "id": "uuid",
          "title": "Project deadline",
          "due_date": "2025-01-17T17:00:00Z",
          "is_completed": false,
          "priority_level": 5,
          "color": "red"
        }
      ]
    }
  }
}
```
- Status: 200 OK / 400 Bad Request / 401 Unauthorized  

### GET /calendar/today/
**Purpose:** Retrieve today's tasks  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
```json
{
  "date": "2025-01-15",
  "tasks": [
    {
      "id": "uuid",
      "title": "Team meeting",
      "due_date": "2025-01-15T09:00:00Z",
      "is_completed": false,
      "priority_level": 3,
      "color": "blue",
      "list": {
        "id": "uuid",
        "name": "Work Tasks",
        "color": "blue"
      }
    }
  ],
  "routines": [
    {
      "id": "uuid",
      "title": "Daily exercise",
      "routine_type": "daily",
      "time_of_day": "07:00:00",
      "priority_level": 4,
      "color": "green"
    }
  ]
}
```
- Status: 200 OK / 401 Unauthorized  

---
## Error Handling and Response Standards
### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### HTTP Status Codes
- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Invalid request data or parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid authentication but insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server-side errors

### Common Error Codes
- **VALIDATION_ERROR**: Input validation failed
- **AUTHENTICATION_REQUIRED**: Missing or invalid token
- **PERMISSION_DENIED**: Insufficient permissions
- **RESOURCE_NOT_FOUND**: Requested resource doesn't exist
- **DUPLICATE_RESOURCE**: Resource already exists
- **RATE_LIMIT_EXCEEDED**: Too many requests
- **SERVER_ERROR**: Internal server error

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **Bulk operations**: 10 requests per minute per user

### API Versioning
- **Current version**: v1
- **Version header**: `Accept: application/vnd.dailyflo.v1+json`
- **URL versioning**: `/api/v1/` prefix for all endpoints
- **Backward compatibility**: Maintained for at least 6 months

### Pagination
```json
{
  "results": [...],
  "pagination": {
    "count": 150,
    "next": "https://api.dailyflo.com/v1/tasks/?page=2",
    "previous": null,
    "page_size": 20,
    "current_page": 1,
    "total_pages": 8
  }
}
```

### Filtering and Sorting
- **Query parameters**: Use standard query parameter format
- **Date filtering**: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)
- **Sorting**: `?sort=field_name&order=asc|desc`
- **Multiple filters**: `?list_id=123&completed=false&priority=4`

### Data Validation
- **Required fields**: Clearly documented for each endpoint
- **Field types**: Strict type validation (string, integer, boolean, datetime)
- **Enum values**: Predefined values for color, priority, routine_type, etc.
- **String length**: Maximum lengths enforced for text fields
- **Date validation**: Future dates for due dates, valid date ranges

### Security Considerations
- **JWT tokens**: 15-minute access token, 7-day refresh token
- **HTTPS only**: All API communication over HTTPS
- **CORS**: Configured for mobile app domains only
- **Input sanitization**: All user input sanitized and validated
- **SQL injection**: Parameterized queries only
- **XSS protection**: Output encoding for all user-generated content

*Last updated: 10/09/2025*  

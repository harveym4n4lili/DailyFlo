# API Endpoints Planning Document
## API Design Principles
* RESTful architecture with clear resource-based URLs
* Consistent response formats across all endpoints
* HTTP status codes for proper error handling
* JSON communication for all requests and responses
* Stateless design using JWT authentication
* API versioning for future compatibility

---
## Authentication Endpoints
### POST /auth/register
**Purpose:** Create a new user account  
**Authentication:** None required  
**Request Body:**  
- Input: name, email, password  
**Response:**  
- Output: user info, auth tokens  
- Status: 201 Created / 400 Bad Request  
### POST /auth/login
**Purpose:** Authenticate existing user
**Authentication:** None required
**Request Body:** 
- Input: email, password
**Response:** 
- Output: user info, auth tokens
- Status: 200 OK / 401 Unauthorized
### POST /auth/refresh
**Purpose:** Get new access token using refresh token  
**Authentication:** None required  
**Request Body:**  
- Input: refresh token  
**Response:**  
- Output: new access token  
- Status: 200 OK / 401 Unauthorized  
### POST /auth/logout
**Purpose:** Invalidate user tokens  
**Authentication:** Required (Bearer token)  
**Request Body:**  
- Input: refresh token  
**Response:**  
- Output: logout confirmation  
- Status: 200 OK  

---
## User Management Endpoints
### GET /users/me
**Purpose:** Retrieve authenticated user's profile  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
- Output: user profile data  
- Status: 200 OK / 401 Unauthorized  
### PUT /users/me
**Purpose:** Update authenticated user's profile  
**Authentication:** Required (Bearer token)  
**Request Body:**  
- Input: name, email (optional fields)  
**Response:**  
- Output: updated user info  
- Status: 200 OK / 400 Bad Request / 401 Unauthorized  

---
## Task Management Endpoints
### GET /tasks/
**Purpose:** Retrieve all tasks belonging to the authenticated user  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
- Output: list of tasks  
- Status: 200 OK / 401 Unauthorized  
### POST /tasks/
**Purpose:**
**Purpose:** Create a new task  
**Authentication:** Required (Bearer token)  
**Request Body:**  
- Input: title, description, status, priority, due_date, etc.  
**Response:**  
- Output: created task  
- Status: 201 Created / 400 Bad Request / 401 Unauthorized  
### GET /tasks/{id}/#
**Purpose:** Retrieve a specific task by ID  
**Authentication:** Required (Bearer token)  
**Request Body:** None  
**Response:**  
- Output: task details  
- Status: 200 OK / 404 Not Found / 401 Unauthorized 
### PUT /tasks/{id}/
**Purpose:** Update an existing task  
**Authentication:** Required (Bearer token)  
**Request Body:**  
- Input: any updatable task fields (e.g., title, status, due_date)  
**Response:**  
- Output: updated task  
- Status: 200 OK / 400 Bad Request / 404 Not Found / 401 Unauthorized  

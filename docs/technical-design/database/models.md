# Database Planning Document
## Core Database Design Principles
1. **User Data Isolation:** All task data is strictly separated by user
2. **Soft Deletes:** Mark records as deleted rather than permanent deletion
3. **Audit Trail:** Track creation and modification timestamps on all entities
4. **Normalization:** Reduce data redundancy while maintaining query performance
5. **Flexibility**: Use JSON fields for extensible metadata
---
## Detailed Table Schemas
### Users Table
```
USERS
- id (primary key)
- email (unqiue, required)
- password (hashed, required)
- first_name (optional)
- last_name (optional)
- timestamps (created, updated)
- soft_delete flag
```
---
### Task Table
```
TASKS
- id (primary key)
- user_ID (foreign key to user)
- recurring_task_id (optional foreign key to recurring task)
- title (required, short text)
- description (optional, long text)
- due_date (optional date)
- is_completed (boolean)
- priority_level (1-5 scale)
- timestamps (created, updated, completed)
- metadata (JSON)
- soft_delete flag
```
#### Extra notes on fields
* `recurring_task_id`: Link to recurring task template (nullable)
* `metadata`: JSON field for future extensibility (tags, notes, etc.)
---
### Recurring Task Table
```
RECURRINGTASKS
- id (primary key)
- user_ID (foreign key to user)
- title (required, short text)
- description (optional, long text)
- day_of_week (0-6)
- due_date (optional date)
- is_active (boolean)
- priority_level (1-5 scale)
- timestamps (created, updated, completed)
- metadata (JSON)
- soft_delete flag
```
#### Extra notes on fields
* `day_of_week`: Integer 0-6 (0=Sunday, 6=Saturday)
* `is_active`: Allow users to pause recurring tasks without deletion
* `metadata`: JSON field for future extensibility (tags, notes, etc.)
---
## Entity Relationship Diagram
![alt text](<ER Diagram.drawio.png>)
---
## Data Relationships
### User → Tasks (One-to-Many)
* Each user can have multiple tasks
* Tasks are deleted when user is deleted (CASCADE)
* All task queries filtered by user_id for data isolation
### RecurringTask → Tasks (One-to-Many)
* Recurring tasks can generate multiple task instances
* Tasks can optionally link back to their recurring template
* SET NULL on recurring task deletion to preserve historical tasks
### User → RecurringTasks (One-to-Many)
* Each user can create multiple recurring task templates
* Recurring tasks deleted when user is deleted (CASCADE)
# Database Planning Document
## Core Database Design Principles
1. **User Data Isolation:** All task data is strictly separated by user
2. **Soft Deletes:** Mark records as deleted rather than permanent deletion
3. **Audit Trail:** Track creation and modification timestamps on all entities
4. **Normalization:** Reduce data redundancy while maintaining query performance
5. **Flexibility**: Use JSON fields for extensible metadata
6. **Color Coding:** Support for visual task organization with predefined color schemes
7. **Hierarchical Organization:** Support for task lists, subtasks, and categorization
8. **Social Authentication:** Support for multiple authentication providers
9. **Notification Support:** Built-in support for task reminders and notifications
10. **Routine Management:** Enhanced recurring task patterns beyond weekly
---
## Detailed Table Schemas
### Users Table
```
USERS
- id (primary key)
- email (unique, required)
- password (hashed, optional for social auth)
- first_name (optional)
- last_name (optional)
- avatar_url (optional)
- auth_provider (enum: 'email', 'facebook', 'google', 'apple')
- auth_provider_id (optional, for social auth)
- is_email_verified (boolean, default false)
- preferences (JSON) - app settings, theme, notifications
- timestamps (created, updated, last_login)
- soft_delete flag
```
---
### Lists Table
```
LISTS
- id (primary key)
- user_id (foreign key to users)
- name (required, short text)
- description (optional, long text)
- color (required, enum: 'red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange')
- icon (optional, string for icon identifier)
- is_default (boolean, default false) - for inbox/uncategorized
- sort_order (integer, for custom ordering)
- timestamps (created, updated)
- metadata (JSON) - future extensibility
- soft_delete flag
```
#### Extra notes on fields
* `color`: Predefined color scheme matching wireframe designs
* `is_default`: Special flag for inbox/uncategorized tasks
* `sort_order`: Allows users to customize list ordering
* `metadata`: JSON field for future features (tags, sharing, etc.)
---
### Task Table
```
TASKS
- id (primary key)
- user_id (foreign key to users)
- list_id (foreign key to lists, nullable for inbox)
- recurring_task_id (optional foreign key to recurring tasks)
- title (required, short text)
- description (optional, long text)
- due_date (optional datetime)
- is_completed (boolean, default false)
- completed_at (optional datetime)
- priority_level (1-5 scale, default 3)
- color (enum: 'red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange')
- routine_type (enum: 'once', 'daily', 'weekly', 'monthly', default 'once')
- sort_order (integer, for custom ordering within list)
- timestamps (created, updated)
- metadata (JSON) - subtasks, notes, attachments
- soft_delete flag
```
#### Extra notes on fields
* `list_id`: Links task to a specific list (nullable for inbox/uncategorized)
* `recurring_task_id`: Link to recurring task template (nullable)
* `color`: Visual organization matching wireframe color scheme
* `routine_type`: Enhanced recurring patterns beyond weekly
* `sort_order`: Allows custom task ordering within lists
* `metadata`: JSON field for subtasks, notes, and future extensibility
---
### Routines Table (Enhanced Recurring Tasks)
```
ROUTINES
- id (primary key)
- user_id (foreign key to users)
- list_id (foreign key to lists, nullable)
- title (required, short text)
- description (optional, long text)
- routine_type (enum: 'daily', 'weekly', 'monthly')
- day_of_week (0-6, for weekly routines)
- day_of_month (1-31, for monthly routines)
- time_of_day (optional time, for scheduled routines)
- is_active (boolean, default true)
- priority_level (1-5 scale, default 3)
- color (enum: 'red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange')
- last_generated (datetime, tracks last task generation)
- timestamps (created, updated)
- metadata (JSON) - subtasks, notes, reminders
- soft_delete flag
```
#### Extra notes on fields
* `routine_type`: Enhanced patterns (daily, weekly, monthly)
* `day_of_week`: Integer 0-6 (0=Sunday, 6=Saturday) for weekly routines
* `day_of_month`: Integer 1-31 for monthly routines
* `time_of_day`: Optional time for scheduled routine generation
* `is_active`: Allow users to pause routines without deletion
* `last_generated`: Tracks when routine last generated a task instance
* `metadata`: JSON field for subtasks, notes, and reminders
---
### Subtasks Table
```
SUBTASKS
- id (primary key)
- task_id (foreign key to tasks)
- title (required, short text)
- is_completed (boolean, default false)
- completed_at (optional datetime)
- sort_order (integer, for custom ordering)
- timestamps (created, updated)
- soft_delete flag
```
#### Extra notes on fields
* `task_id`: Links subtask to parent task
* `sort_order`: Allows custom subtask ordering
* `is_completed`: Independent completion tracking
---
### Reminders Table
```
REMINDERS
- id (primary key)
- task_id (foreign key to tasks, nullable)
- routine_id (foreign key to routines, nullable)
- user_id (foreign key to users)
- reminder_type (enum: 'due_date', 'custom', 'routine')
- reminder_datetime (datetime)
- is_sent (boolean, default false)
- sent_at (optional datetime)
- timestamps (created, updated)
- soft_delete flag
```
#### Extra notes on fields
* `task_id` or `routine_id`: Links reminder to specific task or routine
* `reminder_type`: Different types of reminders (due date, custom, routine-based)
* `reminder_datetime`: When the reminder should be sent
* `is_sent`: Tracks if reminder has been sent
---
## Entity Relationship Diagram
![alt text](<ER Diagram.drawio.png>)
---
## Data Relationships
### User → Lists (One-to-Many)
* Each user can have multiple task lists
* Lists are deleted when user is deleted (CASCADE)
* All list queries filtered by user_id for data isolation
* One default list (inbox) created per user

### User → Tasks (One-to-Many)
* Each user can have multiple tasks
* Tasks are deleted when user is deleted (CASCADE)
* All task queries filtered by user_id for data isolation

### User → Routines (One-to-Many)
* Each user can create multiple routine templates
* Routines are deleted when user is deleted (CASCADE)
* All routine queries filtered by user_id for data isolation

### List → Tasks (One-to-Many)
* Each list can contain multiple tasks
* Tasks can be moved between lists
* SET NULL on list deletion to move tasks to inbox
* Tasks can exist without a list (inbox/uncategorized)

### Routine → Tasks (One-to-Many)
* Routines can generate multiple task instances
* Tasks can optionally link back to their routine template
* SET NULL on routine deletion to preserve historical tasks

### Task → Subtasks (One-to-Many)
* Each task can have multiple subtasks
* Subtasks are deleted when parent task is deleted (CASCADE)
* Subtasks inherit user_id from parent task

### Task → Reminders (One-to-Many)
* Each task can have multiple reminders
* Reminders are deleted when task is deleted (CASCADE)
* Reminders inherit user_id from parent task

### Routine → Reminders (One-to-Many)
* Each routine can have multiple reminders
* Reminders are deleted when routine is deleted (CASCADE)
* Reminders inherit user_id from parent routine

---
## Database Indexes and Constraints
### Performance Indexes
```sql
-- User-based queries (most common)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_routines_user_id ON routines(user_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);

-- Task organization queries
CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(is_completed);
CREATE INDEX idx_tasks_priority ON tasks(priority_level);

-- Routine generation queries
CREATE INDEX idx_routines_active ON routines(is_active);
CREATE INDEX idx_routines_type ON routines(routine_type);
CREATE INDEX idx_routines_last_generated ON routines(last_generated);

-- Reminder queries
CREATE INDEX idx_reminders_datetime ON reminders(reminder_datetime);
CREATE INDEX idx_reminders_sent ON reminders(is_sent);

-- Subtask queries
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_subtasks_completed ON subtasks(is_completed);
```

### Unique Constraints
```sql
-- Ensure unique email per user
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Ensure unique social auth provider per user
ALTER TABLE users ADD CONSTRAINT unique_social_auth 
UNIQUE (auth_provider, auth_provider_id);

-- Ensure unique list names per user
ALTER TABLE lists ADD CONSTRAINT unique_list_name_per_user 
UNIQUE (user_id, name);
```

### Foreign Key Constraints
```sql
-- Users table constraints
ALTER TABLE lists ADD CONSTRAINT fk_lists_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE routines ADD CONSTRAINT fk_routines_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Lists table constraints
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_list_id 
FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL;

ALTER TABLE routines ADD CONSTRAINT fk_routines_list_id 
FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL;

-- Tasks table constraints
ALTER TABLE subtasks ADD CONSTRAINT fk_subtasks_task_id 
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE reminders ADD CONSTRAINT fk_reminders_task_id 
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Routines table constraints
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_routine_id 
FOREIGN KEY (recurring_task_id) REFERENCES routines(id) ON DELETE SET NULL;

ALTER TABLE reminders ADD CONSTRAINT fk_reminders_routine_id 
FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE;
```

---
## Data Validation Rules
### Business Logic Constraints
1. **Color Validation**: All color fields must use predefined enum values
2. **Priority Validation**: Priority levels must be between 1-5
3. **Date Validation**: Due dates cannot be in the past for new tasks
4. **Routine Validation**: Day of week must be 0-6, day of month must be 1-31
5. **User Isolation**: All queries must filter by user_id for data security
6. **Soft Delete**: Deleted records are marked, not physically removed
7. **Default List**: Each user must have exactly one default list (inbox)
8. **Routine Generation**: Routines can only generate tasks for future dates

---
## Data Migration and Seeding
### Initial Data Setup
```sql
-- Create default inbox list for existing users
INSERT INTO lists (user_id, name, description, color, is_default, sort_order)
SELECT id, 'Inbox', 'Uncategorized tasks', 'blue', true, 0
FROM users WHERE id NOT IN (SELECT user_id FROM lists WHERE is_default = true);

-- Migrate existing tasks to inbox list
UPDATE tasks 
SET list_id = (SELECT id FROM lists WHERE user_id = tasks.user_id AND is_default = true)
WHERE list_id IS NULL;
```

### Sample Data for Development
```sql
-- Sample user preferences
UPDATE users SET preferences = '{
  "theme": "light",
  "notifications": {
    "enabled": true,
    "due_date_reminders": true,
    "routine_reminders": true
  },
  "default_priority": 3,
  "default_color": "blue"
}' WHERE preferences IS NULL;

-- Sample task metadata
UPDATE tasks SET metadata = '{
  "subtasks": [],
  "notes": "",
  "tags": []
}' WHERE metadata IS NULL;
```

### Data Archival Strategy
```sql
-- Archive completed tasks older than 1 year
UPDATE tasks 
SET soft_delete = true 
WHERE is_completed = true 
AND completed_at < NOW() - INTERVAL '1 year';

-- Archive old reminders
UPDATE reminders 
SET soft_delete = true 
WHERE is_sent = true 
AND sent_at < NOW() - INTERVAL '6 months';
```

---
## API Data Transfer Objects (DTOs)
### Task DTO Structure
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "due_date": "datetime",
  "is_completed": "boolean",
  "completed_at": "datetime",
  "priority_level": "integer (1-5)",
  "color": "enum",
  "routine_type": "enum",
  "list_id": "uuid",
  "list": {
    "id": "uuid",
    "name": "string",
    "color": "enum"
  },
  "subtasks": [
    {
      "id": "uuid",
      "title": "string",
      "is_completed": "boolean",
      "sort_order": "integer"
    }
  ],
  "reminders": [
    {
      "id": "uuid",
      "reminder_type": "enum",
      "reminder_datetime": "datetime"
    }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### List DTO Structure
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "color": "enum",
  "icon": "string",
  "is_default": "boolean",
  "sort_order": "integer",
  "task_count": "integer",
  "completed_task_count": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Routine DTO Structure
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "routine_type": "enum",
  "day_of_week": "integer",
  "day_of_month": "integer",
  "time_of_day": "time",
  "is_active": "boolean",
  "priority_level": "integer",
  "color": "enum",
  "list_id": "uuid",
  "last_generated": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

*Last updated: 10/09/2025*
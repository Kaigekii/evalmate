# EvalMate - Complete Database Schema Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Entity-Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
3. [Table Definitions](#table-definitions)
4. [Relationships and Constraints](#relationships-and-constraints)
5. [Security Considerations](#security-considerations)
6. [Indexes and Performance](#indexes-and-performance)
7. [Data Dictionary](#data-dictionary)

---

## Overview

**Database Type:** PostgreSQL (Supabase)  
**Framework:** Django 5.2.7  
**ORM:** Django ORM

The EvalMate database is designed to support a peer evaluation system for educational institutions, enabling faculty members to create evaluation forms and students to complete evaluations for their peers.

### Core Entities
- **Users & Profiles** - Authentication and user information
- **Evaluations** - Evaluation forms created by faculty
- **Questions** - Individual questions within evaluations
- **Responses** - Student submissions to evaluations
- **Teams** - Student team/group management

---

## Entity-Relationship Diagram (ERD)

```
┌─────────────────────┐
│   auth_user         │
│ (Django Built-in)   │
├─────────────────────┤
│ PK  id              │
│     username        │
│     email           │
│     password        │
│     first_name      │
│     last_name       │
│     is_active       │
│     is_staff        │
│     is_superuser    │
│     date_joined     │
│     last_login      │
└──────────┬──────────┘
           │ 1:1
           │
           ▼
┌─────────────────────┐
│   Profile           │
├─────────────────────┤
│ PK  id              │
│ FK  user_id         │──┐
│     account_type    │  │ (student/faculty)
│     first_name      │  │
│     last_name       │  │
│     email           │  │
│     student_id      │  │
│     phone_number    │  │
│     institution     │  │
│     department      │  │
│     major           │  │ (to be added)
│     academic_year   │  │ (to be added)
│     expected_grad   │  │ (to be added)
│     current_gpa     │  │ (to be added)
│     date_of_birth   │  │ (to be added)
│     profile_picture │  │ (to be added)
│     created_at      │  │ (to be added)
│     updated_at      │  │ (to be added)
└──────────┬──────────┘  │
           │             │
    Faculty│     Student │
           │             │
           ▼             ▼
┌─────────────────────┐ ┌─────────────────────┐
│   Evaluation        │ │   Team              │
├─────────────────────┤ ├─────────────────────┤
│ PK  id              │ │ PK  id              │
│ FK  created_by_id   │ │ FK  course_id       │
│ FK  course_id       │ │     name            │
│     title           │ │     description     │
│     description     │ │     created_at      │
│     passcode        │ │     updated_at      │
│     start_date      │ └──────────┬──────────┘
│     end_date        │            │ M:N
│     time_limit      │            │
│     status          │ ┌──────────┴──────────┐
│     color_theme     │ │  TeamMember         │
│     created_at      │ ├─────────────────────┤
│     updated_at      │ │ PK  id              │
└──────────┬──────────┘ │ FK  team_id         │
           │ 1:M        │ FK  student_id      │
           │            │     role            │
           ▼            │     joined_at       │
┌─────────────────────┐ └─────────────────────┘
│   Section           │
├─────────────────────┤            ┌─────────────────────┐
│ PK  id              │            │   Course            │
│ FK  evaluation_id   │            ├─────────────────────┤
│     title           │            │ PK  id              │
│     order           │            │ FK  instructor_id   │
│     created_at      │            │     code            │
└──────────┬──────────┘            │     name            │
           │ 1:M                   │     semester        │
           │                       │     year            │
           ▼                       │     created_at      │
┌─────────────────────┐            │     updated_at      │
│   Question          │            └─────────────────────┘
├─────────────────────┤
│ PK  id              │
│ FK  section_id      │
│ FK  evaluation_id   │
│     question_text   │
│     question_type   │
│     is_required     │
│     order           │
│     options         │ (JSON)
│     created_at      │
└──────────┬──────────┘
           │ 1:M
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Response          │         │   Answer            │
├─────────────────────┤         ├─────────────────────┤
│ PK  id              │ 1:M     │ PK  id              │
│ FK  evaluation_id   │────────▶│ FK  response_id     │
│ FK  student_id      │         │ FK  question_id     │
│ FK  evaluated_peer_id│        │     answer_value    │ (JSON)
│     status          │         │     created_at      │
│     started_at      │         └─────────────────────┘
│     submitted_at    │
│     time_spent      │
└─────────────────────┘

┌─────────────────────┐
│   Notification      │
├─────────────────────┤
│ PK  id              │
│ FK  user_id         │
│     type            │
│     title           │
│     message         │
│     is_read         │
│     related_object_type │
│     related_object_id   │
│     created_at      │
└─────────────────────┘

┌─────────────────────┐
│   EvaluationSettings│
├─────────────────────┤
│ PK  id              │
│ FK  evaluation_id   │ (1:1)
│     allow_anonymous │
│     show_results    │
│     allow_comments  │
│     randomize_questions │
│     require_all_responses │
│     notification_settings │ (JSON)
└─────────────────────┘
```

---

## Table Definitions

### 1. **auth_user** (Django Built-in)
**Purpose:** Core authentication table managed by Django

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| username | VARCHAR(150) | UNIQUE, NOT NULL | Unique username |
| email | VARCHAR(254) | NOT NULL | User email |
| password | VARCHAR(128) | NOT NULL | Hashed password |
| first_name | VARCHAR(150) | | First name |
| last_name | VARCHAR(150) | | Last name |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| is_staff | BOOLEAN | DEFAULT FALSE | Staff access |
| is_superuser | BOOLEAN | DEFAULT FALSE | Admin access |
| date_joined | TIMESTAMP | NOT NULL | Registration date |
| last_login | TIMESTAMP | | Last login timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (username)
- INDEX (email)

---

### 2. **EvalMateApp_profile**
**Purpose:** Extended user profile for students and faculty

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| user_id | INTEGER | FK→auth_user.id, UNIQUE, NOT NULL | One-to-one with User |
| account_type | VARCHAR(10) | NOT NULL | 'student' or 'faculty' |
| first_name | VARCHAR(30) | NOT NULL | User's first name |
| last_name | VARCHAR(30) | NOT NULL | User's last name |
| email | VARCHAR(254) | NOT NULL | Contact email |
| student_id | VARCHAR(20) | | Student ID number (students only) |
| phone_number | VARCHAR(15) | | Contact phone number |
| institution | VARCHAR(100) | NOT NULL | Educational institution |
| department | VARCHAR(100) | NOT NULL | Academic department |
| major | VARCHAR(100) | | Major/Program (students) |
| academic_year | VARCHAR(20) | | e.g., "Junior", "Senior" |
| expected_graduation | DATE | | Expected graduation date |
| current_gpa | DECIMAL(3,2) | CHECK (gpa >= 0 AND gpa <= 5.0) | Current GPA |
| date_of_birth | DATE | | Date of birth |
| profile_picture | VARCHAR(255) | | Path to profile image |
| bio | TEXT | | Short biography |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Profile creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (user_id)
- INDEX (account_type)
- INDEX (institution, department)
- INDEX (student_id) WHERE student_id IS NOT NULL

**Constraints:**
- FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
- CHECK (account_type IN ('student', 'faculty'))

---

### 3. **EvalMateApp_course**
**Purpose:** Course/subject management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| instructor_id | INTEGER | FK→Profile.id, NOT NULL | Faculty instructor |
| code | VARCHAR(20) | NOT NULL | Course code (e.g., "CS101") |
| name | VARCHAR(200) | NOT NULL | Course name |
| description | TEXT | | Course description |
| semester | VARCHAR(20) | NOT NULL | e.g., "Fall", "Spring" |
| year | INTEGER | NOT NULL | Academic year |
| institution | VARCHAR(100) | NOT NULL | Institution name |
| department | VARCHAR(100) | NOT NULL | Department name |
| is_active | BOOLEAN | DEFAULT TRUE | Course active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (instructor_id)
- INDEX (code, semester, year)
- INDEX (institution, department)

**Constraints:**
- FOREIGN KEY (instructor_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE
- CHECK (year >= 2000 AND year <= 2100)

---

### 4. **EvalMateApp_team**
**Purpose:** Student teams/groups for evaluations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| course_id | INTEGER | FK→Course.id, NOT NULL | Associated course |
| name | VARCHAR(100) | NOT NULL | Team name |
| description | TEXT | | Team description |
| created_by_id | INTEGER | FK→Profile.id | Team creator |
| is_active | BOOLEAN | DEFAULT TRUE | Team active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (course_id)
- INDEX (created_by_id)

**Constraints:**
- FOREIGN KEY (course_id) REFERENCES EvalMateApp_course(id) ON DELETE CASCADE
- FOREIGN KEY (created_by_id) REFERENCES EvalMateApp_profile(id) ON DELETE SET NULL

---

### 5. **EvalMateApp_teammember**
**Purpose:** Many-to-many relationship between teams and students

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| team_id | INTEGER | FK→Team.id, NOT NULL | Team reference |
| student_id | INTEGER | FK→Profile.id, NOT NULL | Student reference |
| role | VARCHAR(50) | DEFAULT 'member' | Role in team |
| joined_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Join date |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (team_id, student_id)
- INDEX (student_id)

**Constraints:**
- FOREIGN KEY (team_id) REFERENCES EvalMateApp_team(id) ON DELETE CASCADE
- FOREIGN KEY (student_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE
- CHECK (role IN ('leader', 'member'))

---

### 6. **EvalMateApp_evaluation**
**Purpose:** Evaluation forms created by faculty

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| created_by_id | INTEGER | FK→Profile.id, NOT NULL | Faculty creator |
| course_id | INTEGER | FK→Course.id, NOT NULL | Associated course |
| team_id | INTEGER | FK→Team.id | Specific team (optional) |
| title | VARCHAR(200) | NOT NULL | Evaluation title |
| description | TEXT | | Evaluation description |
| instructions | TEXT | | Instructions for students |
| passcode | VARCHAR(50) | | Access passcode (optional) |
| start_date | TIMESTAMP | NOT NULL | When evaluation opens |
| end_date | TIMESTAMP | NOT NULL | When evaluation closes |
| due_date | TIMESTAMP | | Specific due date |
| time_limit | INTEGER | | Time limit in minutes |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | Current status |
| color_theme | VARCHAR(7) | DEFAULT '#2D3A52' | Theme color (hex) |
| is_anonymous | BOOLEAN | DEFAULT TRUE | Anonymous responses |
| show_results | BOOLEAN | DEFAULT FALSE | Show results to students |
| allow_late_submission | BOOLEAN | DEFAULT FALSE | Allow after deadline |
| max_submissions | INTEGER | DEFAULT 1 | Maximum submissions allowed |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |
| published_at | TIMESTAMP | | Publication timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (created_by_id)
- INDEX (course_id)
- INDEX (team_id)
- INDEX (status)
- INDEX (start_date, end_date)

**Constraints:**
- FOREIGN KEY (created_by_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE
- FOREIGN KEY (course_id) REFERENCES EvalMateApp_course(id) ON DELETE CASCADE
- FOREIGN KEY (team_id) REFERENCES EvalMateApp_team(id) ON DELETE SET NULL
- CHECK (status IN ('draft', 'published', 'active', 'closed', 'archived'))
- CHECK (end_date > start_date)
- CHECK (time_limit > 0 OR time_limit IS NULL)

---

### 7. **EvalMateApp_section**
**Purpose:** Sections/categories within an evaluation form

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| evaluation_id | INTEGER | FK→Evaluation.id, NOT NULL | Parent evaluation |
| title | VARCHAR(200) | NOT NULL | Section title |
| description | TEXT | | Section description |
| order | INTEGER | NOT NULL | Display order |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (evaluation_id, order)

**Constraints:**
- FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE
- CHECK (order >= 0)

---

### 8. **EvalMateApp_question**
**Purpose:** Individual questions within evaluation forms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| evaluation_id | INTEGER | FK→Evaluation.id, NOT NULL | Parent evaluation |
| section_id | INTEGER | FK→Section.id | Parent section (optional) |
| question_text | TEXT | NOT NULL | Question text |
| question_type | VARCHAR(20) | NOT NULL | Question type |
| is_required | BOOLEAN | DEFAULT TRUE | Required to answer |
| order | INTEGER | NOT NULL | Display order |
| options | JSONB | | Question-specific options |
| validation_rules | JSONB | | Validation rules |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Question Types:**
- `rating` - Rating scale (1-10)
- `text` - Long text response
- `multiple` - Multiple choice (single select)
- `checkbox` - Multiple choice (multi-select)
- `slider` - Slider input
- `likert` - Likert scale

**Options JSON Structure:**
```json
{
  "rating": {
    "min": 1,
    "max": 10,
    "labels": ["Poor", "Excellent"]
  },
  "multiple": {
    "choices": ["Option 1", "Option 2", "Option 3"]
  },
  "checkbox": {
    "choices": ["Choice 1", "Choice 2"],
    "min_selections": 1,
    "max_selections": 3
  },
  "slider": {
    "min": 0,
    "max": 100,
    "step": 5,
    "labels": ["Low", "High"]
  },
  "text": {
    "max_length": 500,
    "min_length": 10
  }
}
```

**Indexes:**
- PRIMARY KEY (id)
- INDEX (evaluation_id, order)
- INDEX (section_id, order)
- INDEX (question_type)

**Constraints:**
- FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE
- FOREIGN KEY (section_id) REFERENCES EvalMateApp_section(id) ON DELETE CASCADE
- CHECK (question_type IN ('rating', 'text', 'multiple', 'checkbox', 'slider', 'likert'))
- CHECK (order >= 0)

---

### 9. **EvalMateApp_response**
**Purpose:** Student responses/submissions to evaluations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| evaluation_id | INTEGER | FK→Evaluation.id, NOT NULL | Evaluation being answered |
| student_id | INTEGER | FK→Profile.id, NOT NULL | Student submitting |
| evaluated_peer_id | INTEGER | FK→Profile.id | Peer being evaluated |
| team_id | INTEGER | FK→Team.id | Team context |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'in_progress' | Response status |
| started_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When started |
| submitted_at | TIMESTAMP | | When submitted |
| time_spent | INTEGER | | Time spent in seconds |
| ip_address | INET | | Submission IP address |
| user_agent | TEXT | | Browser user agent |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (evaluation_id)
- INDEX (student_id)
- INDEX (evaluated_peer_id)
- INDEX (team_id)
- INDEX (status)
- UNIQUE INDEX (evaluation_id, student_id, evaluated_peer_id) WHERE status = 'submitted'

**Constraints:**
- FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE
- FOREIGN KEY (student_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE
- FOREIGN KEY (evaluated_peer_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE
- FOREIGN KEY (team_id) REFERENCES EvalMateApp_team(id) ON DELETE SET NULL
- CHECK (status IN ('in_progress', 'submitted', 'late', 'incomplete'))
- CHECK (submitted_at IS NULL OR submitted_at >= started_at)

---

### 10. **EvalMateApp_answer**
**Purpose:** Individual answers to specific questions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| response_id | INTEGER | FK→Response.id, NOT NULL | Parent response |
| question_id | INTEGER | FK→Question.id, NOT NULL | Question answered |
| answer_value | JSONB | NOT NULL | Answer data |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Answer timestamp |

**Answer Value JSON Structure:**
```json
{
  "rating": {
    "value": 8,
    "comment": "Optional comment"
  },
  "text": {
    "value": "Long text response here..."
  },
  "multiple": {
    "selected": "Option 2"
  },
  "checkbox": {
    "selected": ["Choice 1", "Choice 3"]
  },
  "slider": {
    "value": 75
  }
}
```

**Indexes:**
- PRIMARY KEY (id)
- INDEX (response_id)
- INDEX (question_id)
- UNIQUE INDEX (response_id, question_id)

**Constraints:**
- FOREIGN KEY (response_id) REFERENCES EvalMateApp_response(id) ON DELETE CASCADE
- FOREIGN KEY (question_id) REFERENCES EvalMateApp_question(id) ON DELETE CASCADE

---

### 11. **EvalMateApp_notification**
**Purpose:** User notifications for various events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| user_id | INTEGER | FK→auth_user.id, NOT NULL | Recipient user |
| type | VARCHAR(50) | NOT NULL | Notification type |
| title | VARCHAR(200) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| related_object_type | VARCHAR(50) | | Related model type |
| related_object_id | INTEGER | | Related object ID |
| action_url | VARCHAR(500) | | Action link |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| read_at | TIMESTAMP | | When marked as read |

**Notification Types:**
- `evaluation_assigned` - New evaluation available
- `evaluation_due_soon` - Evaluation deadline approaching
- `evaluation_overdue` - Missed deadline
- `evaluation_submitted` - Submission confirmation
- `results_available` - Results published
- `team_invitation` - Invited to team
- `system_announcement` - System-wide message

**Indexes:**
- PRIMARY KEY (id)
- INDEX (user_id, is_read)
- INDEX (created_at DESC)
- INDEX (type)

**Constraints:**
- FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
- CHECK (type IN ('evaluation_assigned', 'evaluation_due_soon', 'evaluation_overdue', 
                  'evaluation_submitted', 'results_available', 'team_invitation', 
                  'system_announcement'))

---

### 12. **EvalMateApp_evaluationsettings**
**Purpose:** Additional settings for evaluations (1:1 with Evaluation)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Primary key |
| evaluation_id | INTEGER | FK→Evaluation.id, UNIQUE, NOT NULL | Parent evaluation |
| allow_anonymous | BOOLEAN | DEFAULT TRUE | Anonymous responses |
| show_results | BOOLEAN | DEFAULT FALSE | Show results to students |
| allow_comments | BOOLEAN | DEFAULT TRUE | Allow text comments |
| randomize_questions | BOOLEAN | DEFAULT FALSE | Randomize question order |
| require_all_responses | BOOLEAN | DEFAULT TRUE | All questions required |
| send_reminders | BOOLEAN | DEFAULT TRUE | Send deadline reminders |
| reminder_days_before | INTEGER | DEFAULT 2 | Days before due date |
| notification_settings | JSONB | | Custom notification rules |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (evaluation_id)

**Constraints:**
- FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE
- CHECK (reminder_days_before >= 0)

---

### 13. **django_session** (Django Built-in)
**Purpose:** Session management for authenticated users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| session_key | VARCHAR(40) | PK | Session identifier |
| session_data | TEXT | NOT NULL | Encrypted session data |
| expire_date | TIMESTAMP | NOT NULL | Session expiration |

**Indexes:**
- PRIMARY KEY (session_key)
- INDEX (expire_date)

---

## Relationships and Constraints

### One-to-One Relationships
1. **auth_user ↔ EvalMateApp_profile**
   - Each user has exactly one profile
   - CASCADE delete: Deleting user deletes profile

2. **EvalMateApp_evaluation ↔ EvalMateApp_evaluationsettings**
   - Each evaluation has one settings record
   - CASCADE delete: Deleting evaluation deletes settings

### One-to-Many Relationships
1. **EvalMateApp_profile → EvalMateApp_course**
   - One faculty can create multiple courses
   - CASCADE delete: Deleting faculty deletes their courses

2. **EvalMateApp_course → EvalMateApp_evaluation**
   - One course can have multiple evaluations
   - CASCADE delete: Deleting course deletes evaluations

3. **EvalMateApp_course → EvalMateApp_team**
   - One course can have multiple teams
   - CASCADE delete: Deleting course deletes teams

4. **EvalMateApp_evaluation → EvalMateApp_section**
   - One evaluation contains multiple sections
   - CASCADE delete: Deleting evaluation deletes sections

5. **EvalMateApp_evaluation → EvalMateApp_question**
   - One evaluation contains multiple questions
   - CASCADE delete: Deleting evaluation deletes questions

6. **EvalMateApp_section → EvalMateApp_question**
   - One section contains multiple questions
   - CASCADE delete: Deleting section deletes questions

7. **EvalMateApp_evaluation → EvalMateApp_response**
   - One evaluation receives multiple responses
   - CASCADE delete: Deleting evaluation deletes responses

8. **EvalMateApp_response → EvalMateApp_answer**
   - One response contains multiple answers
   - CASCADE delete: Deleting response deletes answers

9. **auth_user → EvalMateApp_notification**
   - One user receives multiple notifications
   - CASCADE delete: Deleting user deletes notifications

### Many-to-Many Relationships
1. **EvalMateApp_team ↔ EvalMateApp_profile (Students)**
   - Through table: **EvalMateApp_teammember**
   - Students can be in multiple teams
   - Teams can have multiple students
   - CASCADE delete: Deleting team or student removes membership

### Self-Referential Relationships
1. **EvalMateApp_response.evaluated_peer_id → EvalMateApp_profile**
   - Students evaluate other students (peers)
   - Allows tracking who evaluated whom

---

## Security Considerations

### 1. Authentication & Authorization
- **Password Storage:** Django's PBKDF2 algorithm with SHA256 hash
- **Session Security:** HttpOnly cookies, CSRF protection
- **Role-Based Access Control:**
  - Students can only access their own responses
  - Faculty can access all data for their courses/evaluations
  - Superusers have full access

### 2. Data Protection
```sql
-- Row-Level Security (RLS) Example
CREATE POLICY student_view_own_responses ON EvalMateApp_response
    FOR SELECT
    USING (student_id = current_user_id());

CREATE POLICY faculty_view_course_responses ON EvalMateApp_response
    FOR SELECT
    USING (
        evaluation_id IN (
            SELECT id FROM EvalMateApp_evaluation 
            WHERE created_by_id = current_user_profile_id()
        )
    );
```

### 3. Sensitive Data Handling
- **IP Address Logging:** Track submission sources for fraud detection
- **Anonymous Evaluations:** `is_anonymous` flag prevents identity exposure
- **Passcode Protection:** Optional evaluation access control
- **Encryption at Rest:** PostgreSQL supports column-level encryption

### 4. Input Validation
- **Django ORM:** Protects against SQL injection
- **Form Validation:** Server-side validation for all user inputs
- **JSONB Validation:** Schema validation for structured data
- **File Upload Security:** Profile pictures validated for type and size

### 5. Audit Trail
- **Timestamps:** `created_at`, `updated_at` on all major tables
- **Soft Deletes:** Consider adding `is_deleted` flag for important records
- **Change Tracking:** Track who modified what and when

---

## Indexes and Performance

### Primary Indexes
All tables have primary key indexes on `id` column.

### Foreign Key Indexes
Django automatically creates indexes on foreign key columns:
- `EvalMateApp_profile.user_id`
- `EvalMateApp_course.instructor_id`
- `EvalMateApp_evaluation.created_by_id`
- `EvalMateApp_evaluation.course_id`
- `EvalMateApp_question.evaluation_id`
- `EvalMateApp_response.evaluation_id`
- `EvalMateApp_response.student_id`
- `EvalMateApp_answer.response_id`

### Composite Indexes
```sql
-- Prevent duplicate submissions
CREATE UNIQUE INDEX idx_unique_submission 
ON EvalMateApp_response(evaluation_id, student_id, evaluated_peer_id)
WHERE status = 'submitted';

-- Optimize team member lookups
CREATE UNIQUE INDEX idx_team_student 
ON EvalMateApp_teammember(team_id, student_id);

-- Optimize evaluation queries
CREATE INDEX idx_evaluation_dates 
ON EvalMateApp_evaluation(start_date, end_date, status);

-- Optimize notification queries
CREATE INDEX idx_user_notifications 
ON EvalMateApp_notification(user_id, is_read, created_at DESC);
```

### JSONB Indexes (PostgreSQL specific)
```sql
-- Index on question options
CREATE INDEX idx_question_options 
ON EvalMateApp_question USING GIN (options);

-- Index on answer values
CREATE INDEX idx_answer_values 
ON EvalMateApp_answer USING GIN (answer_value);
```

### Performance Optimization Tips
1. **Use `select_related()`** for one-to-one and foreign key lookups
2. **Use `prefetch_related()`** for many-to-many and reverse foreign keys
3. **Add database caching** for frequently accessed queries
4. **Implement pagination** for large result sets
5. **Use `only()` and `defer()`** to limit fields fetched

---

## Data Dictionary

### Enums and Choice Fields

#### account_type
- `student` - Student account
- `faculty` - Faculty/Instructor account

#### evaluation.status
- `draft` - Not yet published
- `published` - Published but not yet active
- `active` - Currently accepting responses
- `closed` - No longer accepting responses
- `archived` - Historical record

#### response.status
- `in_progress` - Started but not submitted
- `submitted` - Successfully submitted
- `late` - Submitted after deadline
- `incomplete` - Abandoned/timed out

#### question_type
- `rating` - Numerical rating scale
- `text` - Free text response
- `multiple` - Single choice selection
- `checkbox` - Multiple choice selection
- `slider` - Range slider input
- `likert` - Likert scale (Strongly Disagree to Strongly Agree)

#### notification.type
- `evaluation_assigned` - New evaluation available
- `evaluation_due_soon` - Deadline approaching
- `evaluation_overdue` - Missed deadline
- `evaluation_submitted` - Submission confirmed
- `results_available` - Results published
- `team_invitation` - Team membership invitation
- `system_announcement` - System message

#### teammember.role
- `leader` - Team leader
- `member` - Regular team member

---

## Migration Script Example

```python
# migrations/0002_add_extended_profile_fields.py
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('EvalMateApp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='major',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='academic_year',
            field=models.CharField(max_length=20, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='expected_graduation',
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='current_gpa',
            field=models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='date_of_birth',
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='profile_picture',
            field=models.ImageField(upload_to='profiles/', null=True, blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='bio',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
```

---

## Sample Queries

### 1. Get all pending evaluations for a student
```sql
SELECT e.* 
FROM EvalMateApp_evaluation e
INNER JOIN EvalMateApp_course c ON e.course_id = c.id
LEFT JOIN EvalMateApp_response r ON r.evaluation_id = e.id 
    AND r.student_id = :student_id 
    AND r.status = 'submitted'
WHERE e.status = 'active'
    AND e.start_date <= CURRENT_TIMESTAMP
    AND e.end_date >= CURRENT_TIMESTAMP
    AND r.id IS NULL
ORDER BY e.due_date ASC;
```

### 2. Get evaluation completion rate for a course
```sql
SELECT 
    e.title,
    COUNT(DISTINCT tm.student_id) as total_students,
    COUNT(DISTINCT r.student_id) as completed_students,
    ROUND(COUNT(DISTINCT r.student_id)::numeric / 
          COUNT(DISTINCT tm.student_id) * 100, 2) as completion_rate
FROM EvalMateApp_evaluation e
INNER JOIN EvalMateApp_team t ON e.team_id = t.id
INNER JOIN EvalMateApp_teammember tm ON t.id = tm.team_id
LEFT JOIN EvalMateApp_response r ON e.id = r.evaluation_id 
    AND r.student_id = tm.student_id 
    AND r.status = 'submitted'
WHERE e.course_id = :course_id
GROUP BY e.id, e.title;
```

### 3. Get average ratings for a peer
```sql
SELECT 
    q.question_text,
    AVG((a.answer_value->>'value')::numeric) as average_rating,
    COUNT(a.id) as response_count
FROM EvalMateApp_answer a
INNER JOIN EvalMateApp_response r ON a.response_id = r.id
INNER JOIN EvalMateApp_question q ON a.question_id = q.id
WHERE r.evaluated_peer_id = :peer_id
    AND r.status = 'submitted'
    AND q.question_type = 'rating'
GROUP BY q.id, q.question_text
ORDER BY q.order;
```

---

## Database Size Estimates

**Estimated storage for 1000 active users over 1 academic year:**

| Table | Rows | Storage |
|-------|------|---------|
| auth_user | 1,000 | ~200 KB |
| EvalMateApp_profile | 1,000 | ~300 KB |
| EvalMateApp_course | 50 | ~20 KB |
| EvalMateApp_team | 200 | ~40 KB |
| EvalMateApp_teammember | 800 | ~50 KB |
| EvalMateApp_evaluation | 500 | ~200 KB |
| EvalMateApp_section | 2,000 | ~100 KB |
| EvalMateApp_question | 10,000 | ~2 MB |
| EvalMateApp_response | 20,000 | ~3 MB |
| EvalMateApp_answer | 200,000 | ~50 MB |
| EvalMateApp_notification | 50,000 | ~10 MB |
| **Total** | **~284,850** | **~66 MB** |

---

## Backup and Maintenance

### Backup Strategy
```bash
# Daily full backup
pg_dump -h aws-1-us-east-2.pooler.supabase.com \
        -U postgres.quifctsbspsveatadpln \
        -d postgres \
        -F c \
        -f evalmate_backup_$(date +%Y%m%d).dump

# Weekly table-specific backups
pg_dump -t EvalMateApp_response \
        -t EvalMateApp_answer \
        -F c \
        -f responses_backup_$(date +%Y%m%d).dump
```

### Maintenance Tasks
```sql
-- Vacuum and analyze tables weekly
VACUUM ANALYZE EvalMateApp_response;
VACUUM ANALYZE EvalMateApp_answer;

-- Clean up old sessions (monthly)
DELETE FROM django_session WHERE expire_date < CURRENT_TIMESTAMP;

-- Archive old evaluations (annually)
UPDATE EvalMateApp_evaluation 
SET status = 'archived' 
WHERE end_date < (CURRENT_TIMESTAMP - INTERVAL '1 year');
```

---

## Next Steps / Roadmap

### Phase 1: Core Tables (Current)
- ✅ User authentication and profiles
- ✅ Basic evaluation structure

### Phase 2: Evaluation System (In Progress)
- ⏳ Course management
- ⏳ Team management
- ⏳ Section and question tables
- ⏳ Response and answer tables

### Phase 3: Advanced Features
- ⬜ Notification system
- ⬜ Analytics and reporting tables
- ⬜ File attachments
- ⬜ Comment system

### Phase 4: Optimization
- ⬜ Full-text search indexes
- ⬜ Materialized views for analytics
- ⬜ Partitioning for large tables
- ⬜ Read replicas

---

## Conclusion

This database schema provides a robust foundation for the EvalMate peer evaluation system. It supports:
- Role-based access control (students and faculty)
- Flexible evaluation forms with multiple question types
- Team-based evaluations
- Anonymous and identified responses
- Comprehensive notification system
- Scalability for institutional use

**Last Updated:** October 20, 2025  
**Version:** 1.0  
**Status:** Ready for implementation

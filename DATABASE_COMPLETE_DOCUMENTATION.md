# EvalMate - Complete Database Documentation
## All 13 Entities with Full Details

**Last Updated:** October 20, 2025  
**Database:** PostgreSQL (Supabase)  
**Version:** 1.0 FINAL

---

## Table of Contents
1. [Table Definitions](#table-definitions)
2. [Entity-Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
3. [Relationships and Constraints](#relationships-and-constraints)
4. [Indexing Strategy](#indexing-strategy)
5. [Security Considerations](#security-considerations)

---

# Table Definitions

## 1. auth_user

**Purpose:** Core authentication table managed by Django for user login and account management.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each user |
| username | VARCHAR(150) | UNIQUE, NOT NULL | Unique username for login |
| email | VARCHAR(254) | NOT NULL | User's email address |
| password | VARCHAR(128) | NOT NULL | Hashed password (PBKDF2 SHA256) |
| first_name | VARCHAR(150) | NULL | User's first name (optional) |
| last_name | VARCHAR(150) | NULL | User's last name (optional) |
| is_active | BOOLEAN | DEFAULT TRUE | Whether account is active |
| is_staff | BOOLEAN | DEFAULT FALSE | Staff/admin access flag |
| is_superuser | BOOLEAN | DEFAULT FALSE | Superuser/admin flag |
| date_joined | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| last_login | TIMESTAMP | NULL | Last successful login timestamp |

**Business Rules:**
- Username must be unique across the system
- Password is automatically hashed by Django (never stored as plain text)
- Inactive users (is_active=FALSE) cannot log in
- Superusers have full system access

---

## 2. EvalMateApp_profile

**Purpose:** Extended user profile containing academic and personal information for students and faculty.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique profile identifier |
| user_id | INTEGER | UNIQUE, NOT NULL, FK→auth_user.id | One-to-one link to user account |
| account_type | VARCHAR(10) | NOT NULL, CHECK IN ('student', 'faculty') | User role: student or faculty |
| first_name | VARCHAR(30) | NOT NULL | User's first name |
| last_name | VARCHAR(30) | NOT NULL | User's last name |
| email | VARCHAR(254) | NOT NULL | Contact email address |
| student_id | VARCHAR(20) | NULL | Student ID number (students only) |
| phone_number | VARCHAR(15) | NULL | Contact phone number |
| institution | VARCHAR(100) | NOT NULL | Educational institution name |
| department | VARCHAR(100) | NOT NULL | Academic department |
| major | VARCHAR(100) | NULL | Major/program of study (students) |
| academic_year | VARCHAR(20) | NULL | Current year (e.g., "Junior", "Senior") |
| expected_graduation | DATE | NULL | Expected graduation date |
| current_gpa | DECIMAL(3,2) | NULL, CHECK (≥0 AND ≤5.0) | Current GPA (0.00 to 5.00) |
| date_of_birth | DATE | NULL | Date of birth |
| profile_picture | VARCHAR(255) | NULL | Path/URL to profile image |
| bio | TEXT | NULL | Short biography or description |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Profile creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules:**
- Each user has exactly one profile
- account_type determines access permissions
- student_id is required for students, optional for faculty
- GPA must be between 0.0 and 5.0
- Deleting a user cascades to delete their profile

---

## 3. EvalMateApp_course

**Purpose:** Represents academic courses/subjects taught by faculty members.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique course identifier |
| instructor_id | INTEGER | NOT NULL, FK→EvalMateApp_profile.id | Faculty member teaching the course |
| code | VARCHAR(20) | NOT NULL | Course code (e.g., "CS101", "MATH201") |
| name | VARCHAR(200) | NOT NULL | Full course name |
| description | TEXT | NULL | Course description/syllabus |
| semester | VARCHAR(20) | NOT NULL | Semester (e.g., "Fall", "Spring", "Summer") |
| year | INTEGER | NOT NULL, CHECK (≥2000 AND ≤2100) | Academic year (e.g., 2025) |
| institution | VARCHAR(100) | NOT NULL | Institution offering the course |
| department | VARCHAR(100) | NOT NULL | Department offering the course |
| is_active | BOOLEAN | DEFAULT TRUE | Whether course is currently active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Course creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules:**
- One faculty member can teach multiple courses
- Course code + semester + year should be unique
- Only faculty can create courses
- Deleting faculty cascades to delete their courses

---

## 4. EvalMateApp_team

**Purpose:** Student teams/groups within a course for collaborative work and peer evaluation.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique team identifier |
| course_id | INTEGER | NOT NULL, FK→EvalMateApp_course.id | Course this team belongs to |
| name | VARCHAR(100) | NOT NULL | Team name |
| description | TEXT | NULL | Team description or purpose |
| created_by_id | INTEGER | NULL, FK→EvalMateApp_profile.id | User who created the team |
| is_active | BOOLEAN | DEFAULT TRUE | Whether team is currently active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Team creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules:**
- Each team belongs to exactly one course
- A course can have multiple teams
- Teams can be created by faculty or students
- Deleting a course cascades to delete its teams

---

## 5. EvalMateApp_teammember

**Purpose:** Many-to-many relationship linking students to teams (team membership).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique membership identifier |
| team_id | INTEGER | NOT NULL, FK→EvalMateApp_team.id | Team reference |
| student_id | INTEGER | NOT NULL, FK→EvalMateApp_profile.id | Student reference |
| role | VARCHAR(50) | DEFAULT 'member', CHECK IN ('leader', 'member') | Role within the team |
| joined_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When student joined the team |

**Business Rules:**
- One student can be in multiple teams
- One team can have multiple students
- (team_id, student_id) must be unique (no duplicate memberships)
- Only students (not faculty) should be team members
- Each team should have exactly one leader

---

## 6. EvalMateApp_evaluation

**Purpose:** Evaluation forms/assessments created by faculty for peer evaluation.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique evaluation identifier |
| created_by_id | INTEGER | NOT NULL, FK→EvalMateApp_profile.id | Faculty who created the evaluation |
| course_id | INTEGER | NOT NULL, FK→EvalMateApp_course.id | Course this evaluation belongs to |
| team_id | INTEGER | NULL, FK→EvalMateApp_team.id | Specific team (if team-specific) |
| title | VARCHAR(200) | NOT NULL | Evaluation title |
| description | TEXT | NULL | Evaluation description/purpose |
| instructions | TEXT | NULL | Instructions for students |
| passcode | VARCHAR(50) | NULL | Optional access passcode |
| start_date | TIMESTAMP | NOT NULL | When evaluation opens |
| end_date | TIMESTAMP | NOT NULL, CHECK (>start_date) | When evaluation closes |
| due_date | TIMESTAMP | NULL | Specific due date for submissions |
| time_limit | INTEGER | NULL, CHECK (>0) | Time limit in minutes (NULL=unlimited) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft', CHECK IN ('draft', 'published', 'active', 'closed', 'archived') | Current evaluation status |
| color_theme | VARCHAR(7) | DEFAULT '#2D3A52' | Theme color (hex code) |
| is_anonymous | BOOLEAN | DEFAULT TRUE | Whether responses are anonymous |
| show_results | BOOLEAN | DEFAULT FALSE | Show results to students |
| allow_late_submission | BOOLEAN | DEFAULT FALSE | Allow submissions after deadline |
| max_submissions | INTEGER | DEFAULT 1 | Maximum allowed submissions per student |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Evaluation creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| published_at | TIMESTAMP | NULL | When evaluation was published |

**Business Rules:**
- Only faculty can create evaluations
- end_date must be after start_date
- Status workflow: draft → published → active → closed → archived
- If passcode is set, students must enter it to access
- If is_anonymous=TRUE, student identities are hidden in responses

---

## 7. EvalMateApp_section

**Purpose:** Logical sections/categories within an evaluation form for organizing questions.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique section identifier |
| evaluation_id | INTEGER | NOT NULL, FK→EvalMateApp_evaluation.id | Parent evaluation |
| title | VARCHAR(200) | NOT NULL | Section title/heading |
| description | TEXT | NULL | Section description or instructions |
| order | INTEGER | NOT NULL, CHECK (≥0) | Display order (0-based) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Section creation timestamp |

**Business Rules:**
- Each section belongs to exactly one evaluation
- Sections are displayed in order (0, 1, 2, ...)
- Deleting an evaluation cascades to delete its sections
- Order should be sequential without gaps

---

## 8. EvalMateApp_question

**Purpose:** Individual questions within evaluation forms.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique question identifier |
| evaluation_id | INTEGER | NOT NULL, FK→EvalMateApp_evaluation.id | Parent evaluation |
| section_id | INTEGER | NULL, FK→EvalMateApp_section.id | Parent section (optional) |
| question_text | TEXT | NOT NULL | The actual question text |
| question_type | VARCHAR(20) | NOT NULL, CHECK IN ('rating', 'text', 'multiple', 'checkbox', 'slider', 'likert') | Type of question |
| is_required | BOOLEAN | DEFAULT TRUE | Whether answer is required |
| order | INTEGER | NOT NULL, CHECK (≥0) | Display order within section |
| options | JSONB | NULL | Question-specific options (see below) |
| validation_rules | JSONB | NULL | Custom validation rules |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Question creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Options JSONB Structure by Question Type:**

```json
// Rating Scale
{
  "min": 1,
  "max": 10,
  "labels": ["Poor", "Excellent"]
}

// Text Response
{
  "max_length": 500,
  "min_length": 10,
  "placeholder": "Enter your response..."
}

// Multiple Choice (single selection)
{
  "choices": ["Option 1", "Option 2", "Option 3"]
}

// Checkbox (multiple selections)
{
  "choices": ["Choice 1", "Choice 2", "Choice 3"],
  "min_selections": 1,
  "max_selections": 3
}

// Slider
{
  "min": 0,
  "max": 100,
  "step": 5,
  "labels": ["Low", "High"]
}

// Likert Scale
{
  "options": [
    "Strongly Disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly Agree"
  ]
}
```

**Business Rules:**
- Each question belongs to one evaluation
- Questions can optionally be grouped into sections
- question_type determines how the question is displayed and answered
- JSONB options field allows flexible configuration per question type
- Order determines display sequence

---

## 9. EvalMateApp_evaluationsettings

**Purpose:** Additional configuration settings for evaluations (1:1 relationship).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique settings identifier |
| evaluation_id | INTEGER | UNIQUE, NOT NULL, FK→EvalMateApp_evaluation.id | Parent evaluation (1:1) |
| allow_anonymous | BOOLEAN | DEFAULT TRUE | Allow anonymous responses |
| show_results | BOOLEAN | DEFAULT FALSE | Show results to students |
| allow_comments | BOOLEAN | DEFAULT TRUE | Allow text comments |
| randomize_questions | BOOLEAN | DEFAULT FALSE | Randomize question order |
| require_all_responses | BOOLEAN | DEFAULT TRUE | All questions must be answered |
| send_reminders | BOOLEAN | DEFAULT TRUE | Send deadline reminders |
| reminder_days_before | INTEGER | DEFAULT 2, CHECK (≥0) | Days before due date to send reminder |
| notification_settings | JSONB | NULL | Custom notification preferences |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Settings creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules:**
- Each evaluation has exactly one settings record
- Settings are created automatically when evaluation is created
- reminder_days_before only applies if send_reminders=TRUE
- Deleting evaluation cascades to delete settings

---

## 10. EvalMateApp_response

**Purpose:** Student responses/submissions to evaluations (tracks who evaluated whom).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique response identifier |
| evaluation_id | INTEGER | NOT NULL, FK→EvalMateApp_evaluation.id | Evaluation being responded to |
| student_id | INTEGER | NOT NULL, FK→EvalMateApp_profile.id | Student submitting the response |
| evaluated_peer_id | INTEGER | NULL, FK→EvalMateApp_profile.id | Peer being evaluated (NULL for self-evaluation) |
| team_id | INTEGER | NULL, FK→EvalMateApp_team.id | Team context |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'in_progress', CHECK IN ('in_progress', 'submitted', 'late', 'incomplete') | Response status |
| started_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When response was started |
| submitted_at | TIMESTAMP | NULL, CHECK (≥started_at) | When response was submitted |
| time_spent | INTEGER | NULL | Total time spent in seconds |
| ip_address | INET | NULL | IP address of submission (security) |
| user_agent | TEXT | NULL | Browser user agent (security) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Response creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules:**
- One student can submit multiple responses (one per peer)
- (evaluation_id, student_id, evaluated_peer_id) must be unique for submitted responses
- submitted_at must be after or equal to started_at
- Status workflow: in_progress → submitted (or late/incomplete)
- IP address and user agent logged for security/fraud detection

---

## 11. EvalMateApp_answer

**Purpose:** Individual answers to specific questions within a response.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique answer identifier |
| response_id | INTEGER | NOT NULL, FK→EvalMateApp_response.id | Parent response |
| question_id | INTEGER | NOT NULL, FK→EvalMateApp_question.id | Question being answered |
| answer_value | JSONB | NOT NULL | The actual answer data (see below) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Answer timestamp |

**Answer Value JSONB Structure by Question Type:**

```json
// Rating Scale
{
  "value": 8,
  "comment": "Great teamwork and communication"
}

// Text Response
{
  "value": "This is a detailed text response explaining..."
}

// Multiple Choice
{
  "selected": "Option 2"
}

// Checkbox
{
  "selected": ["Choice 1", "Choice 3"]
}

// Slider
{
  "value": 75
}

// Likert Scale
{
  "selected": "Agree",
  "value": 4
}
```

**Business Rules:**
- Each answer belongs to one response
- Each answer answers one question
- (response_id, question_id) must be unique (one answer per question per response)
- JSONB format depends on question type
- Deleting a response cascades to delete its answers

---

## 12. EvalMateApp_notification

**Purpose:** User notifications for events like new evaluations, deadlines, results.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique notification identifier |
| user_id | INTEGER | NOT NULL, FK→auth_user.id | Recipient user |
| type | VARCHAR(50) | NOT NULL, CHECK IN (...) | Notification type (see below) |
| title | VARCHAR(200) | NOT NULL | Notification title/subject |
| message | TEXT | NOT NULL | Notification message body |
| is_read | BOOLEAN | DEFAULT FALSE | Whether notification has been read |
| related_object_type | VARCHAR(50) | NULL | Related model type (e.g., 'evaluation') |
| related_object_id | INTEGER | NULL | Related object ID |
| action_url | VARCHAR(500) | NULL | URL for action button/link |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Notification creation timestamp |
| read_at | TIMESTAMP | NULL | When notification was marked as read |

**Notification Types:**
- `evaluation_assigned` - New evaluation assigned to student
- `evaluation_due_soon` - Evaluation deadline approaching
- `evaluation_overdue` - Evaluation deadline passed
- `evaluation_submitted` - Confirmation of submission
- `results_available` - Evaluation results published
- `team_invitation` - Invited to join a team
- `system_announcement` - System-wide announcement

**Business Rules:**
- Each notification belongs to one user
- Notifications can reference other objects (evaluation, team, etc.)
- Unread notifications (is_read=FALSE) appear in notification bell
- Old notifications can be auto-deleted after a certain period

---

## 13. django_session

**Purpose:** Django's session management for maintaining user login state.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| session_key | VARCHAR(40) | PRIMARY KEY | Unique session identifier (sent as cookie) |
| session_data | TEXT | NOT NULL | Encrypted/encoded session data |
| expire_date | TIMESTAMP | NOT NULL | When session expires |

**Session Data Contains:**
- User ID
- Authentication backend
- CSRF tokens
- Flash messages
- Custom application data

**Business Rules:**
- One session per logged-in user
- Sessions expire after inactivity (default 2 weeks)
- Expired sessions should be cleaned up regularly
- Session key is stored in browser cookie

---

# Entity-Relationship Diagram (ERD)

```
┌─────────────────────┐
│   auth_user         │ ◄──────────────────┐
│ (Authentication)    │                    │
├─────────────────────┤                    │
│ PK  id              │                    │ 1:1
│     username        │                    │
│     email           │                    │
│     password        │                    ▼
│     is_active       │         ┌─────────────────────┐
│     date_joined     │         │  EvalMateApp_profile │
└──────────┬──────────┘         ├─────────────────────┤
           │                    │ PK  id              │
           │ 1:N                │ FK  user_id         │──┐
           │ notifications      │     account_type    │  │
           ▼                    │     first_name      │  │
┌─────────────────────┐         │     institution     │  │
│ EvalMateApp_        │         │     department      │  │
│ notification        │         │     student_id      │  │
├─────────────────────┤         │     major           │  │
│ PK  id              │         │     academic_year   │  │
│ FK  user_id         │         │     profile_picture │  │
│     type            │         │     created_at      │  │
│     title           │         └──────────┬──────────┘  │
│     message         │                    │             │
│     is_read         │             Faculty│    Student  │
│     created_at      │                    │             │
└─────────────────────┘                    │             │
                                           ▼             ▼
                              ┌─────────────────────┐ ┌──────────────┐
                              │  EvalMateApp_course │ │ TeamMember   │
                              ├─────────────────────┤ ├──────────────┤
                              │ PK  id              │ │ PK  id       │
                              │ FK  instructor_id   │ │ FK  team_id  │
                              │     code            │ │ FK student_id│
                              │     name            │ │     role     │
                              │     semester        │ └──────────────┘
                              │     year            │        │
                              │     institution     │        │ M:N
                              └──────────┬──────────┘        │
                                         │ 1:N               │
                                         │                   │
                     ┌───────────────────┴─────┐             │
                     │                         │             │
                     ▼                         ▼             │
          ┌─────────────────────┐  ┌─────────────────────┐  │
          │ EvalMateApp_        │  │ EvalMateApp_team    │  │
          │ evaluation          │  ├─────────────────────┤  │
          ├─────────────────────┤  │ PK  id              │◄─┘
          │ PK  id              │  │ FK  course_id       │
          │ FK  created_by_id   │  │     name            │
          │ FK  course_id       │  │     description     │
          │ FK  team_id         │◄─┤     created_at      │
          │     title           │  └─────────────────────┘
          │     description     │
          │     passcode        │
          │     start_date      │
          │     end_date        │
          │     status          │
          │     is_anonymous    │
          │     created_at      │
          └──────────┬──────────┘
                     │ 1:1
                     │
                     ▼
          ┌─────────────────────┐
          │ EvalMateApp_        │
          │ evaluationsettings  │
          ├─────────────────────┤
          │ PK  id              │
          │ FK  evaluation_id   │ (UNIQUE)
          │     allow_anonymous │
          │     show_results    │
          │     send_reminders  │
          └─────────────────────┘
                     │
                     │ 1:N
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐
│ EvalMateApp_section │  │ EvalMateApp_question│
├─────────────────────┤  ├─────────────────────┤
│ PK  id              │  │ PK  id              │
│ FK  evaluation_id   │  │ FK  evaluation_id   │
│     title           │  │ FK  section_id      │
│     order           │  │     question_text   │
└─────────────────────┘  │     question_type   │
         │               │     is_required     │
         │ 1:N           │     order           │
         │               │     options (JSONB) │
         └───────────────┤     created_at      │
                         └──────────┬──────────┘
                                    │
                                    │ Referenced by
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ EvalMateApp_answer  │
                         ├─────────────────────┤
                         │ PK  id              │
                         │ FK  response_id     │
                         │ FK  question_id     │
                         │     answer_value    │ (JSONB)
                         │     created_at      │
                         └─────────────────────┘
                                    ▲
                                    │ N:1
                                    │
                         ┌─────────────────────┐
                         │ EvalMateApp_response│
                         ├─────────────────────┤
                         │ PK  id              │
                         │ FK  evaluation_id   │
                         │ FK  student_id      │
                         │ FK  evaluated_peer_id│
                         │ FK  team_id         │
                         │     status          │
                         │     started_at      │
                         │     submitted_at    │
                         │     time_spent      │
                         │     ip_address      │
                         └─────────────────────┘

┌─────────────────────┐
│ django_session      │
├─────────────────────┤
│ PK  session_key     │
│     session_data    │
│     expire_date     │
└─────────────────────┘
(Standalone - manages user sessions)
```

---

# Relationships and Constraints

## One-to-One Relationships (1:1)

### 1. auth_user ↔ EvalMateApp_profile
- **Description:** Each user account has exactly one profile
- **Foreign Key:** `EvalMateApp_profile.user_id → auth_user.id`
- **Delete Rule:** CASCADE (deleting user deletes profile)
- **Business Rule:** Profile is created automatically when user registers

### 2. EvalMateApp_evaluation ↔ EvalMateApp_evaluationsettings
- **Description:** Each evaluation has exactly one settings record
- **Foreign Key:** `EvalMateApp_evaluationsettings.evaluation_id → EvalMateApp_evaluation.id`
- **Constraint:** UNIQUE on evaluation_id
- **Delete Rule:** CASCADE (deleting evaluation deletes settings)
- **Business Rule:** Settings created automatically with evaluation

---

## One-to-Many Relationships (1:N)

### 3. auth_user → EvalMateApp_notification
- **Description:** One user receives many notifications
- **Foreign Key:** `EvalMateApp_notification.user_id → auth_user.id`
- **Delete Rule:** CASCADE (deleting user deletes their notifications)
- **Cardinality:** 1 user : 0..* notifications

### 4. EvalMateApp_profile (Faculty) → EvalMateApp_course
- **Description:** One faculty member teaches multiple courses
- **Foreign Key:** `EvalMateApp_course.instructor_id → EvalMateApp_profile.id`
- **Delete Rule:** CASCADE (deleting faculty deletes their courses)
- **Cardinality:** 1 faculty : 0..* courses
- **Business Rule:** Only profiles with account_type='faculty' can create courses

### 5. EvalMateApp_course → EvalMateApp_team
- **Description:** One course contains multiple teams
- **Foreign Key:** `EvalMateApp_team.course_id → EvalMateApp_course.id`
- **Delete Rule:** CASCADE (deleting course deletes its teams)
- **Cardinality:** 1 course : 0..* teams

### 6. EvalMateApp_course → EvalMateApp_evaluation
- **Description:** One course has multiple evaluations
- **Foreign Key:** `EvalMateApp_evaluation.course_id → EvalMateApp_course.id`
- **Delete Rule:** CASCADE (deleting course deletes evaluations)
- **Cardinality:** 1 course : 0..* evaluations

### 7. EvalMateApp_profile (Faculty) → EvalMateApp_evaluation
- **Description:** One faculty creates multiple evaluations
- **Foreign Key:** `EvalMateApp_evaluation.created_by_id → EvalMateApp_profile.id`
- **Delete Rule:** CASCADE (deleting faculty deletes their evaluations)
- **Cardinality:** 1 faculty : 0..* evaluations

### 8. EvalMateApp_team → EvalMateApp_evaluation
- **Description:** One team can have multiple evaluations (optional relationship)
- **Foreign Key:** `EvalMateApp_evaluation.team_id → EvalMateApp_team.id`
- **Delete Rule:** SET NULL (deleting team keeps evaluation but removes team reference)
- **Cardinality:** 1 team : 0..* evaluations
- **Nullable:** Yes (evaluations can exist without specific team)

### 9. EvalMateApp_evaluation → EvalMateApp_section
- **Description:** One evaluation contains multiple sections
- **Foreign Key:** `EvalMateApp_section.evaluation_id → EvalMateApp_evaluation.id`
- **Delete Rule:** CASCADE (deleting evaluation deletes sections)
- **Cardinality:** 1 evaluation : 0..* sections

### 10. EvalMateApp_evaluation → EvalMateApp_question
- **Description:** One evaluation contains multiple questions
- **Foreign Key:** `EvalMateApp_question.evaluation_id → EvalMateApp_evaluation.id`
- **Delete Rule:** CASCADE (deleting evaluation deletes questions)
- **Cardinality:** 1 evaluation : 1..* questions

### 11. EvalMateApp_section → EvalMateApp_question
- **Description:** One section contains multiple questions (optional grouping)
- **Foreign Key:** `EvalMateApp_question.section_id → EvalMateApp_section.id`
- **Delete Rule:** CASCADE (deleting section deletes its questions)
- **Cardinality:** 1 section : 0..* questions
- **Nullable:** Yes (questions can exist without section)

### 12. EvalMateApp_evaluation → EvalMateApp_response
- **Description:** One evaluation receives multiple responses
- **Foreign Key:** `EvalMateApp_response.evaluation_id → EvalMateApp_evaluation.id`
- **Delete Rule:** CASCADE (deleting evaluation deletes responses)
- **Cardinality:** 1 evaluation : 0..* responses

### 13. EvalMateApp_profile (Student) → EvalMateApp_response
- **Description:** One student submits multiple responses (one per peer)
- **Foreign Key:** `EvalMateApp_response.student_id → EvalMateApp_profile.id`
- **Delete Rule:** CASCADE (deleting student deletes their responses)
- **Cardinality:** 1 student : 0..* responses

### 14. EvalMateApp_team → EvalMateApp_response
- **Description:** Responses can be associated with a team context
- **Foreign Key:** `EvalMateApp_response.team_id → EvalMateApp_team.id`
- **Delete Rule:** SET NULL (deleting team keeps response but removes team reference)
- **Cardinality:** 1 team : 0..* responses
- **Nullable:** Yes

### 15. EvalMateApp_response → EvalMateApp_answer
- **Description:** One response contains multiple answers (one per question)
- **Foreign Key:** `EvalMateApp_answer.response_id → EvalMateApp_response.id`
- **Delete Rule:** CASCADE (deleting response deletes answers)
- **Cardinality:** 1 response : 0..* answers

### 16. EvalMateApp_question → EvalMateApp_answer
- **Description:** One question receives multiple answers (from different responses)
- **Foreign Key:** `EvalMateApp_answer.question_id → EvalMateApp_question.id`
- **Delete Rule:** CASCADE (deleting question deletes answers)
- **Cardinality:** 1 question : 0..* answers

---

## Many-to-Many Relationships (M:N)

### 17. EvalMateApp_team ↔ EvalMateApp_profile (Students)
- **Description:** Students can be in multiple teams, teams have multiple students
- **Junction Table:** `EvalMateApp_teammember`
- **Foreign Keys:**
  - `EvalMateApp_teammember.team_id → EvalMateApp_team.id`
  - `EvalMateApp_teammember.student_id → EvalMateApp_profile.id`
- **Delete Rule:** CASCADE both sides (deleting team or student removes membership)
- **Unique Constraint:** (team_id, student_id) - no duplicate memberships
- **Cardinality:** M teams : N students

---

## Self-Referential Relationships

### 18. EvalMateApp_response.evaluated_peer_id → EvalMateApp_profile
- **Description:** Peer evaluation - students evaluate other students
- **Foreign Key:** `EvalMateApp_response.evaluated_peer_id → EvalMateApp_profile.id`
- **Delete Rule:** CASCADE (deleting student removes evaluations about them)
- **Business Logic:** One student evaluates many peers; one peer is evaluated by many students
- **Nullable:** Yes (can be NULL for self-evaluation or non-peer evaluations)

---

## Constraint Summary

| Constraint Type | Count | Purpose |
|----------------|-------|---------|
| PRIMARY KEY | 13 | Unique record identification |
| FOREIGN KEY | 22 | Referential integrity |
| UNIQUE | 4 | Prevent duplicates |
| CHECK | 12 | Data validation |
| NOT NULL | 47 | Required fields |
| DEFAULT | 31 | Default values |
| CASCADE DELETE | 18 | Maintain data integrity |
| SET NULL | 3 | Preserve historical data |

---

# Indexing Strategy

## Primary Indexes (Automatic)

Every table has a PRIMARY KEY index on the `id` column (or `session_key` for django_session).

**Total:** 13 primary indexes

---

## Foreign Key Indexes (Automatic)

Django automatically creates indexes on all foreign key columns:

| Table | Foreign Key Column | References |
|-------|-------------------|------------|
| EvalMateApp_profile | user_id | auth_user.id |
| EvalMateApp_course | instructor_id | EvalMateApp_profile.id |
| EvalMateApp_team | course_id | EvalMateApp_course.id |
| EvalMateApp_team | created_by_id | EvalMateApp_profile.id |
| EvalMateApp_teammember | team_id | EvalMateApp_team.id |
| EvalMateApp_teammember | student_id | EvalMateApp_profile.id |
| EvalMateApp_evaluation | created_by_id | EvalMateApp_profile.id |
| EvalMateApp_evaluation | course_id | EvalMateApp_course.id |
| EvalMateApp_evaluation | team_id | EvalMateApp_team.id |
| EvalMateApp_section | evaluation_id | EvalMateApp_evaluation.id |
| EvalMateApp_question | evaluation_id | EvalMateApp_evaluation.id |
| EvalMateApp_question | section_id | EvalMateApp_section.id |
| EvalMateApp_evaluationsettings | evaluation_id | EvalMateApp_evaluation.id |
| EvalMateApp_response | evaluation_id | EvalMateApp_evaluation.id |
| EvalMateApp_response | student_id | EvalMateApp_profile.id |
| EvalMateApp_response | evaluated_peer_id | EvalMateApp_profile.id |
| EvalMateApp_response | team_id | EvalMateApp_team.id |
| EvalMateApp_answer | response_id | EvalMateApp_response.id |
| EvalMateApp_answer | question_id | EvalMateApp_question.id |
| EvalMateApp_notification | user_id | auth_user.id |

**Total:** 20 foreign key indexes

---

## Unique Indexes

### 1. auth_user.username
```sql
CREATE UNIQUE INDEX idx_auth_user_username ON auth_user(username);
```
**Purpose:** Ensure username uniqueness for login

### 2. EvalMateApp_profile.user_id
```sql
CREATE UNIQUE INDEX idx_profile_user_id ON EvalMateApp_profile(user_id);
```
**Purpose:** Enforce 1:1 relationship between user and profile

### 3. EvalMateApp_teammember (team_id, student_id)
```sql
CREATE UNIQUE INDEX idx_team_student ON EvalMateApp_teammember(team_id, student_id);
```
**Purpose:** Prevent duplicate team memberships

### 4. EvalMateApp_evaluationsettings.evaluation_id
```sql
CREATE UNIQUE INDEX idx_evaluationsettings_evaluation 
ON EvalMateApp_evaluationsettings(evaluation_id);
```
**Purpose:** Enforce 1:1 relationship between evaluation and settings

### 5. EvalMateApp_answer (response_id, question_id)
```sql
CREATE UNIQUE INDEX idx_answer_response_question 
ON EvalMateApp_answer(response_id, question_id);
```
**Purpose:** One answer per question per response

### 6. EvalMateApp_response (evaluation_id, student_id, evaluated_peer_id) WHERE status='submitted'
```sql
CREATE UNIQUE INDEX idx_unique_submission 
ON EvalMateApp_response(evaluation_id, student_id, evaluated_peer_id)
WHERE status = 'submitted';
```
**Purpose:** Prevent duplicate submissions (partial unique index)

**Total:** 6 unique indexes

---

## Composite Indexes (Multi-Column)

### 1. Profile: Institution + Department
```sql
CREATE INDEX idx_profile_institution_department 
ON EvalMateApp_profile(institution, department);
```
**Use Case:** Find all users in a specific department at an institution
**Query:** `WHERE institution='USC' AND department='Computer Science'`

### 2. Course: Code + Semester + Year
```sql
CREATE INDEX idx_course_code_semester_year 
ON EvalMateApp_course(code, semester, year);
```
**Use Case:** Find specific course offering
**Query:** `WHERE code='CS101' AND semester='Fall' AND year=2025`

### 3. Course: Institution + Department
```sql
CREATE INDEX idx_course_institution_department 
ON EvalMateApp_course(institution, department);
```
**Use Case:** List all courses in a department
**Query:** `WHERE institution='USC' AND department='Engineering'`

### 4. Evaluation: Start Date + End Date + Status
```sql
CREATE INDEX idx_evaluation_dates 
ON EvalMateApp_evaluation(start_date, end_date, status);
```
**Use Case:** Find active evaluations within date range
**Query:** `WHERE start_date <= NOW() AND end_date >= NOW() AND status='active'`

### 5. Section: Evaluation + Order
```sql
CREATE INDEX idx_section_evaluation_order 
ON EvalMateApp_section(evaluation_id, "order");
```
**Use Case:** Get sections in order for an evaluation
**Query:** `WHERE evaluation_id=123 ORDER BY order`

### 6. Question: Evaluation + Order
```sql
CREATE INDEX idx_question_evaluation_order 
ON EvalMateApp_question(evaluation_id, "order");
```
**Use Case:** Get questions in order for an evaluation
**Query:** `WHERE evaluation_id=123 ORDER BY order`

### 7. Question: Section + Order
```sql
CREATE INDEX idx_question_section_order 
ON EvalMateApp_question(section_id, "order");
```
**Use Case:** Get questions in order for a section
**Query:** `WHERE section_id=456 ORDER BY order`

### 8. Notification: User + Is Read + Created At
```sql
CREATE INDEX idx_notification_user_read 
ON EvalMateApp_notification(user_id, is_read, created_at DESC);
```
**Use Case:** Get unread notifications for user, newest first
**Query:** `WHERE user_id=123 AND is_read=FALSE ORDER BY created_at DESC`

**Total:** 8 composite indexes

---

## Single Column Indexes

### 1. auth_user.email
```sql
CREATE INDEX idx_auth_user_email ON auth_user(email);
```
**Use Case:** Login by email, email lookup

### 2. EvalMateApp_profile.account_type
```sql
CREATE INDEX idx_profile_account_type ON EvalMateApp_profile(account_type);
```
**Use Case:** Filter users by role (student/faculty)

### 3. EvalMateApp_profile.student_id (partial)
```sql
CREATE INDEX idx_profile_student_id 
ON EvalMateApp_profile(student_id) 
WHERE student_id IS NOT NULL;
```
**Use Case:** Lookup by student ID

### 4. EvalMateApp_evaluation.status
```sql
CREATE INDEX idx_evaluation_status ON EvalMateApp_evaluation(status);
```
**Use Case:** Filter evaluations by status

### 5. EvalMateApp_question.question_type
```sql
CREATE INDEX idx_question_type ON EvalMateApp_question(question_type);
```
**Use Case:** Analytics on question types

### 6. EvalMateApp_response.status
```sql
CREATE INDEX idx_response_status ON EvalMateApp_response(status);
```
**Use Case:** Find all submitted/pending responses

### 7. EvalMateApp_notification.type
```sql
CREATE INDEX idx_notification_type ON EvalMateApp_notification(type);
```
**Use Case:** Filter notifications by type

### 8. EvalMateApp_notification.created_at
```sql
CREATE INDEX idx_notification_created_at 
ON EvalMateApp_notification(created_at DESC);
```
**Use Case:** Get recent notifications

### 9. django_session.expire_date
```sql
CREATE INDEX idx_django_session_expire_date ON django_session(expire_date);
```
**Use Case:** Clean up expired sessions

**Total:** 9 single column indexes

---

## JSONB Indexes (PostgreSQL Specific)

### 1. Question Options (GIN Index)
```sql
CREATE INDEX idx_question_options 
ON EvalMateApp_question USING GIN (options);
```
**Use Case:** Search questions by option values
**Query:** `WHERE options @> '{"max": 10}'::jsonb`

### 2. Answer Values (GIN Index)
```sql
CREATE INDEX idx_answer_value 
ON EvalMateApp_answer USING GIN (answer_value);
```
**Use Case:** Search answers by value, analytics on responses
**Query:** `WHERE answer_value @> '{"value": 8}'::jsonb`

**Total:** 2 JSONB indexes

---

## Index Summary

| Index Type | Count | Purpose |
|-----------|-------|---------|
| Primary Key | 13 | Unique identification |
| Foreign Key | 20 | Join optimization |
| Unique | 6 | Constraint enforcement |
| Composite | 8 | Multi-column queries |
| Single Column | 9 | Filtering & sorting |
| JSONB (GIN) | 2 | JSON querying |
| **Total** | **58** | **Complete coverage** |

---

## Query Performance Tips

1. **Use `select_related()`** for foreign keys (one-to-one, many-to-one)
   ```python
   Profile.objects.select_related('user').all()
   ```

2. **Use `prefetch_related()`** for reverse foreign keys and many-to-many
   ```python
   Course.objects.prefetch_related('evaluation_set').all()
   ```

3. **Use `only()` and `defer()`** to limit fields fetched
   ```python
   Profile.objects.only('first_name', 'last_name')
   ```

4. **Add `db_index=True`** in Django models for frequently filtered fields

5. **Use pagination** for large result sets
   ```python
   Paginator(queryset, 50)  # 50 items per page
   ```

---

# Security Considerations

## 1. Authentication & Authorization

### Password Security
- **Storage:** Django uses PBKDF2 with SHA256 hash (128 chars)
- **Rounds:** 600,000+ iterations for strong hashing
- **Salt:** Automatically salted per password
- **Never stored in plain text**

```sql
-- Example hashed password in auth_user
password: 'pbkdf2_sha256$600000$abcdef...'
```

### Session Security
- **Session Key:** 40-character random string
- **Cookie Settings:**
  ```python
  SESSION_COOKIE_HTTPONLY = True   # Prevent XSS attacks
  SESSION_COOKIE_SECURE = True     # HTTPS only (production)
  SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
  ```
- **Session Expiration:** Default 2 weeks, configurable

### Role-Based Access Control (RBAC)

```python
# Example access control logic
def check_access(user, resource):
    profile = user.profile
    
    # Faculty can access their own courses
    if profile.account_type == 'faculty':
        return resource.instructor_id == profile.id
    
    # Students can only access their enrollments
    if profile.account_type == 'student':
        return resource.students.filter(id=profile.id).exists()
    
    return False
```

**Access Matrix:**

| Role | Create Evaluation | View All Responses | Edit Profile | View Results |
|------|------------------|-------------------|--------------|--------------|
| Faculty | ✅ Yes | ✅ Yes (own courses) | ✅ Own only | ✅ Yes |
| Student | ❌ No | ❌ No | ✅ Own only | ⚠️ If allowed |
| Superuser | ✅ Yes | ✅ Yes (all) | ✅ All | ✅ Yes |

---

## 2. Data Protection

### Row-Level Security (RLS)

PostgreSQL supports row-level security policies:

```sql
-- Students can only view their own responses
CREATE POLICY student_view_own_responses 
ON EvalMateApp_response
FOR SELECT
TO authenticated_user
USING (student_id = current_user_profile_id());

-- Faculty can view responses for their evaluations
CREATE POLICY faculty_view_course_responses 
ON EvalMateApp_response
FOR SELECT
TO authenticated_user
USING (
    evaluation_id IN (
        SELECT id FROM EvalMateApp_evaluation 
        WHERE created_by_id = current_user_profile_id()
    )
);
```

### Field-Level Encryption

For sensitive data (if needed):

```python
from django_cryptography.fields import encrypt

class Profile(models.Model):
    # Encrypt SSN, bank account, etc.
    ssn = encrypt(models.CharField(max_length=11))
```

### Anonymous Evaluations

When `is_anonymous=TRUE`:

```python
# Hide student identity in responses
class AnonymousResponse:
    def get_student_name(self):
        if self.evaluation.is_anonymous:
            return f"Anonymous Student #{self.id}"
        return self.student.get_full_name()
```

---

## 3. Input Validation

### SQL Injection Prevention
- **Django ORM:** Automatically escapes all queries
- **Never use raw SQL with user input:**
  ```python
  # ❌ WRONG - SQL injection vulnerable
  cursor.execute(f"SELECT * FROM users WHERE username='{user_input}'")
  
  # ✅ CORRECT - parameterized query
  cursor.execute("SELECT * FROM users WHERE username=%s", [user_input])
  ```

### XSS Prevention
- **Template escaping:** Django auto-escapes HTML
- **JSONB validation:** Validate JSON before storing
  ```python
  import json
  try:
      data = json.loads(user_input)
      validate_answer_structure(data)  # Custom validation
  except json.JSONDecodeError:
      raise ValidationError("Invalid JSON")
  ```

### CSRF Protection
- **Enabled by default** in Django
- **CSRF tokens** required for all POST requests
- **Middleware:** `CsrfViewMiddleware`

---

## 4. Sensitive Data Handling

### Personal Identifiable Information (PII)

| Field | Sensitivity | Protection |
|-------|------------|------------|
| email | High | Access control, TLS in transit |
| phone_number | High | Access control |
| student_id | Medium | Access control, indexed separately |
| profile_picture | Low | Public URLs, size validation |
| date_of_birth | High | Access control, optional field |
| ip_address | Medium | Logged for security, privacy policy |

### Data Minimization
- Only collect necessary data
- Optional fields where possible
- Expiration policies for logs

### Audit Trail

```python
# Track who modified what
class AuditLog(models.Model):
    user = models.ForeignKey(User)
    action = models.CharField(max_length=50)  # 'CREATE', 'UPDATE', 'DELETE'
    table_name = models.CharField(max_length=50)
    record_id = models.IntegerField()
    old_values = models.JSONField(null=True)
    new_values = models.JSONField(null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
```

---

## 5. Network Security

### IP Address Logging
- **Purpose:** Fraud detection, security monitoring
- **Storage:** `ip_address INET` in response table
- **Usage:**
  - Detect multiple submissions from same IP
  - Geographic analysis
  - Rate limiting

### Rate Limiting

```python
from django.core.cache import cache

def rate_limit(user_id, action, limit=5, period=60):
    key = f"rate_limit:{user_id}:{action}"
    count = cache.get(key, 0)
    
    if count >= limit:
        raise RateLimitExceeded(f"Max {limit} {action} per {period}s")
    
    cache.set(key, count + 1, period)
```

### HTTPS/TLS
- **Production:** Enforce HTTPS
- **Database:** SSL connection to Supabase
  ```python
  'OPTIONS': {
      'sslmode': 'require',
      'sslrootcert': '/path/to/ca-cert.pem'
  }
  ```

---

## 6. Access Control Rules

### Evaluation Access

```python
def can_access_evaluation(user, evaluation):
    profile = user.profile
    
    # Faculty who created it
    if evaluation.created_by_id == profile.id:
        return True
    
    # Students in the course
    if profile.account_type == 'student':
        # Check if student is in a team in this course
        return TeamMember.objects.filter(
            student_id=profile.id,
            team__course_id=evaluation.course_id
        ).exists()
    
    return False
```

### Passcode Protection

```python
def check_evaluation_passcode(evaluation, user_input):
    if not evaluation.passcode:
        return True  # No passcode required
    
    return evaluation.passcode == user_input
```

### Time-Based Access

```python
from django.utils import timezone

def can_submit_evaluation(evaluation):
    now = timezone.now()
    
    # Check if within time window
    if now < evaluation.start_date:
        return False, "Evaluation hasn't started yet"
    
    if now > evaluation.end_date:
        if not evaluation.allow_late_submission:
            return False, "Evaluation deadline has passed"
        return True, "Late submission"
    
    return True, "On time"
```

---

## 7. Data Retention & Privacy

### GDPR Compliance

```python
# Right to erasure (delete user data)
def anonymize_user_data(user_id):
    profile = Profile.objects.get(user_id=user_id)
    
    # Anonymize personal data
    profile.first_name = "Deleted"
    profile.last_name = "User"
    profile.email = f"deleted_{user_id}@anonymous.com"
    profile.phone_number = None
    profile.date_of_birth = None
    profile.profile_picture = None
    profile.bio = None
    profile.save()
    
    # Keep evaluation data but anonymize
    Response.objects.filter(student_id=profile.id).update(
        ip_address=None,
        user_agent=None
    )
```

### Data Archival

```sql
-- Archive old evaluations (annually)
UPDATE EvalMateApp_evaluation 
SET status = 'archived'
WHERE end_date < (CURRENT_TIMESTAMP - INTERVAL '1 year')
    AND status != 'archived';

-- Delete old notifications (after 90 days)
DELETE FROM EvalMateApp_notification
WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '90 days')
    AND is_read = TRUE;

-- Clean expired sessions
DELETE FROM django_session 
WHERE expire_date < CURRENT_TIMESTAMP;
```

---

## 8. Security Checklist

### Application Level
- ✅ Django security middleware enabled
- ✅ CSRF protection enabled
- ✅ XSS protection via template escaping
- ✅ SQL injection prevention via ORM
- ✅ Password hashing with PBKDF2
- ✅ Session security (HttpOnly, Secure, SameSite)
- ✅ Input validation on all forms
- ✅ Rate limiting on sensitive operations

### Database Level
- ✅ Foreign key constraints enforced
- ✅ Check constraints for data validation
- ✅ Unique constraints prevent duplicates
- ✅ Indexes for query performance
- ✅ SSL/TLS for database connections
- ✅ Row-level security policies (optional)
- ✅ Regular backups scheduled
- ✅ Audit logging for sensitive operations

### Infrastructure Level
- ✅ HTTPS enforced in production
- ✅ Firewall rules restrict database access
- ✅ Environment variables for secrets
- ✅ Separate dev/staging/production databases
- ✅ Monitoring and alerting
- ✅ Regular security updates
- ✅ Intrusion detection system

---

## 9. Common Security Vulnerabilities & Mitigations

| Vulnerability | Risk | Mitigation |
|--------------|------|------------|
| SQL Injection | High | Use Django ORM, never raw SQL with user input |
| XSS (Cross-Site Scripting) | High | Django auto-escaping, validate JSONB |
| CSRF (Cross-Site Request Forgery) | High | CSRF middleware enabled, tokens required |
| Session Hijacking | Medium | Secure cookies, HTTPS only, session expiration |
| Brute Force Login | Medium | Rate limiting, account lockout after failures |
| Information Disclosure | Medium | Proper error handling, don't expose stack traces |
| Mass Assignment | Medium | Use Django forms, whitelist fields |
| Insecure Direct Object Reference | High | Check permissions before data access |
| Unvalidated Redirects | Low | Whitelist allowed redirect URLs |
| Weak Password Policy | Medium | Minimum length, complexity requirements |

---

## 10. Security Best Practices

### Development
```python
# settings.py (Development)
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
SECRET_KEY = 'dev-secret-key-change-in-production'
```

### Production
```python
# settings.py (Production)
DEBUG = False
ALLOWED_HOSTS = ['evalmate.com', 'www.evalmate.com']
SECRET_KEY = os.environ.get('SECRET_KEY')  # From environment variable

# Security Headers
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

### Environment Variables
```bash
# .env file (never commit this!)
SECRET_KEY=your-secret-key-here
DB_PASSWORD=your-db-password
DB_HOST=aws-1-us-east-2.pooler.supabase.com
```

---

# Summary

This comprehensive documentation provides:
- ✅ **13 Complete table definitions** with all columns and descriptions
- ✅ **Complete ERD** showing all relationships
- ✅ **18 Detailed relationship descriptions** with cardinality and delete rules
- ✅ **58 Strategic indexes** for optimal performance
- ✅ **10 Security sections** covering authentication, authorization, data protection, compliance

**Use this document as:**
- Reference for Django model creation
- Guide for database schema implementation
- Security checklist for development
- Documentation for team members
- Blueprint for API development

**Status:** ✅ Complete and production-ready

---

**Last Updated:** October 20, 2025  
**Version:** 1.0 FINAL  
**Database:** PostgreSQL (Supabase)  
**Framework:** Django 5.2.7

-- ============================================================================
-- EvalMate - COMPLETE Database Schema (SQL DDL)
-- PostgreSQL/Supabase Compatible
-- 
-- This is the MASTER BLUEPRINT for the entire EvalMate system
-- Use this as the definitive guide for Django models and all development
--
-- Version: 1.0 FINAL
-- Last Updated: October 20, 2025
-- Status: Complete and Ready for Implementation
-- ============================================================================

-- ============================================================================
-- CORE AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- 1. auth_user (Django Built-in - Reference Only)
-- This table is managed by Django, included for reference
CREATE TABLE IF NOT EXISTS auth_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) NOT NULL,
    password VARCHAR(128) NOT NULL, -- PBKDF2 SHA256 hash
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_auth_user_username ON auth_user(username);
CREATE INDEX idx_auth_user_email ON auth_user(email);

-- 2. EvalMateApp_profile
-- Extended user profile for students and faculty
CREATE TABLE IF NOT EXISTS EvalMateApp_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    account_type VARCHAR(10) NOT NULL CHECK (account_type IN ('student', 'faculty')),
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    email VARCHAR(254) NOT NULL,
    student_id VARCHAR(20),
    phone_number VARCHAR(15),
    institution VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    academic_year VARCHAR(20),
    expected_graduation DATE,
    current_gpa DECIMAL(3,2) CHECK (current_gpa >= 0 AND current_gpa <= 5.0),
    date_of_birth DATE,
    profile_picture VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_profile_user_id ON EvalMateApp_profile(user_id);
CREATE INDEX idx_profile_account_type ON EvalMateApp_profile(account_type);
CREATE INDEX idx_profile_institution_department ON EvalMateApp_profile(institution, department);
CREATE INDEX idx_profile_student_id ON EvalMateApp_profile(student_id) WHERE student_id IS NOT NULL;

-- ============================================================================
-- COURSE & TEAM MANAGEMENT
-- ============================================================================

-- 3. EvalMateApp_course
-- Course/subject management
CREATE TABLE IF NOT EXISTS EvalMateApp_course (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    semester VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    institution VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_instructor ON EvalMateApp_course(instructor_id);
CREATE INDEX idx_course_code_semester_year ON EvalMateApp_course(code, semester, year);
CREATE INDEX idx_course_institution_department ON EvalMateApp_course(institution, department);

-- 4. EvalMateApp_team
-- Student teams/groups for evaluations
CREATE TABLE IF NOT EXISTS EvalMateApp_team (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES EvalMateApp_course(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES EvalMateApp_profile(id) ON DELETE SET NULL
);

CREATE INDEX idx_team_course ON EvalMateApp_team(course_id);
CREATE INDEX idx_team_created_by ON EvalMateApp_team(created_by_id);

-- 5. EvalMateApp_teammember
-- Many-to-many relationship between teams and students
CREATE TABLE IF NOT EXISTS EvalMateApp_teammember (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES EvalMateApp_team(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE,
    UNIQUE(team_id, student_id)
);

CREATE UNIQUE INDEX idx_team_student ON EvalMateApp_teammember(team_id, student_id);
CREATE INDEX idx_teammember_student ON EvalMateApp_teammember(student_id);

-- ============================================================================
-- EVALUATION SYSTEM
-- ============================================================================

-- 6. EvalMateApp_evaluation
-- Evaluation forms created by faculty
CREATE TABLE IF NOT EXISTS EvalMateApp_evaluation (
    id SERIAL PRIMARY KEY,
    created_by_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    team_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    passcode VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP,
    time_limit INTEGER CHECK (time_limit > 0 OR time_limit IS NULL),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'closed', 'archived')),
    color_theme VARCHAR(7) DEFAULT '#2D3A52',
    is_anonymous BOOLEAN DEFAULT TRUE,
    show_results BOOLEAN DEFAULT FALSE,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    max_submissions INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES EvalMateApp_course(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES EvalMateApp_team(id) ON DELETE SET NULL,
    CHECK (end_date > start_date)
);

CREATE INDEX idx_evaluation_created_by ON EvalMateApp_evaluation(created_by_id);
CREATE INDEX idx_evaluation_course ON EvalMateApp_evaluation(course_id);
CREATE INDEX idx_evaluation_team ON EvalMateApp_evaluation(team_id);
CREATE INDEX idx_evaluation_status ON EvalMateApp_evaluation(status);
CREATE INDEX idx_evaluation_dates ON EvalMateApp_evaluation(start_date, end_date, status);

-- 7. EvalMateApp_section
-- Sections/categories within an evaluation form
CREATE TABLE IF NOT EXISTS EvalMateApp_section (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL CHECK ("order" >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE
);

CREATE INDEX idx_section_evaluation_order ON EvalMateApp_section(evaluation_id, "order");

-- 8. EvalMateApp_question
-- Individual questions within evaluation forms
CREATE TABLE IF NOT EXISTS EvalMateApp_question (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL,
    section_id INTEGER,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('rating', 'text', 'multiple', 'checkbox', 'slider', 'likert')),
    is_required BOOLEAN DEFAULT TRUE,
    "order" INTEGER NOT NULL CHECK ("order" >= 0),
    options JSONB,
    validation_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES EvalMateApp_section(id) ON DELETE CASCADE
);

CREATE INDEX idx_question_evaluation_order ON EvalMateApp_question(evaluation_id, "order");
CREATE INDEX idx_question_section_order ON EvalMateApp_question(section_id, "order");
CREATE INDEX idx_question_type ON EvalMateApp_question(question_type);
CREATE INDEX idx_question_options ON EvalMateApp_question USING GIN (options);

-- 9. EvalMateApp_evaluationsettings
-- Additional settings for evaluations (1:1 with Evaluation)
CREATE TABLE IF NOT EXISTS EvalMateApp_evaluationsettings (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER UNIQUE NOT NULL,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    show_results BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,
    randomize_questions BOOLEAN DEFAULT FALSE,
    require_all_responses BOOLEAN DEFAULT TRUE,
    send_reminders BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 2 CHECK (reminder_days_before >= 0),
    notification_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_evaluationsettings_evaluation ON EvalMateApp_evaluationsettings(evaluation_id);

-- ============================================================================
-- RESPONSE & ANSWER SYSTEM
-- ============================================================================

-- 10. EvalMateApp_response
-- Student responses/submissions to evaluations
CREATE TABLE IF NOT EXISTS EvalMateApp_response (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    evaluated_peer_id INTEGER,
    team_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'late', 'incomplete')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_spent INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_id) REFERENCES EvalMateApp_evaluation(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluated_peer_id) REFERENCES EvalMateApp_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES EvalMateApp_team(id) ON DELETE SET NULL,
    CHECK (submitted_at IS NULL OR submitted_at >= started_at)
);

CREATE INDEX idx_response_evaluation ON EvalMateApp_response(evaluation_id);
CREATE INDEX idx_response_student ON EvalMateApp_response(student_id);
CREATE INDEX idx_response_evaluated_peer ON EvalMateApp_response(evaluated_peer_id);
CREATE INDEX idx_response_team ON EvalMateApp_response(team_id);
CREATE INDEX idx_response_status ON EvalMateApp_response(status);

-- Unique constraint: prevent duplicate submissions
CREATE UNIQUE INDEX idx_unique_submission 
ON EvalMateApp_response(evaluation_id, student_id, evaluated_peer_id)
WHERE status = 'submitted';

-- 11. EvalMateApp_answer
-- Individual answers to specific questions
CREATE TABLE IF NOT EXISTS EvalMateApp_answer (
    id SERIAL PRIMARY KEY,
    response_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (response_id) REFERENCES EvalMateApp_response(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES EvalMateApp_question(id) ON DELETE CASCADE,
    UNIQUE(response_id, question_id)
);

CREATE INDEX idx_answer_response ON EvalMateApp_answer(response_id);
CREATE INDEX idx_answer_question ON EvalMateApp_answer(question_id);
CREATE UNIQUE INDEX idx_answer_response_question ON EvalMateApp_answer(response_id, question_id);
CREATE INDEX idx_answer_value ON EvalMateApp_answer USING GIN (answer_value);

-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- 12. EvalMateApp_notification
-- User notifications for various events
CREATE TABLE IF NOT EXISTS EvalMateApp_notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'evaluation_assigned',
        'evaluation_due_soon',
        'evaluation_overdue',
        'evaluation_submitted',
        'results_available',
        'team_invitation',
        'system_announcement'
    )),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_object_type VARCHAR(50),
    related_object_id INTEGER,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_user_read ON EvalMateApp_notification(user_id, is_read);
CREATE INDEX idx_notification_created_at ON EvalMateApp_notification(created_at DESC);
CREATE INDEX idx_notification_type ON EvalMateApp_notification(type);

-- ============================================================================
-- SESSION MANAGEMENT
-- ============================================================================

-- 13. django_session (Django Built-in - Reference Only)
-- Session management for authenticated users
CREATE TABLE IF NOT EXISTS django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date TIMESTAMP NOT NULL
);

CREATE INDEX idx_django_session_expire_date ON django_session(expire_date);

-- ============================================================================
-- ADDITIONAL COMMENTS & DOCUMENTATION
-- ============================================================================

-- Question Types JSON Structure Examples:
-- 
-- Rating:
-- {
--   "min": 1,
--   "max": 10,
--   "labels": ["Poor", "Excellent"]
-- }
--
-- Multiple Choice:
-- {
--   "choices": ["Option 1", "Option 2", "Option 3"]
-- }
--
-- Checkbox:
-- {
--   "choices": ["Choice 1", "Choice 2"],
--   "min_selections": 1,
--   "max_selections": 3
-- }
--
-- Slider:
-- {
--   "min": 0,
--   "max": 100,
--   "step": 5,
--   "labels": ["Low", "High"]
-- }
--
-- Text:
-- {
--   "max_length": 500,
--   "min_length": 10
-- }

-- Answer Value JSON Structure Examples:
--
-- Rating:
-- {
--   "value": 8,
--   "comment": "Optional comment"
-- }
--
-- Text:
-- {
--   "value": "Long text response here..."
-- }
--
-- Multiple:
-- {
--   "selected": "Option 2"
-- }
--
-- Checkbox:
-- {
--   "selected": ["Choice 1", "Choice 3"]
-- }
--
-- Slider:
-- {
--   "value": 75
-- }

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES (PostgreSQL)
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_profile_updated_at BEFORE UPDATE ON EvalMateApp_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_updated_at BEFORE UPDATE ON EvalMateApp_course
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON EvalMateApp_team
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_updated_at BEFORE UPDATE ON EvalMateApp_evaluation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_updated_at BEFORE UPDATE ON EvalMateApp_question
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluationsettings_updated_at BEFORE UPDATE ON EvalMateApp_evaluationsettings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_updated_at BEFORE UPDATE ON EvalMateApp_response
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- To use this schema:
-- 1. Connect to your PostgreSQL/Supabase database
-- 2. Execute this entire SQL file
-- 3. Run Django migrations to ensure compatibility: python manage.py migrate
--
-- Note: This schema is designed for PostgreSQL. Some syntax may need
-- adjustment for other database systems.

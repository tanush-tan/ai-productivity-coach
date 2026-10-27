-- ============================================================
-- Migration: 001_initial_schema
-- Description: Create all application tables, constraints,    
--              indexes, and the student-profile ownership     
--              trigger for AI Productivity Coach.
--
-- NOTE: schema_migrations is created and managed exclusively  
--       by migrate.js. Do not create or reference it here.    
--
-- Table creation order respects FK dependencies:
--   users
--   -> student_profiles  (references users twice)
--   -> devices           (references users + student_profiles)
--   -> study_sessions    (references student_profiles + devices)
--   -> session_app_usage (references study_sessions)
--   -> session_logs      (references study_sessions)
--   -> pairing_codes     (references users)
-- ============================================================


-- ------------------------------------------------------------
-- 1. users
--    Holds every account (role = 'parent' | 'student').       
--    Soft-deleted via deleted_at; physical DELETE is blocked  
--    by RESTRICT on child tables while child rows exist.      
-- ------------------------------------------------------------
CREATE TABLE users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        NOT NULL UNIQUE,
  password_hash  TEXT        NOT NULL,
  role           TEXT        NOT NULL CHECK (role IN ('parent', 'student')),
  display_name   TEXT        NOT NULL,
  deleted_at     TIMESTAMPTZ,           -- NULL = active; set to NOW() to deactivate
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- 2. student_profiles
--    Extended information for a student account.
--    parent_id links to the managing parent user.
--    Both FKs use RESTRICT: physical deletion of a user row   
--    is blocked while a student_profiles row references it,   
--    forcing the soft-delete path for normal deactivation.    
--    Soft-deleted via deleted_at (consistent with users).     
-- ------------------------------------------------------------
CREATE TABLE student_profiles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  parent_id       UUID        NOT NULL        REFERENCES users(id) ON DELETE RESTRICT,
  grade           TEXT,
  school          TEXT,
  initials        TEXT,
  daily_goal_mins INT         NOT NULL DEFAULT 120 CHECK (daily_goal_mins > 0),
  deleted_at      TIMESTAMPTZ,           -- NULL = active      
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- Ownership trigger for student_profiles
--
-- Enforces that:
--   - user_id always references a user with role = 'student'  
--   - parent_id always references a user with role = 'parent' 
--
-- This is necessary because PostgreSQL FK constraints cannot  
-- filter by another column (WHERE role = '...'), so the       
-- application layer check alone is insufficient for direct    
-- SQL inserts or future migrations.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_student_profile_roles()       
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.user_id) <> 'student' THEN
    RAISE EXCEPTION
      'student_profiles.user_id must reference a user with role=student (got id=%)',
      NEW.user_id;
  END IF;

  IF (SELECT role FROM users WHERE id = NEW.parent_id) <> 'parent' THEN
    RAISE EXCEPTION
      'student_profiles.parent_id must reference a user with role=parent (got id=%)',
      NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_student_profile_roles
  BEFORE INSERT OR UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION check_student_profile_roles(); 


-- ------------------------------------------------------------
-- Role-change protection trigger on users
--
-- The trigger above validates roles when student_profiles rows
-- are written, but cannot intercept a direct UPDATE on users  
-- such as: UPDATE users SET role = 'parent' WHERE id = <student>.
--
-- This trigger fires BEFORE UPDATE on users and blocks any role
-- change that would invalidate an existing student_profiles row:
--   - Changing away from 'student': blocked if a student_profiles
--     row still uses this user as user_id.
--   - Changing away from 'parent': blocked if a student_profiles
--     row still uses this user as parent_id.
--
-- If the role is not changing, the trigger returns immediately
-- with no overhead.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_user_role_change_if_referenced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Early exit: role is not changing, nothing to validate.    
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  -- Changing away from 'student': block if this user is referenced
  -- as user_id in any student_profiles row.
  IF OLD.role = 'student' THEN
    IF EXISTS (
      SELECT 1 FROM student_profiles WHERE user_id = NEW.id    
    ) THEN
      RAISE EXCEPTION
        'Cannot change role of user % from student: student_profiles.user_id still references this user',
        NEW.id;
    END IF;
  END IF;

  -- Changing away from 'parent': block if this user is referenced
  -- as parent_id in any student_profiles row.
  IF OLD.role = 'parent' THEN
    IF EXISTS (
      SELECT 1 FROM student_profiles WHERE parent_id = NEW.id  
    ) THEN
      RAISE EXCEPTION
        'Cannot change role of user % from parent: student_profiles.parent_id still references this user',
        NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_user_role_change_if_referenced      
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_user_role_change_if_referenced();


-- ------------------------------------------------------------
-- 3. devices
--    Supervised hardware paired to a parent account.
--    student_id is nullable (SET NULL): removing a student    
--    profile unassigns but does not delete the device.        
--    parent_id uses RESTRICT: device inventory must be        
--    explicitly managed before the parent can be physically   
--    deleted (normal path is soft-delete via users.deleted_at).
-- ------------------------------------------------------------
CREATE TABLE devices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID        NOT NULL REFERENCES users(id)            ON DELETE RESTRICT,
  student_id    UUID                 REFERENCES student_profiles(id) ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  device_type   TEXT        NOT NULL
                            CHECK (device_type IN ('laptop', 'desktop', 'tablet', 'phone', 'other')),
  model         TEXT,
  device_code   TEXT        UNIQUE,         -- permanent identifier assigned after pairing
  agent_version TEXT,
  status        TEXT        NOT NULL DEFAULT 'offline'
                            CHECK (status IN ('online', 'offline')),
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ------------------------------------------------------------
-- Device-student ownership trigger on devices
--
-- devices.parent_id and devices.student_id are separate FKs.  
-- A composite FK cannot be used here because the existing     
-- ON DELETE SET NULL on student_id would require nulling out  
-- parent_id too (which is NOT NULL).
--
-- This trigger fires BEFORE INSERT OR UPDATE on devices and   
-- ensures that when student_id is not NULL, the referenced    
-- student_profiles row has a parent_id equal to the device's  
-- own parent_id. Rows with student_id = NULL (unassigned      
-- devices) pass the check unconditionally.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_device_student_ownership()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  profile_parent_id UUID;
BEGIN
  -- Unassigned devices are always valid; skip the check.
  IF NEW.student_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lock the profile row while validating ownership. This serializes
  -- device assignment with concurrent parent reassignment.
  SELECT parent_id
    INTO profile_parent_id
    FROM student_profiles
   WHERE id = NEW.student_id
   FOR UPDATE;

  IF NOT FOUND OR profile_parent_id IS DISTINCT FROM NEW.parent_id THEN
    RAISE EXCEPTION
      'devices.student_id (%) must belong to the same parent as devices.parent_id (%)',
      NEW.student_id, NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_device_student_ownership
  BEFORE INSERT OR UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION check_device_student_ownership();


-- ------------------------------------------------------------
-- Prevent parent reassignment from invalidating device ownership
--
-- A student's parent may be changed only when every device assigned
-- to that profile will still have the same parent_id. The device
-- ownership trigger locks the profile row while assigning a device,
-- so these checks serialize with concurrent device assignments.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_invalid_student_parent_reassignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_id IS NOT DISTINCT FROM OLD.parent_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM devices
     WHERE student_id = NEW.id
       AND parent_id <> NEW.parent_id
  ) THEN
    RAISE EXCEPTION
      'Cannot change parent for student profile %: assigned devices would belong to a different parent',
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_invalid_student_parent_reassignment
  BEFORE UPDATE OF parent_id ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_invalid_student_parent_reassignment();


-- 4. study_sessions
--    A single supervised or self-directed study block.        
--
--    student_id uses RESTRICT: study history is the core      
--    product value and must not be silently destroyed.        
--    Physical deletion of a student_profiles row is blocked   
--    while sessions reference it; the normal deactivation     
--    path is student_profiles.deleted_at. Explicit archival   
--    or deletion of sessions must precede physical profile    
--    removal.
--
--    device_id uses SET NULL: sessions retain their data if   
--    the device is subsequently removed from the account.     
-- ------------------------------------------------------------
CREATE TABLE study_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  device_id         UUID                 REFERENCES devices(id)           ON DELETE SET NULL,
  title             TEXT        NOT NULL,
  subject           TEXT,
  status            TEXT        NOT NULL DEFAULT 'active'      
                                CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),        
  ended_at          TIMESTAMPTZ,
  duration_seconds  INT         CHECK (duration_seconds >= 0), 
  focus_score       NUMERIC(5,2) CHECK (focus_score BETWEEN 0 AND 100),
  goal_text         TEXT,
  notes             TEXT,
  primary_app       TEXT,
  category          TEXT,
  distraction_count INT         NOT NULL DEFAULT 0 CHECK (distraction_count >= 0),
  is_user_recorded  BOOLEAN     NOT NULL DEFAULT FALSE,        
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),        

  -- Table-level constraints: cross-column comparisons require table scope
  CONSTRAINT chk_session_end_after_start CHECK (ended_at IS NULL OR ended_at > started_at),
  CONSTRAINT chk_session_completed_has_duration
    CHECK (status <> 'completed' OR duration_seconds IS NOT NULL)
);


-- ------------------------------------------------------------
-- 5. session_app_usage
--    Per-app time breakdown within a session.
--    Follows the session unconditionally (CASCADE).
-- ------------------------------------------------------------
CREATE TABLE session_app_usage (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  session_id       UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  app_name         TEXT NOT NULL,
  category         TEXT,
  duration_seconds INT  NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0)
);


-- ------------------------------------------------------------
-- 6. session_logs
--    Timestamped event log for a session.
--    Follows the session unconditionally (CASCADE).
-- ------------------------------------------------------------
CREATE TABLE session_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID        NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event      TEXT        NOT NULL
);


-- ------------------------------------------------------------
-- 7. pairing_codes
--    Short-lived, single-use codes for device pairing.        
--
--    Security design:
--      - Raw code is never stored; only its SHA-256 hash.     
--      - Raw code is generated as gen_random_bytes(16) ->    
--        base32 encoded (128 bits of entropy) by the API.     
--      - The raw code is returned once in the API response    
--        and never retrievable again.
--      - attempt_count lets the API lock a code after a       
--        configurable number of failed guesses (e.g. 5).      
--
--    Expiry check is a table-level constraint because it      
--    compares two columns (expires_at and created_at).        
--    A column-level CHECK cannot reference other columns      
--    in PostgreSQL reliably.
-- ------------------------------------------------------------
CREATE TABLE pairing_codes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash     TEXT        NOT NULL UNIQUE,
  used          BOOLEAN     NOT NULL DEFAULT FALSE,
  attempt_count INT         NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Table-level constraint: expires_at must be strictly after created_at
  CONSTRAINT chk_pairing_code_expiry CHECK (expires_at > created_at)
);


-- ============================================================
-- INDEXES
-- ============================================================

-- student_profiles: parent's child list (scopes every parent dashboard query)
CREATE INDEX idx_student_profiles_parent_id
  ON student_profiles(parent_id);

-- devices: parent's device list (ConnectedDevices view)       
CREATE INDEX idx_devices_parent_id
  ON devices(parent_id);

-- devices: online/offline filter tab
CREATE INDEX idx_devices_status
  ON devices(status);

-- study_sessions: most queries are scoped by student
CREATE INDEX idx_study_sessions_student_id
  ON study_sessions(student_id);

-- study_sessions: parent monitoring view filtered by device   
CREATE INDEX idx_study_sessions_device_id
  ON study_sessions(device_id);

-- study_sessions: "Active Sessions" summary card
CREATE INDEX idx_study_sessions_status
  ON study_sessions(status);

-- study_sessions: date-range queries (weekly chart, reports)  
CREATE INDEX idx_study_sessions_started_at
  ON study_sessions(started_at);

-- study_sessions: composite covering index -- most common pattern:
--   "sessions for student X ordered by date DESC"
CREATE INDEX idx_study_sessions_student_date
  ON study_sessions(student_id, started_at DESC);

-- session_app_usage: always fetched for one session at a time 
CREATE INDEX idx_session_app_usage_session
  ON session_app_usage(session_id);

-- session_logs: fetched for one session, ordered by time      
CREATE INDEX idx_session_logs_session
  ON session_logs(session_id, logged_at);

-- pairing_codes: cleanup of expired unused codes (partial index --
--   stays small because used codes are excluded)
CREATE INDEX idx_pairing_codes_expires_at
  ON pairing_codes(expires_at)
  WHERE used = FALSE;

-- SSHP School–Teacher Direct Recruitment Link
-- Import this once into the same MySQL/MariaDB database used by the SSHP API.
CREATE TABLE IF NOT EXISTS career_users (
  id VARCHAR(64) PRIMARY KEY,
  role ENUM('school','teacher') NOT NULL,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_json JSON NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_cu_role(role), INDEX idx_cu_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS career_sessions (
  id CHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_cs_user(user_id), INDEX idx_cs_expiry(expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vacancies (
  id VARCHAR(64) PRIMARY KEY,
  school_user_id VARCHAR(64) NOT NULL,
  title VARCHAR(190) NOT NULL,
  subject VARCHAR(190) NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  location VARCHAR(190) NOT NULL,
  employment_type VARCHAR(100) NOT NULL DEFAULT 'Full-time',
  details TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_v_school(school_user_id), INDEX idx_v_status(status), INDEX idx_v_subject(subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_applications (
  id VARCHAR(64) PRIMARY KEY,
  vacancy_id VARCHAR(64) NOT NULL,
  teacher_user_id VARCHAR(64) NOT NULL,
  cover_note TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'applied',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_application(vacancy_id, teacher_user_id),
  INDEX idx_ja_vacancy(vacancy_id), INDEX idx_ja_teacher(teacher_user_id), INDEX idx_ja_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS career_messages (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) NOT NULL,
  sender_user_id VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_cm_application(application_id), INDEX idx_cm_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS career_notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id VARCHAR(64) NULL,
  read_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  INDEX idx_cn_user(user_id), INDEX idx_cn_read(read_flag), INDEX idx_cn_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE profiles (
  user_id   VARCHAR(64)  NOT NULL,
  full_name VARCHAR(255) NULL,
  email     VARCHAR(320) NOT NULL,
  phone     VARCHAR(32)  NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_profiles_email (email),
  UNIQUE KEY uq_profiles_phone (phone)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
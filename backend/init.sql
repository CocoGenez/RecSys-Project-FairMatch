-- FairMatch Local Database Initialization Script
-- This script creates the necessary tables for the application

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50),
    name VARCHAR(255),
    gender VARCHAR(50),
    interested_domain VARCHAR(255),
    age INTEGER,
    projects JSONB,
    future_career VARCHAR(255),
    python_level VARCHAR(50),
    sql_level VARCHAR(50),
    java_level VARCHAR(50),
    resume_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    timestamp VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON interactions(action);

COMMIT;

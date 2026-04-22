-- ============================================================
-- HAIRGURU Database Schema - PostgreSQL
-- AI-Powered Hairstyle Recommendation System
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Face Shapes
-- ============================================================
CREATE TABLE face_shapes (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    note            TEXT,           -- styling tip for this shape
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. Hairstyles
-- ============================================================
CREATE TABLE hairstyles (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL UNIQUE,
    description     TEXT,
    image_url       TEXT,
    gender          VARCHAR(20) DEFAULT 'unisex'
                        CHECK (gender IN ('male', 'female', 'unisex')),
    length_category VARCHAR(20)
                        CHECK (length_category IN ('short', 'medium', 'long')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. Recommended hairstyles per face shape (many-to-many)
-- ============================================================
CREATE TABLE face_shape_recommendations (
    id              SERIAL PRIMARY KEY,
    face_shape_id   INT NOT NULL REFERENCES face_shapes(id) ON DELETE CASCADE,
    hairstyle_id    INT NOT NULL REFERENCES hairstyles(id) ON DELETE CASCADE,
    score           NUMERIC(3,2) DEFAULT 1.00,   -- relevance weight 0-1
    UNIQUE (face_shape_id, hairstyle_id)
);

-- ============================================================
-- 4. Hairstyles to AVOID per face shape
-- ============================================================
CREATE TABLE face_shape_avoid (
    id              SERIAL PRIMARY KEY,
    face_shape_id   INT NOT NULL REFERENCES face_shapes(id) ON DELETE CASCADE,
    hairstyle_id    INT NOT NULL REFERENCES hairstyles(id) ON DELETE CASCADE,
    reason          TEXT,
    UNIQUE (face_shape_id, hairstyle_id)
);

-- ============================================================
-- 5. Users
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200),
    gender          VARCHAR(20) DEFAULT 'unisex'
                        CHECK (gender IN ('male', 'female', 'unisex')),
    profile_image   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. User face analyses (one user can have many analyses)
-- ============================================================
CREATE TABLE user_analyses (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_path      TEXT NOT NULL,
    -- probabilities from the model
    prob_heart      NUMERIC(5,4) DEFAULT 0,
    prob_oblong     NUMERIC(5,4) DEFAULT 0,
    prob_oval       NUMERIC(5,4) DEFAULT 0,
    prob_round      NUMERIC(5,4) DEFAULT 0,
    prob_square     NUMERIC(5,4) DEFAULT 0,
    -- top predictions
    primary_shape_id   INT REFERENCES face_shapes(id),
    secondary_shape_id INT REFERENCES face_shapes(id),
    analyzed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. User saved / favorite hairstyles
-- ============================================================
CREATE TABLE user_favorites (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hairstyle_id    INT NOT NULL REFERENCES hairstyles(id) ON DELETE CASCADE,
    saved_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, hairstyle_id)
);

-- ============================================================
-- 8. Feedback on recommendations
-- ============================================================
CREATE TABLE user_feedback (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_id     INT NOT NULL REFERENCES user_analyses(id) ON DELETE CASCADE,
    hairstyle_id    INT NOT NULL REFERENCES hairstyles(id) ON DELETE CASCADE,
    rating          INT CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_analyses_user        ON user_analyses(user_id);
CREATE INDEX idx_analyses_primary     ON user_analyses(primary_shape_id);
CREATE INDEX idx_recommendations_shape ON face_shape_recommendations(face_shape_id);
CREATE INDEX idx_favorites_user       ON user_favorites(user_id);
CREATE INDEX idx_feedback_user        ON user_feedback(user_id);
CREATE INDEX idx_feedback_analysis    ON user_feedback(analysis_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_face_shapes_updated
    BEFORE UPDATE ON face_shapes
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_hairstyles_updated
    BEFORE UPDATE ON hairstyles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

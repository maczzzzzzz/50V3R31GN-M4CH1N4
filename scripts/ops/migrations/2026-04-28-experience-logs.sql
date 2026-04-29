-- Migration: Add Experience Logs table
-- v3.8.8 Experience-Gitting Mandate

CREATE TABLE IF NOT EXISTS experience_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent_id TEXT NOT NULL,
    task_description TEXT NOT NULL,
    failure_trajectory TEXT NOT NULL, -- JSON trace of the failed path
    learned_fix TEXT,                -- The correction used to succeed
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exp_agent ON experience_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_exp_severity ON experience_logs(severity);

-- Add Research Shards table for the Research Profile
CREATE TABLE IF NOT EXISTS research_shards (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    profile_id TEXT DEFAULT 'RESEARCHER',
    topic TEXT NOT NULL,
    summary TEXT NOT NULL,
    sources_json TEXT NOT NULL DEFAULT '[]',
    triplet_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

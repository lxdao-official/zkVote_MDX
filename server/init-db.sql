-- 初始化教程反馈表
-- 运行此脚本以手动创建数据库表

-- 如果表已存在则删除（谨慎使用！）
-- DROP TABLE IF EXISTS tutorial_feedback;

-- 创建反馈表
CREATE TABLE IF NOT EXISTS tutorial_feedback (
    id SERIAL PRIMARY KEY,
    understanding_zk INTEGER NOT NULL CHECK (understanding_zk >= 1 AND understanding_zk <= 5),
    content_clarity INTEGER NOT NULL CHECK (content_clarity >= 1 AND content_clarity <= 5),
    content_depth INTEGER NOT NULL CHECK (content_depth >= 1 AND content_depth <= 5),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(42), -- 用于存储用户钱包地址
    user_agent TEXT
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_submitted_at ON tutorial_feedback(submitted_at);

-- 查看表结构
\d tutorial_feedback

-- 查看现有数据（如果有）
SELECT COUNT(*) as total_feedback FROM tutorial_feedback;

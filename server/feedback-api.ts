import express from 'express'
import { Pool } from 'pg'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3001

// PostgreSQL 连接配置
const pool = new Pool({
  connectionString: 'postgres://postgres:hfRvEjFl802JTBqFrp7o5OTTKvHwwFOmHQqzwen3gzrXk3bfT9LwMXdH24bVUK8K@5.78.138.28:4008/postgres',
  ssl: false
})

// 测试数据库连接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('数据库连接失败:', err)
  } else {
    console.log('数据库连接成功:', res.rows[0])
  }
})

// 中间件
app.use(cors())
app.use(express.json())

// 初始化数据库表
const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tutorial_feedback (
      id SERIAL PRIMARY KEY,
      understanding_zk INTEGER NOT NULL CHECK (understanding_zk >= 1 AND understanding_zk <= 5),
      content_clarity INTEGER NOT NULL CHECK (content_clarity >= 1 AND content_clarity <= 5),
      content_depth INTEGER NOT NULL CHECK (content_depth >= 1 AND content_depth <= 5),
      comments TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_submitted_at ON tutorial_feedback(submitted_at);
  `

  try {
    await pool.query(createTableQuery)
    console.log('数据库表初始化成功')
  } catch (error) {
    console.error('数据库表初始化失败:', error)
  }
}

initDB()

// API 端点：提交反馈
app.post('/api/feedback', async (req, res) => {
  try {
    const { understandingZK, contentClarity, contentDepth, comments } = req.body

    // 验证数据
    if (!understandingZK || !contentClarity || !contentDepth) {
      return res.status(400).json({ error: '所有评分都是必填项' })
    }

    if (understandingZK < 1 || understandingZK > 5 ||
        contentClarity < 1 || contentClarity > 5 ||
        contentDepth < 1 || contentDepth > 5) {
      return res.status(400).json({ error: '评分必须在1-5之间' })
    }

    if (comments && comments.length > 500) {
      return res.status(400).json({ error: '意见不能超过500字' })
    }

    // 获取客户端信息
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    // 插入数据
    const insertQuery = `
      INSERT INTO tutorial_feedback 
      (understanding_zk, content_clarity, content_depth, comments, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, submitted_at
    `

    const result = await pool.query(insertQuery, [
      understandingZK,
      contentClarity,
      contentDepth,
      comments || null,
      ipAddress,
      userAgent
    ])

    res.status(201).json({
      success: true,
      message: '反馈提交成功',
      data: {
        id: result.rows[0].id,
        submittedAt: result.rows[0].submitted_at
      }
    })
  } catch (error) {
    console.error('提交反馈时出错:', error)
    res.status(500).json({ error: '服务器错误，请稍后重试' })
  }
})

// API 端点：获取反馈统计（可选，用于管理）
app.get('/api/feedback/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_responses,
        ROUND(AVG(understanding_zk), 2) as avg_understanding_zk,
        ROUND(AVG(content_clarity), 2) as avg_content_clarity,
        ROUND(AVG(content_depth), 2) as avg_content_depth
      FROM tutorial_feedback
    `

    const result = await pool.query(statsQuery)
    res.json(result.rows[0])
  } catch (error) {
    console.error('获取统计数据时出错:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`反馈API服务器运行在 http://localhost:${port}`)
})

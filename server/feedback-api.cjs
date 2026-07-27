const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const path = require('path')

const feedbackSchema = `
  CREATE TABLE IF NOT EXISTS tutorial_feedback (
    id SERIAL PRIMARY KEY,
    understanding_zk INTEGER NOT NULL CHECK (understanding_zk BETWEEN 1 AND 5),
    content_clarity INTEGER NOT NULL CHECK (content_clarity BETWEEN 1 AND 5),
    content_depth INTEGER NOT NULL CHECK (content_depth BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_submitted_at ON tutorial_feedback(submitted_at);

  CREATE TABLE IF NOT EXISTS quiz_results (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    wrong_count INTEGER NOT NULL CHECK (wrong_count >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (correct_count + wrong_count = total_questions)
  );

  CREATE INDEX IF NOT EXISTS idx_wallet_address ON quiz_results(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_submitted_at_quiz ON quiz_results(submitted_at);
`

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max
}

function isWalletAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
}

async function initDb(pool) {
  await pool.query(feedbackSchema)
  await pool.query('SELECT NOW()')
}

function createApp(pool, options = {}) {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '32kb' }))

  app.post('/api/feedback', async (req, res) => {
    try {
      const { understandingZK, contentClarity, contentDepth, comments, walletAddress } = req.body

      if (![understandingZK, contentClarity, contentDepth].every((value) => isIntegerInRange(value, 1, 5))) {
        return res.status(400).json({ error: '评分必须是1-5之间的整数' })
      }
      if (comments !== undefined && comments !== null && typeof comments !== 'string') {
        return res.status(400).json({ error: '意见必须是文本' })
      }
      if (comments && comments.length > 500) {
        return res.status(400).json({ error: '意见不能超过500字' })
      }
      if (walletAddress && !isWalletAddress(walletAddress)) {
        return res.status(400).json({ error: '钱包地址格式无效' })
      }

      const clientAddress = walletAddress || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress
      const result = await pool.query(
        `INSERT INTO tutorial_feedback
         (understanding_zk, content_clarity, content_depth, comments, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, submitted_at`,
        [understandingZK, contentClarity, contentDepth, comments || null, clientAddress || null, req.headers['user-agent'] || null]
      )

      return res.status(201).json({
        success: true,
        message: '反馈提交成功',
        data: { id: result.rows[0].id, submittedAt: result.rows[0].submitted_at }
      })
    } catch (error) {
      console.error('提交反馈时出错:', error)
      return res.status(500).json({ error: '服务器错误，请稍后重试' })
    }
  })

  app.get('/api/feedback/stats', async (_req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(*) as total_responses,
          ROUND(AVG(understanding_zk), 2) as avg_understanding_zk,
          ROUND(AVG(content_clarity), 2) as avg_content_clarity,
          ROUND(AVG(content_depth), 2) as avg_content_depth
        FROM tutorial_feedback
      `)
      return res.json(result.rows[0])
    } catch (error) {
      console.error('获取统计数据时出错:', error)
      return res.status(500).json({ error: '服务器错误' })
    }
  })

  app.post('/api/quiz/submit', async (req, res) => {
    try {
      const { walletAddress, score, correctCount, wrongCount, totalQuestions } = req.body

      if (!isWalletAddress(walletAddress)) {
        return res.status(400).json({ error: '钱包地址格式无效' })
      }
      if (![score, correctCount, wrongCount, totalQuestions].every(Number.isInteger)) {
        return res.status(400).json({ error: '测试结果必须是整数' })
      }
      if (score < 0 || score > 100 || correctCount < 0 || wrongCount < 0 || totalQuestions <= 0 || correctCount + wrongCount !== totalQuestions) {
        return res.status(400).json({ error: '测试结果数据无效' })
      }

      const result = await pool.query(
        `INSERT INTO quiz_results
         (wallet_address, score, correct_count, wrong_count, total_questions)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, submitted_at`,
        [walletAddress, score, correctCount, wrongCount, totalQuestions]
      )

      return res.status(201).json({
        success: true,
        message: '测试结果保存成功',
        data: { id: result.rows[0].id, submittedAt: result.rows[0].submitted_at }
      })
    } catch (error) {
      console.error('保存测试结果时出错:', error)
      return res.status(500).json({ error: '服务器错误，请稍后重试' })
    }
  })

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1')
      return res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
    } catch (error) {
      return res.status(503).json({ status: 'error', database: 'unavailable' })
    }
  })

  if (options.serveStatic !== false) {
    const staticDir = path.join(__dirname, '../dist')
    app.use(express.static(staticDir))
    app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')))
  }

  return app
}

async function start() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const pool = new Pool({ connectionString })
  await initDb(pool)

  const port = Number(process.env.PORT || 3001)
  createApp(pool).listen(port, () => {
    console.log(`ZKVote server listening on port ${port}`)
  })
}

if (require.main === module) {
  start().catch((error) => {
    console.error('ZKVote server startup failed:', error)
    process.exit(1)
  })
}

module.exports = { createApp, initDb, isWalletAddress }

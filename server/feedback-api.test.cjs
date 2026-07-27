const assert = require('node:assert/strict')
const http = require('node:http')
const { test } = require('node:test')
const { createApp, isWalletAddress } = require('./feedback-api.cjs')

function fakePool() {
  const queries = []
  return {
    queries,
    async query(sql, params = []) {
      queries.push({ sql, params })
      if (/COUNT\(\*\)/.test(sql)) {
        return { rows: [{ total_responses: '0', avg_understanding_zk: null, avg_content_clarity: null, avg_content_depth: null }] }
      }
      if (/INSERT INTO/.test(sql)) {
        return { rows: [{ id: 1, submitted_at: new Date('2026-01-01T00:00:00Z') }] }
      }
      return { rows: [{ '?column?': 1 }] }
    }
  }
}

async function withServer(run) {
  const pool = fakePool()
  const server = http.createServer(createApp(pool, { serveStatic: false }))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const { port } = server.address()
    await run(`http://127.0.0.1:${port}`, pool)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test('wallet validation accepts Ethereum addresses only', () => {
  assert.equal(isWalletAddress('0x0000000000000000000000000000000000000001'), true)
  assert.equal(isWalletAddress('not-an-address'), false)
})

test('health checks the database', async () => {
  await withServer(async (base, pool) => {
    const response = await fetch(`${base}/health`)
    assert.equal(response.status, 200)
    assert.equal((await response.json()).database, 'connected')
    assert.match(pool.queries.at(-1).sql, /SELECT 1/)
  })
})

test('feedback validates ratings and writes a valid record', async () => {
  await withServer(async (base, pool) => {
    const invalid = await fetch(`${base}/api/feedback`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ understandingZK: 6, contentClarity: 5, contentDepth: 5 })
    })
    assert.equal(invalid.status, 400)

    const valid = await fetch(`${base}/api/feedback`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ understandingZK: 5, contentClarity: 4, contentDepth: 5, comments: 'test', walletAddress: '0x0000000000000000000000000000000000000001' })
    })
    assert.equal(valid.status, 201)
    assert.match(pool.queries.at(-1).sql, /INSERT INTO tutorial_feedback/)
  })
})

test('quiz endpoint rejects inconsistent results and writes valid results', async () => {
  await withServer(async (base, pool) => {
    const invalid = await fetch(`${base}/api/quiz/submit`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ walletAddress: '0x0000000000000000000000000000000000000001', score: 100, correctCount: 15, wrongCount: 1, totalQuestions: 15 })
    })
    assert.equal(invalid.status, 400)

    const valid = await fetch(`${base}/api/quiz/submit`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ walletAddress: '0x0000000000000000000000000000000000000001', score: 80, correctCount: 12, wrongCount: 3, totalQuestions: 15 })
    })
    assert.equal(valid.status, 201)
    assert.match(pool.queries.at(-1).sql, /INSERT INTO quiz_results/)
  })
})

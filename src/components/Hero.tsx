// src/components/Hero.tsx
import React from 'react'

export default function Hero() {
  return (
    <div style={styles.heroSection}>
      {/* 主标题 */}
      <h1 style={styles.mainTitle}>
        My First <span style={styles.highlight}>ZKVote</span>
      </h1>
      <h2 style={styles.mainTitleChinese}>
        我的第一次 ZK 投票
      </h2>

      {/* 副标题 */}
      <p style={styles.subtitle}>
        在这里，用一次实投票，理解零知识证明在 Web3 里的价值。
      </p>

      {/* 说明小字 */}
      <p style={styles.description}>
        适合刚接触加密世界、想体验 <strong>隐私友好型投票</strong> 的你。
      </p>

      {/* 信息卡片容器 */}
      <div style={styles.infoCards}>
        {/* 时长卡片 */}
        <div style={styles.infoCard}>
          <div style={styles.iconCircle}>⏱️</div>
          <div>
            <div style={styles.cardLabel}>预计体验时长</div>
            <div style={styles.cardValue}>约 1 小时</div>
            <div style={styles.cardNote}>(视个人情况而定)</div>
          </div>
        </div>

        {/* LXDAO 卡片 */}
        <div style={{ ...styles.infoCard, ...styles.lxdaoCard }}>
          <div style={styles.iconCircle}>
            <img src="/lxdao-logo.svg" alt="LXDAO Logo" style={styles.logoImage} />
          </div>
          <div>
            <div style={styles.cardLabel}>构建者</div>
            <div style={styles.cardValue}>LXDAO 社区</div>
          </div>
        </div>
      </div>

      {/* 开始按钮 */}
      <button
        style={styles.startButton}
        onClick={() => {
          // 平滑滚动到内容区
          const content = document.querySelector('article')
          if (content) {
            const firstHeading = content.querySelector('h2')
            if (firstHeading) {
              firstHeading.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-6)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-4)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-2)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-6)'
        }}
      >
        开始体验 →
      </button>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  heroSection: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 'var(--spacing-10) var(--spacing-6)',
    backgroundColor: 'rgb(247, 250, 255)',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  mainTitle: {
    fontSize: '3.5rem',
    fontWeight: 'var(--font-weight-semibold)',
    margin: '0 0 var(--spacing-2) 0',
    color: 'var(--neutral-900)',
    lineHeight: 'var(--line-height-tight)',
  },
  highlight: {
    color: 'var(--primary-blue)',
  },
  mainTitleChinese: {
    fontSize: '2rem',
    fontWeight: 'var(--font-weight-semibold)',
    margin: '0 0 var(--spacing-6) 0',
    color: 'var(--neutral-700)',
    lineHeight: 'var(--line-height-tight)',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: 'var(--neutral-700)',
    margin: '0 0 var(--spacing-3) 0',
    maxWidth: '600px',
    lineHeight: 'var(--line-height-relaxed)',
  },
  description: {
    fontSize: '1rem',
    color: 'var(--neutral-600)',
    margin: '0 0 var(--spacing-8) 0',
    maxWidth: '500px',
    lineHeight: 'var(--line-height-relaxed)',
  },
  infoCards: {
    display: 'flex',
    gap: 'var(--spacing-4)',
    marginBottom: 'var(--spacing-8)',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    padding: 'var(--spacing-4) var(--spacing-5)',
    backgroundColor: 'var(--neutral-white)',
    border: '3px solid var(--neutral-black)',
    borderRadius: 'var(--radius-xlarge)',
    boxShadow: 'var(--shadow-level-2)',
    minWidth: '250px',
  },
  lxdaoCard: {
    backgroundColor: 'var(--accent-yellow-light)',
    border: '3px solid var(--accent-yellow-dark)',
  },
  iconCircle: {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    minHeight: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-blue-light)',
    border: '2px solid var(--primary-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
  },
  logoImage: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
    marginLeft: '3px',
  },
  cardLabel: {
    fontSize: '0.875rem',
    color: 'var(--neutral-600)',
    marginBottom: 'var(--spacing-1)',
    fontWeight: 'var(--font-weight-semibold)',
    textAlign: 'left',
  },
  cardValue: {
    fontSize: '1.1rem',
    color: 'var(--neutral-900)',
    fontWeight: 'var(--font-weight-semibold)',
    textAlign: 'left',
  },
  cardNote: {
    fontSize: '0.75rem',
    color: 'var(--neutral-500)',
    marginTop: 'var(--spacing-1)',
    textAlign: 'left',
  },
  startButton: {
    padding: 'var(--spacing-4) var(--spacing-12)',
    backgroundColor: 'var(--accent-yellow)',
    color: 'var(--neutral-black)',
    border: '3px solid var(--neutral-black)',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    fontSize: '1.25rem',
    fontWeight: 'var(--font-weight-semibold)',
    transition: 'all var(--transition-normal) ease',
    boxShadow: 'var(--shadow-bottom-4)',
  },
}

// 响应式样式

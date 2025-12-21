// src/components/Hero.tsx
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'

interface HeroProps {
  onStartClick?: () => void
}

export default function Hero({ onStartClick }: HeroProps) {
  const { t } = useTranslation()

  return (
    <div style={styles.heroSection}>
      {/* 主标题 */}
      <h1 style={styles.mainTitle}>
        My First <span style={styles.highlight}>ZKVote</span>
      </h1>
      <h2 style={styles.mainTitleChinese}>
        {t('hero.subtitle')}
      </h2>

      {/* 副标题 */}
      <p style={styles.subtitle}>
        {t('hero.tagline')}
      </p>

      {/* 说明小字 */}
      <p style={styles.description}>
        <Trans i18nKey="hero.description" components={{ strong: <strong /> }} />
      </p>

      {/* 信息卡片容器 */}
      <div style={styles.infoCards}>
        {/* 时长卡片 */}
        <div style={styles.infoCard}>
          <div style={styles.iconCircle}>⏱️</div>
          <div>
            <div style={styles.cardLabel}>{t('hero.durationLabel')}</div>
            <div style={styles.cardValue}>{t('hero.durationValue')}</div>
            <div style={styles.cardNote}>{t('hero.durationNote')}</div>
          </div>
        </div>

        {/* LXDAO 链接按钮 */}
        <a
          href="https://lxdao.io/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('hero.lxdaoAria')}
          style={{
            ...styles.infoCard,
            ...styles.lxdaoCard,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={styles.iconCircle}>
            <img src="/lxdao-logo.svg" alt="LXDAO Logo" style={styles.logoImage} />
          </div>
          <div>
            <div style={styles.cardLabel}>{t('hero.builderLabel')}</div>
            <div style={styles.cardValue}>{t('hero.builderValue')}</div>
          </div>
        </a>
      </div>

      {/* 开始按钮 */}
      <button
        style={styles.startButton}
        onClick={onStartClick}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-6)'
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-4)'
        }}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.transform = 'translateY(2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-2)'
        }}
        onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-6)'
        }}
      >
        {t('hero.start')}
      </button>

      {/* 滚动提示 */}
      <div style={styles.scrollHint}>
        <div style={styles.scrollIcon}>↓</div>
        <p style={styles.scrollText}>{t('hero.scrollHint')}</p>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  heroSection: {
    width: '100%',
    minHeight: '100vh',
    position: 'relative',
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
  scrollHint: {
    position: 'absolute',
    bottom: 'var(--spacing-10)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
    opacity: 0.6,
  },
  scrollIcon: {
    fontSize: '2rem',
    color: 'var(--primary-blue)',
    animation: 'bounce 2s infinite',
  },
  scrollText: {
    fontSize: '0.875rem',
    color: 'var(--neutral-600)',
    margin: 0,
  },
}

// 添加 CSS 动画
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
  `
  document.head.appendChild(style)
}

// 响应式样式

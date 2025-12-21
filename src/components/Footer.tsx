import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer
      style={{
        width: '100%',
        borderTop: '2px solid var(--neutral-200)',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'var(--spacing-6) var(--spacing-6)',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-4)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--neutral-900)',
            }}
          >
            My First ZKVote
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
            {t('footer.tagline')}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <a
            href="https://lxdao.io/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'var(--accent-yellow-light)',
              border: '2px solid var(--accent-yellow-dark)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--neutral-900)',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-semibold)',
              boxShadow: 'var(--shadow-bottom-2)',
              transition: 'transform var(--transition-normal) ease',
            }}
            aria-label={t('footer.lxdaoAria')}
          >
            <img
              src="/lxdao-logo.svg"
              alt="LXDAO"
              style={{ width: 18, height: 18, objectFit: 'contain' }}
            />
            <span>{t('footer.builtWith')}</span>
          </a>

          <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
            © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  )
}

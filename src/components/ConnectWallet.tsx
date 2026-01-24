import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTranslation } from 'react-i18next'

export default function ConnectWallet() {
  const { t } = useTranslation()

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        if (!ready) {
          return (
            <div style={{ opacity: 0, pointerEvents: 'none', userSelect: 'none' }} />
          )
        }

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              style={{
                padding: '6px var(--spacing-5)',
                backgroundColor: 'var(--accent-yellow)',
                color: 'var(--neutral-black)',
                border: '3px solid var(--neutral-black)',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all var(--transition-normal) ease',
                boxShadow: 'var(--shadow-bottom-4)'
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
              {t('wallet.connect')}
            </button>
          )
        }

        if (chain?.unsupported) {
          return (
            <div
              style={{
                padding: '6px var(--spacing-5)',
                backgroundColor: '#ef4444',
                color: 'var(--neutral-white)',
                border: '3px solid #b91c1c',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all var(--transition-normal) ease',
                boxShadow: 'var(--shadow-bottom-4)'
              }}
            >
              Wrong network
            </div>
          )
        }

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              cursor: 'pointer',
              transition: 'all var(--transition-normal) ease'
            }}
          >
            {chain && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--accent-purple-light)',
                  color: 'var(--neutral-900)',
                  borderRadius: 'var(--radius-medium)',
                  fontSize: '0.9rem',
                  fontWeight: 'var(--font-weight-semibold)',
                  border: '2px solid var(--accent-purple)',
                  transition: 'all var(--transition-normal) ease'
                }}
              >
                {chain.name}
              </div>
            )}

            <div
              onClick={openAccountModal}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--neutral-white)',
                color: 'var(--neutral-900)',
                borderRadius: 'var(--radius-medium)',
                fontSize: '0.95rem',
                fontWeight: 'var(--font-weight-semibold)',
                border: '3px solid var(--neutral-black)',
                boxShadow: 'var(--shadow-level-1)',
                transition: 'all var(--transition-normal) ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-level-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-level-1)'
              }}
            >
              {account?.displayName}
            </div>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

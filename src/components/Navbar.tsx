// src/components/Navbar.tsx
import ConnectWallet from './ConnectWallet'

export default function Navbar() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      padding: 'var(--spacing-2) var(--spacing-5)',
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderBottom: '2px solid var(--neutral-200)',
      boxSizing: 'border-box',
      boxShadow: 'var(--shadow-level-1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo / 标题 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--neutral-900)'
          }}>
            My First <span style={{ color: 'var(--primary-blue)' }}>ZKVote</span>
          </h1>
        </div>
        {/* 连接钱包按钮 */}
        <ConnectWallet />
      </div>
    </nav>
  )
}

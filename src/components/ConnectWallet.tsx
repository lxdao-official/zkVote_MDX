// src/components/ConnectWallet.tsx
import { useAccount, useConnect, useDisconnect, useEnsName, useBalance } from 'wagmi'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: balance } = useBalance({ address })
  const [showModal, setShowModal] = useState(false)
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)

  // 创建模态框容器
  useEffect(() => {
    const root = document.getElementById('modal-root') || document.body
    setModalRoot(root)
  }, [])

  // 格式化地址显示
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // 格式化余额显示
  const formatBalance = () => {
    if (!balance || !balance.value) return '0.0000'
    // balance.value 是 BigInt，单位是 wei (1 ETH = 10^18 wei)
    // balance.decimals 告诉我们需要除以 10^decimals
    const decimals = balance.decimals || 18
    const value = Number(balance.value) / Math.pow(10, decimals)
    if (isNaN(value)) return '0.0000'
    return value.toFixed(4)
  }

  if (isConnected && address) {
    return (
      <>
        {/* 钱包信息显示 - 点击打开模态框 */}
        <div
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            cursor: 'pointer',
            transition: 'all var(--transition-normal) ease'
          }}
        >
          {/* 链信息 */}
          {chain && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: 'var(--accent-purple-light)',
              color: 'var(--neutral-900)',
              borderRadius: 'var(--radius-medium)',
              fontSize: '0.9rem',
              fontWeight: 'var(--font-weight-semibold)',
              border: '2px solid var(--accent-purple)',
              transition: 'all var(--transition-normal) ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.backgroundColor = 'var(--accent-purple)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.backgroundColor = 'var(--accent-purple-light)'
            }}
            >
              {chain.name}
            </div>
          )}

          {/* 地址/ENS - 卡片样式 */}
          <div style={{
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
            {ensName || formatAddress(address)}
          </div>
        </div>

        {/* 模态框 - 使用 Portal 渲染到 body */}
        {showModal && modalRoot && createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 'var(--spacing-4)',
              margin: 0
            }}
            onClick={() => setShowModal(false)}
          >
            {/* 模态框内容 */}
            <div
              style={{
                backgroundColor: 'var(--neutral-white)',
                borderRadius: 'var(--radius-xlarge)',
                border: '3px solid var(--neutral-black)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                padding: 'var(--spacing-6)',
                maxWidth: '480px',
                width: '100%',
                animation: 'modalSlideIn 0.3s ease'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 模态框标题 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-6)'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--neutral-900)'
                }}>
                  钱包信息
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid var(--neutral-300)',
                    backgroundColor: 'var(--neutral-white)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    color: 'var(--neutral-600)',
                    transition: 'all var(--transition-normal) ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--neutral-100)'
                    e.currentTarget.style.borderColor = 'var(--neutral-400)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--neutral-white)'
                    e.currentTarget.style.borderColor = 'var(--neutral-300)'
                  }}
                >
                  ×
                </button>
              </div>

              {/* 钱包信息卡片 */}
              <div style={{
                backgroundColor: 'var(--primary-blue-light)',
                border: '2px solid var(--primary-blue)',
                borderRadius: 'var(--radius-large)',
                padding: 'var(--spacing-5)',
                marginBottom: 'var(--spacing-5)'
              }}>
                {/* 链信息 */}
                {chain && (
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--neutral-600)',
                      marginBottom: 'var(--spacing-1)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      网络
                    </label>
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      backgroundColor: 'var(--accent-purple)',
                      color: 'var(--neutral-white)',
                      borderRadius: 'var(--radius-medium)',
                      fontSize: '0.9rem',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      {chain.name}
                    </div>
                  </div>
                )}

                {/* 地址信息 */}
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: 'var(--neutral-600)',
                    marginBottom: 'var(--spacing-1)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    {ensName ? 'ENS 名称' : '钱包地址'}
                  </label>
                  <div style={{
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    backgroundColor: 'var(--neutral-white)',
                    border: '2px solid var(--primary-blue)',
                    borderRadius: 'var(--radius-medium)',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.9rem',
                    color: 'var(--neutral-900)',
                    wordBreak: 'break-all',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    {ensName || address}
                  </div>
                </div>

                {/* 余额信息 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: 'var(--neutral-600)',
                    marginBottom: 'var(--spacing-1)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    余额
                  </label>
                  <div style={{
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    backgroundColor: 'var(--neutral-white)',
                    border: '2px solid var(--primary-blue)',
                    borderRadius: 'var(--radius-medium)',
                    fontSize: '1.1rem',
                    color: 'var(--neutral-900)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    {formatBalance()} {balance?.symbol || 'ETH'}
                  </div>
                </div>
              </div>

              {/* 断开连接按钮 */}
              <button
                onClick={() => {
                  disconnect()
                  setShowModal(false)
                }}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--neutral-white)',
                  color: '#ef4444',
                  border: '3px solid #ef4444',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'var(--font-weight-semibold)',
                  transition: 'all var(--transition-normal) ease',
                  boxShadow: '0 2px 0 #ef4444'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                  e.currentTarget.style.color = 'var(--neutral-white)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 0 #dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--neutral-white)'
                  e.currentTarget.style.color = '#ef4444'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 0 #ef4444'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px)'
                  e.currentTarget.style.boxShadow = '0 0px 0 #ef4444'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 0 #dc2626'
                }}
              >
                断开连接
              </button>
            </div>
          </div>,
          modalRoot
        )}

        {/* 添加模态框动画的样式 */}
        <style>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </>
    )
  }

  // 使用第一个可用的连接器
  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isPending || connectors.length === 0}
      style={{
        padding: 'var(--spacing-3) var(--spacing-10)',
        backgroundColor: 'var(--accent-yellow)',
        color: 'var(--neutral-black)',
        border: '3px solid var(--neutral-black)',
        borderRadius: 'var(--radius-pill)',
        cursor: isPending || connectors.length === 0 ? 'not-allowed' : 'pointer',
        fontSize: '1.1rem',
        fontWeight: 'var(--font-weight-semibold)',
        opacity: isPending || connectors.length === 0 ? 0.7 : 1,
        transition: 'all var(--transition-normal) ease',
        boxShadow: 'var(--shadow-bottom-4)'
      }}
      onMouseEnter={(e) => {
        if (!isPending && connectors.length > 0) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-6)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-bottom-4)'
      }}
      onMouseDown={(e) => {
        if (!isPending && connectors.length > 0) {
          e.currentTarget.style.transform = 'translateY(2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-2)'
        }
      }}
      onMouseUp={(e) => {
        if (!isPending && connectors.length > 0) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-bottom-6)'
        }
      }}
    >
      {isPending ? '连接中...' : '连接钱包'}
    </button>
  )
}

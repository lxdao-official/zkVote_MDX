import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { VotingFlowState, VotingStepId } from '../zk/useZkVotingFlow'
import { useTranslation } from 'react-i18next'

const ALL_STEPS: VotingStepId[] = [
  'STEP1_PREPARE',
  'STEP2_JOIN_GROUP',
  'STEP3_SYNC_MEMBERS',
  'STEP4_GENERATE_PROOF',
  'STEP5_SUBMIT_VOTE',
  'STEP6_CONFIRMATION',
]

type Props = {
  isOpen: boolean
  onClose: () => void
  steps: VotingStepId[]
  flowState: VotingFlowState
}

export default function ZkVoteProgressModal({ isOpen, onClose, steps, flowState }: Props) {
  const { t } = useTranslation()

  const [portalContainer] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null
    const element = document.createElement('div')
    element.setAttribute('data-modal-root', 'zk-vote-progress')
    return element
  })

  useEffect(() => {
    if (!portalContainer || typeof document === 'undefined') return
    document.body.appendChild(portalContainer)
    return () => {
      document.body.removeChild(portalContainer)
    }
  }, [portalContainer])

  if (!isOpen || !portalContainer) return null

  const currentIndex = steps.findIndex((step) => step === flowState.currentStep)
  const isSuccess = flowState.status === 'success'
  const isFailed = flowState.status === 'failed'

  const filteredSteps = ALL_STEPS.filter((stepId) => steps.includes(stepId))
  const errorInfo =
    flowState.errorType && typeof flowState.errorType === 'string'
      ? {
          title: t(`zkModal.errors.${flowState.errorType}.title`),
          action: t(`zkModal.errors.${flowState.errorType}.action`),
        }
      : null

  return createPortal(
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0 }}>{t('zkModal.title')}</h3>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <p style={styles.helper}>{t('zkModal.helper')}</p>

        <ol style={styles.stepList}>
          {filteredSteps.map((stepId, index) => {
            const completed = index < currentIndex || (isSuccess && index === filteredSteps.length - 1)
            const active = index === currentIndex && flowState.status === 'running'
            return (
              <li key={stepId} style={styles.stepItem}>
                <div
                  style={{
                    ...styles.stepIcon,
                    backgroundColor: completed ? '#16a34a' : active ? '#2563eb' : '#e2e8f0',
                    color: completed || active ? '#fff' : '#475569',
                  }}
                >
                  {completed ? '✓' : index + 1}
                </div>
                <div>
                  <div style={styles.stepTitle}>{t(`zkModal.steps.${stepId}.title`)}</div>
                  <div style={styles.stepDesc}>{t(`zkModal.steps.${stepId}.description`)}</div>
                </div>
              </li>
            )
          })}
        </ol>

        {isSuccess && (
          <div style={styles.successBox}>
            {t('zkModal.success', {
              action:
                flowState.lastSuccessTx?.type === 'vote'
                  ? t('zkModal.actionVote')
                  : t('zkModal.actionJoin'),
            })}
            {flowState.lastSuccessTx && (
              <a
                href={`https://sepolia.etherscan.io/tx/${flowState.lastSuccessTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.txLink}
              >
                {t('zkModal.viewTx')}
              </a>
            )}
          </div>
        )}
        {isFailed && errorInfo && (
          <div style={styles.errorBox}>
            <strong>{errorInfo.title}</strong>
            <p style={{ margin: '0.25rem 0 0' }}>{errorInfo.action}</p>
          </div>
        )}
      </div>
    </div>,
    portalContainer,
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15,23,42,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '1.5rem',
    boxSizing: 'border-box',
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-large)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-level-3)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    fontSize: '1.25rem',
    cursor: 'pointer',
  },
  helper: {
    color: '#475569',
    fontSize: '0.9rem',
  },
  stepList: {
    listStyle: 'none',
    margin: '1rem 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  stepIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  },
  stepTitle: {
    fontWeight: 600,
    color: '#0f172a',
  },
  stepDesc: {
    color: '#475569',
    fontSize: '0.85rem',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    border: '1px solid #16a34a',
    padding: '0.75rem',
    borderRadius: 'var(--radius-medium)',
    color: '#166534',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #dc2626',
    padding: '0.75rem',
    borderRadius: 'var(--radius-medium)',
    color: '#991b1b',
  },
  txLink: {
    display: 'block',
    marginTop: '0.5rem',
    color: '#15803d',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
}

import React from 'react'
import type { VotingFlowState, VotingStepId } from '../zk/useZkVotingFlow'

type StepContent = {
  id: VotingStepId
  title: string
  description: string
}

const STEP_COPY: StepContent[] = [
  { id: 'STEP1_PREPARE', title: '准备数据', description: '正在验证投票信息...' },
  { id: 'STEP2_JOIN_GROUP', title: '加入提案群组', description: '正在调用 joinProposal...' },
  { id: 'STEP3_SYNC_MEMBERS', title: '同步成员', description: '正在重建 Merkle Tree...' },
  { id: 'STEP4_GENERATE_PROOF', title: '生成零知识证明', description: '浏览器本地计算，耗时 2-5 秒' },
  { id: 'STEP5_SUBMIT_VOTE', title: '提交投票', description: '等待钱包确认交易...' },
  { id: 'STEP6_CONFIRMATION', title: '区块确认', description: '等待网络确认，通常 10-30 秒' },
]

const ERROR_COPY: Record<string, { title: string; action: string }> = {
  ProposalExpired: { title: '投票已结束', action: '返回详情页' },
  NotJoined: { title: '尚未加入提案', action: '重新加入' },
  InsufficientGas: { title: 'Gas 余额不足', action: '获取测试币后重试' },
  NetworkError: { title: '网络连接异常', action: '检查网络后重试' },
  ProofFailed: { title: '证明生成失败', action: '重新生成证明' },
  UserRejected: { title: '交易被用户取消', action: '重新发起投票' },
}

type Props = {
  isOpen: boolean
  onClose: () => void
  steps: VotingStepId[]
  flowState: VotingFlowState
}

export default function ZkVoteProgressModal({ isOpen, onClose, steps, flowState }: Props) {
  if (!isOpen) return null

  const currentIndex = steps.findIndex((step) => step === flowState.currentStep)
  const isSuccess = flowState.status === 'success'
  const isFailed = flowState.status === 'failed'

  const filteredSteps = STEP_COPY.filter((step) => steps.includes(step.id))
  const errorInfo = flowState.errorType ? ERROR_COPY[flowState.errorType] : null

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0 }}>🛠 ZK 投票流程</h3>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <p style={styles.helper}>请勿关闭或刷新页面，直到所有步骤完成。</p>

        <ol style={styles.stepList}>
          {filteredSteps.map((step, index) => {
            const completed = index < currentIndex || (isSuccess && index === filteredSteps.length - 1)
            const active = index === currentIndex && flowState.status === 'running'
            return (
              <li key={step.id} style={styles.stepItem}>
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
                  <div style={styles.stepTitle}>{step.title}</div>
                  <div style={styles.stepDesc}>{step.description}</div>
                </div>
              </li>
            )
          })}
        </ol>

        {isSuccess && <div style={styles.successBox}>投票成功！交易已确认，感谢你的参与。</div>}
        {isFailed && errorInfo && (
          <div style={styles.errorBox}>
            <strong>{errorInfo.title}</strong>
            <p style={{ margin: '0.25rem 0 0' }}>{errorInfo.action}</p>
          </div>
        )}
      </div>
    </div>
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
}

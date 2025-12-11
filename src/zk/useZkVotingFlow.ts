import { useCallback, useMemo, useState } from 'react'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { wagmiConfig } from '../wagmiConfig'
import { joinProposal, submitZkVote } from './simpleVotingClient'
import { generateSemaphoreProof, type SemaphoreProofOutput } from './semaphoreProofGenerator'
import type { Identity } from '@semaphore-protocol/identity'

export type VotingStepId =
  | 'STEP1_PREPARE'
  | 'STEP2_JOIN_GROUP'
  | 'STEP3_SYNC_MEMBERS'
  | 'STEP4_GENERATE_PROOF'
  | 'STEP5_SUBMIT_VOTE'
  | 'STEP6_CONFIRMATION'
  | 'SUCCESS'
  | 'FAILED'
  | 'IDLE'

export type VotingFlowStatus = 'idle' | 'running' | 'success' | 'failed'

export type VotingErrorType =
  | 'ProposalExpired'
  | 'NotJoined'
  | 'InsufficientGas'
  | 'NetworkError'
  | 'ProofFailed'
  | 'UserRejected'
  | null

export type VotingFlowState = {
  currentStep: VotingStepId
  status: VotingFlowStatus
  requiresJoin: boolean
  errorType: VotingErrorType
  activeSteps: VotingStepId[]
  txHashes: {
    join?: `0x${string}`
    vote?: `0x${string}`
  }
  lastSuccessTx: {
    hash: `0x${string}`
    type: 'join' | 'vote'
  } | null
}

type StartVotingParams = {
  requiresJoin: boolean
  proposalId: number
  optionId: number
  voterAddress: `0x${string}`
  identity?: Identity // Semaphore Identity
  identityCommitment?: bigint // 用于 joinProposal
  groupMembers?: bigint[] // 群组成员列表（用于构建 Merkle Tree）
  mode?: 'full' | 'join-only'
}

const FULL_STEPS: VotingStepId[] = [
  'STEP1_PREPARE',
  'STEP2_JOIN_GROUP',
  'STEP3_SYNC_MEMBERS',
  'STEP4_GENERATE_PROOF',
  'STEP5_SUBMIT_VOTE',
  'STEP6_CONFIRMATION',
]

const NO_JOIN_STEPS: VotingStepId[] = FULL_STEPS.filter((step) => step !== 'STEP2_JOIN_GROUP')
const JOIN_ONLY_STEPS: VotingStepId[] = ['STEP1_PREPARE', 'STEP2_JOIN_GROUP']
const EMPTY_STEPS: VotingStepId[] = ['STEP1_PREPARE']

const initialState: VotingFlowState = {
  currentStep: 'IDLE',
  status: 'idle',
  requiresJoin: false,
  errorType: null,
  activeSteps: FULL_STEPS,
  txHashes: {},
  lastSuccessTx: null,
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mapErrorToType = (err: unknown): VotingErrorType => {
  const message = err instanceof Error ? err.message : ''
  if (/user rejected/i.test(message)) return 'UserRejected'
  if (/insufficient/i.test(message) || /gas/i.test(message)) return 'InsufficientGas'
  if (/expired/i.test(message) || /Voting ended/i.test(message)) return 'ProposalExpired'
  if (/proof/i.test(message)) return 'ProofFailed'
  return 'NetworkError'
}

export function useZkVotingFlow() {
  const [state, setState] = useState<VotingFlowState>(initialState)

  const start = useCallback(
    async ({
      requiresJoin,
      proposalId,
      optionId,
      voterAddress,
      identity,
      identityCommitment,
      groupMembers = [],
      mode = 'full',
    }: StartVotingParams) => {
      const shouldSubmitVote = mode === 'full'
      const steps = (() => {
        if (requiresJoin && shouldSubmitVote) return FULL_STEPS
        if (requiresJoin && !shouldSubmitVote) return JOIN_ONLY_STEPS
        if (!requiresJoin && shouldSubmitVote) return NO_JOIN_STEPS
        return EMPTY_STEPS
      })()

      if (state.status === 'running') return

      setState({
        currentStep: 'STEP1_PREPARE',
        status: 'running',
        requiresJoin,
        errorType: null,
        activeSteps: steps,
        txHashes: {},
        lastSuccessTx: null,
      })

      try {
        // 步骤 1: 加入提案群组 (如果需要)
        if (requiresJoin) {
          if (!identityCommitment) {
            throw new Error('Identity commitment required for joining')
          }
          setState((prev) => ({ ...prev, currentStep: 'STEP2_JOIN_GROUP' }))
          const joinTx = await joinProposal(proposalId, identityCommitment)
          setState((prev) => ({
            ...prev,
            txHashes: { ...prev.txHashes, join: joinTx },
          }))
          await waitForTransactionReceipt(wagmiConfig, { hash: joinTx })
        }

        // 步骤 2: 同步成员 (构建 Merkle Tree)
        if (steps.includes('STEP3_SYNC_MEMBERS')) {
          setState((prev) => ({ ...prev, currentStep: 'STEP3_SYNC_MEMBERS' }))
          // 注意：这里需要从链上获取群组成员列表
          // 实际实现中，groupMembers 应该通过 fetchGroupMembers() 获取
          await sleep(1200)
        }

        // 步骤 3: 生成 Semaphore 证明
        let proofOutput: SemaphoreProofOutput | null = null
        if (steps.includes('STEP4_GENERATE_PROOF')) {
          if (!identity) {
            throw new Error('Semaphore identity required for proof generation')
          }

          if (groupMembers.length === 0) {
            throw new Error('Group members list is required for proof generation')
          }

          setState((prev) => ({ ...prev, currentStep: 'STEP4_GENERATE_PROOF' }))

          // 生成 Semaphore 证明
          proofOutput = await generateSemaphoreProof({
            identity,
            groupMembers,
            proposalId,
            optionId,
          })

        }

        // 步骤 4: 提交投票
        if (steps.includes('STEP5_SUBMIT_VOTE')) {
          if (!proofOutput) {
            throw new Error('Proof generation failed')
          }

          setState((prev) => ({ ...prev, currentStep: 'STEP5_SUBMIT_VOTE' }))
          const voteTx = await submitZkVote(proposalId, optionId, proofOutput)
          setState((prev) => ({
            ...prev,
            txHashes: { ...prev.txHashes, vote: voteTx },
          }))

          setState((prev) => ({ ...prev, currentStep: 'STEP6_CONFIRMATION' }))
          await waitForTransactionReceipt(wagmiConfig, { hash: voteTx })

          setState((prev) => ({
            ...prev,
            currentStep: 'SUCCESS',
            status: 'success',
            errorType: null,
            lastSuccessTx: { hash: voteTx, type: 'vote' },
          }))
          return
        }

        // 仅加入模式的成功状态
        setState((prev) => ({
          ...prev,
          currentStep: 'SUCCESS',
          status: 'success',
          errorType: null,
          lastSuccessTx: prev.txHashes.join ? { hash: prev.txHashes.join, type: 'join' } : null,
        }))
      } catch (err) {
        console.error('[useZkVotingFlow] 流程失败:', err)
        const errorType = mapErrorToType(err)
        setState((prev) => ({
          ...prev,
          currentStep: 'FAILED',
          status: 'failed',
          errorType,
        }))
      }
    },
    [state.status]
  )

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const steps = useMemo(() => state.activeSteps, [state.activeSteps])

  return {
    state,
    steps,
    start,
    reset,
  }
}

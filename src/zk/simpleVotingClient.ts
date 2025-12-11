import { readContract, writeContract } from 'wagmi/actions'
import SimpleVotingV6ABI from '../abi/SimpleVotingV6.json'
import { wagmiConfig } from '../wagmiConfig'
import type { SemaphoreProofOutput } from './semaphoreProofGenerator'

const zkVoteAddress = import.meta.env.VITE_ZK_VOTE_PROXY as `0x${string}`

export const SIMPLE_VOTING_V5_ADDRESS = zkVoteAddress

export type SimpleVotingOption = {
  id: bigint
  name: string
  voteCount: bigint
}

export type ProposalInfo = {
  id: number
  title: string
  isActive: boolean
  createdAt?: number
  groupId?: bigint
  optionCount?: number
}

export async function fetchProposal(proposalId: number): Promise<ProposalInfo> {
  // V5: 使用 getProposalInfo 一次性获取所有信息
  const result = await readContract(wagmiConfig, {
    abi: SimpleVotingV6ABI,
    address: SIMPLE_VOTING_V5_ADDRESS,
    functionName: 'getProposalInfo',
    args: [BigInt(proposalId)],
  }) as [bigint, string, bigint, bigint, bigint, boolean]

  const [id, title, groupId, optionCount, createdAt, isActive] = result

  return {
    id: Number(id),
    title: title,
    isActive: isActive,
    createdAt: Number(createdAt),
    groupId: groupId,
    optionCount: Number(optionCount),
  }
}

export async function fetchOptions(proposalId: number): Promise<SimpleVotingOption[]> {
  const options = (await readContract(wagmiConfig, {
    abi: SimpleVotingV6ABI,
    address: SIMPLE_VOTING_V5_ADDRESS,
    functionName: 'getOptions',
    args: [BigInt(proposalId)],
  })) as SimpleVotingOption[]

  return (options as SimpleVotingOption[]) ?? []
}

export async function joinProposal(proposalId: number, identityCommitment: bigint) {
  return writeContract(wagmiConfig, {
    abi: SimpleVotingV6ABI,
    address: SIMPLE_VOTING_V5_ADDRESS,
    functionName: 'joinProposal',
    args: [BigInt(proposalId), identityCommitment],
    gas: 500000n, // 明确设置 gas limit，Merkle Tree 操作需要较多 gas
  })
}

export async function submitZkVote(
  proposalId: number,
  optionId: number,
  proof: SemaphoreProofOutput
) {
  // 确保所有字段都是正确的 bigint 类型
  const semaphoreProof = {
    merkleTreeDepth: typeof proof.merkleTreeDepth === 'bigint'
      ? proof.merkleTreeDepth
      : BigInt(proof.merkleTreeDepth),
    merkleTreeRoot: proof.merkleTreeRoot,
    nullifier: proof.nullifier,
    message: proof.message,
    scope: proof.scope,
    points: proof.points  // 必须是完整的 [bigint, bigint, ...] 数组
  }

  return writeContract(wagmiConfig, {
    abi: SimpleVotingV6ABI,
    address: SIMPLE_VOTING_V5_ADDRESS,
    functionName: 'vote',
    args: [
      BigInt(proposalId),
      BigInt(optionId),
      semaphoreProof
    ],
    gas: 800000n, // ZK 证明验证需要较多 gas
  })
}

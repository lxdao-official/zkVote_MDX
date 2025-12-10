import { readContract, writeContract } from 'wagmi/actions'
import SimpleVotingV5ABI from '../abi/SimpleVotingV5.json'
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
    abi: SimpleVotingV5ABI,
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
    abi: SimpleVotingV5ABI,
    address: SIMPLE_VOTING_V5_ADDRESS,
    functionName: 'getOptions',
    args: [BigInt(proposalId)],
  })) as SimpleVotingOption[]

  return (options as SimpleVotingOption[]) ?? []
}

export async function joinProposal(proposalId: number, identityCommitment: bigint) {
  return writeContract(wagmiConfig, {
    abi: SimpleVotingV5ABI,
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
  console.log('[submitZkVote] 收到的 proof 参数:', {
    proposalId,
    optionId,
    merkleTreeDepth: proof.merkleTreeDepth,
    merkleTreeDepthType: typeof proof.merkleTreeDepth,
    merkleTreeDepthToString: proof.merkleTreeDepth?.toString(),
    merkleTreeRoot: proof.merkleTreeRoot?.toString(),
    nullifier: proof.nullifier?.toString(),
    pointsLength: proof.points?.length,
  })

  // 确保 merkleTreeDepth 是 bigint
  const merkleTreeDepth = typeof proof.merkleTreeDepth === 'bigint'
    ? proof.merkleTreeDepth
    : BigInt(proof.merkleTreeDepth as any)

  console.log('[submitZkVote] 准备提交的参数:', {
    proposalId: BigInt(proposalId).toString(),
    optionId: BigInt(optionId).toString(),
    merkleTreeDepth: merkleTreeDepth.toString(),
    merkleTreeDepthType: typeof merkleTreeDepth,
    merkleTreeRoot: proof.merkleTreeRoot.toString(),
    nullifier: proof.nullifier.toString(),
  })

  return writeContract(wagmiConfig, {
    abi: SimpleVotingV5ABI,
    address: SIMPLE_VOTING_V5_ADDRESS,
    functionName: 'vote',
    args: [
      BigInt(proposalId),
      BigInt(optionId),
      merkleTreeDepth,
      proof.merkleTreeRoot,
      proof.nullifier,
      proof.points,
    ],
    gas: 800000n, // ZK 证明验证需要较多 gas
  })
}

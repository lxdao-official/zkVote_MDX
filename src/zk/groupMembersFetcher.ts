/**
 * 群组成员获取模块
 *
 * 从链上事件获取 Semaphore 群组成员列表，用于构建 Merkle Tree
 */

import { parseAbiItem } from 'viem'
import { publicClient } from '../wagmiConfig'
import { SIMPLE_VOTING_V5_ADDRESS } from './simpleVotingClient'

// 合约部署区块号（或提案创建区块号）
// 从此区块开始查询事件，避免 RPC "eth_getLogs is limited to a 10,000 range" 错误
// 优化：只查询最近的区块，减少查询范围
const RECENT_BLOCKS = 5000n // 减少到 5000 个区块以避免速率限制
const DEPLOYMENT_BLOCK = 9750000n // 如果需要查询历史数据，使用此值

/**
 * MemberJoined 事件定义 (V5 更新)
 * event MemberJoined(uint256 indexed proposalId, uint256 indexed groupId, uint256 identityCommitment, address indexed member)
 */
const MEMBER_JOINED_EVENT = parseAbiItem(
  'event MemberJoined(uint256 indexed proposalId, uint256 indexed groupId, uint256 identityCommitment, address indexed member)'
)

/**
 * 从链上事件获取指定提案的所有群组成员
 *
 * @param proposalId - 提案 ID
 * @returns 成员的 identityCommitment 数组（按加入顺序）
 */
export async function fetchGroupMembers(proposalId: number): Promise<bigint[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log('[fetchGroupMembers] 开始获取群组成员', { proposalId, attempt: attempt + 1 })

      // 获取当前区块号
      const latestBlock = await publicClient.getBlockNumber()

      // 优化：只查询最近的区块，而不是从部署区块开始
      const startBlock = latestBlock > RECENT_BLOCKS ? latestBlock - RECENT_BLOCKS : 0n
      const blockRange = latestBlock - startBlock

      console.log('[fetchGroupMembers] 区块范围', {
        from: startBlock.toString(),
        to: latestBlock.toString(),
        range: blockRange.toString(),
      })

      // 只查询最近 5000 个区块，避免 RPC 限制
      const logs = await publicClient.getLogs({
        address: SIMPLE_VOTING_V5_ADDRESS,
        event: MEMBER_JOINED_EVENT,
        args: {
          proposalId: BigInt(proposalId),
        },
        fromBlock: startBlock,
        toBlock: 'latest',
      })

      console.log('[fetchGroupMembers] 获取到事件日志', { count: logs.length })

      // 提取 identityCommitment 并按区块号/日志索引排序（保证顺序一致）
      const members = logs
        .sort((a, b) => {
          // 首先按区块号排序
          const blockDiff = Number(a.blockNumber) - Number(b.blockNumber)
          if (blockDiff !== 0) return blockDiff

          // 同一区块内按日志索引排序
          return (a.logIndex ?? 0) - (b.logIndex ?? 0)
        })
        .map((log) => {
          if (!log.args.identityCommitment) {
            throw new Error('Missing identityCommitment in event log')
          }
          return log.args.identityCommitment
        })

      console.log('[fetchGroupMembers] 成员列表', {
        count: members.length,
        members: members.map(m => m.toString()),
      })

      return members
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[fetchGroupMembers] 获取失败 (尝试 ${attempt + 1}/${maxRetries})`, error)

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        const waitTime = 1000 * (attempt + 1) // 递增等待时间
        console.log(`[fetchGroupMembers] 等待 ${waitTime}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw new Error(`Failed to fetch group members after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`)
}

/**
 * 检查指定身份是否已经加入群组
 *
 * @param proposalId - 提案 ID
 * @param identityCommitment - 身份承诺值
 * @returns 是否已加入
 */
export async function checkMembership(
  proposalId: number,
  identityCommitment: bigint
): Promise<boolean> {
  try {
    const members = await fetchGroupMembers(proposalId)
    return members.some((member) => member === identityCommitment)
  } catch (error) {
    console.error('[checkMembership] 检查失败', error)
    return false
  }
}

/**
 * 获取群组成员数量（不获取完整列表，性能更好）
 *
 * @param proposalId - 提案 ID
 * @returns 成员数量
 */
export async function getGroupMemberCount(proposalId: number): Promise<number> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const latestBlock = await publicClient.getBlockNumber()
      const startBlock = latestBlock > RECENT_BLOCKS ? latestBlock - RECENT_BLOCKS : 0n

      // 一次性查询（最近 5000 个区块）
      const logs = await publicClient.getLogs({
        address: SIMPLE_VOTING_V5_ADDRESS,
        event: MEMBER_JOINED_EVENT,
        args: {
          proposalId: BigInt(proposalId),
        },
        fromBlock: startBlock,
        toBlock: 'latest',
      })

      return logs.length
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[getGroupMemberCount] 获取失败 (尝试 ${attempt + 1}/${maxRetries})`, error)

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        const waitTime = 1000 * (attempt + 1)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  console.error('[getGroupMemberCount] 所有重试失败，返回 0')
  return 0
}

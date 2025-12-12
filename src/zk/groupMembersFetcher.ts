/**
 * 群组成员获取模块
 *
 * 从链上事件获取 Semaphore 群组成员列表，用于构建 Merkle Tree
 */

import { parseAbiItem } from 'viem'
import { publicClient } from '../wagmiConfig'
import { SIMPLE_VOTING_V5_ADDRESS } from './simpleVotingClient'

// 合约部署区块号 - 代理合约实际部署区块
const DEPLOYMENT_BLOCK = 9811631n
// RPC 节点单次查询的最大区块范围限制
const MAX_BLOCK_RANGE = 10000n
// 废弃的配置 (不再使用动态查询)
// const RECENT_BLOCKS = 49999n

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

  console.log('[groupMembersFetcher] 开始获取群组成员')
  console.log('[groupMembersFetcher] Proposal ID:', proposalId)
  console.log('[groupMembersFetcher] 合约地址:', SIMPLE_VOTING_V5_ADDRESS)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 获取当前区块号
      const latestBlock = await publicClient.getBlockNumber()
      console.log('[groupMembersFetcher] 当前区块号:', latestBlock.toString())

      // 计算总查询范围
      const totalRange = latestBlock - DEPLOYMENT_BLOCK
      console.log('[groupMembersFetcher] 查询区块范围:')
      console.log('  - 起始区块 (部署区块):', DEPLOYMENT_BLOCK.toString())
      console.log('  - 结束区块:', latestBlock.toString())
      console.log('  - 总区块范围:', totalRange.toString())

      let allLogs: any[] = []

      // 判断是否需要分段查询
      if (totalRange > MAX_BLOCK_RANGE) {
        console.log('[groupMembersFetcher] ⚠️  区块范围超过限制，使用分段查询')
        console.log('[groupMembersFetcher] 单次查询限制:', MAX_BLOCK_RANGE.toString(), '个区块')

        // 分段查询逻辑
        let currentBlock = DEPLOYMENT_BLOCK

        while (currentBlock < latestBlock) {
          const endBlock = currentBlock + MAX_BLOCK_RANGE > latestBlock
            ? latestBlock
            : currentBlock + MAX_BLOCK_RANGE

          console.log(`[groupMembersFetcher] 📊 查询分段: ${currentBlock} → ${endBlock} (${endBlock - currentBlock} 个区块)`)

          const logs = await publicClient.getLogs({
            address: SIMPLE_VOTING_V5_ADDRESS,
            event: MEMBER_JOINED_EVENT,
            args: {
              proposalId: BigInt(proposalId),
            },
            fromBlock: currentBlock,
            toBlock: endBlock,
          })

          console.log(`[groupMembersFetcher] ✅ 本段获取 ${logs.length} 个事件`)
          allLogs.push(...logs)
          currentBlock = endBlock + 1n

          // 避免 RPC 速率限制，短暂延迟
          if (currentBlock < latestBlock) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        console.log('[groupMembersFetcher] ✅ 分段查询完成，总共获取', allLogs.length, '个 MemberJoined 事件')
      } else {
        // 单次查询（范围在限制内）
        console.log('[groupMembersFetcher] ✅ 区块范围在限制内，使用单次查询')

        allLogs = await publicClient.getLogs({
          address: SIMPLE_VOTING_V5_ADDRESS,
          event: MEMBER_JOINED_EVENT,
          args: {
            proposalId: BigInt(proposalId),
          },
          fromBlock: DEPLOYMENT_BLOCK,
          toBlock: 'latest',
        })

        console.log('[groupMembersFetcher] ✅ 获取到', allLogs.length, '个 MemberJoined 事件')
      }

      // 提取 identityCommitment 并按区块号/日志索引排序（保证顺序一致）
      const members = allLogs
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

      console.log('[groupMembersFetcher] ✅ 成员列表处理完成')
      console.log('[groupMembersFetcher] 成员数量:', members.length)
      if (members.length > 0) {
        console.log('[groupMembersFetcher] 第一个成员:', members[0].toString())
        console.log('[groupMembersFetcher] 最后一个成员:', members[members.length - 1].toString())
      }

      return members
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[fetchGroupMembers] 获取失败 (尝试 ${attempt + 1}/${maxRetries})`, error)

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        const waitTime = 1000 * (attempt + 1) // 递增等待时间
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
      const totalRange = latestBlock - DEPLOYMENT_BLOCK

      let totalCount = 0

      // 判断是否需要分段查询
      if (totalRange > MAX_BLOCK_RANGE) {
        // 分段查询
        let currentBlock = DEPLOYMENT_BLOCK

        while (currentBlock < latestBlock) {
          const endBlock = currentBlock + MAX_BLOCK_RANGE > latestBlock
            ? latestBlock
            : currentBlock + MAX_BLOCK_RANGE

          const logs = await publicClient.getLogs({
            address: SIMPLE_VOTING_V5_ADDRESS,
            event: MEMBER_JOINED_EVENT,
            args: {
              proposalId: BigInt(proposalId),
            },
            fromBlock: currentBlock,
            toBlock: endBlock,
          })

          totalCount += logs.length
          currentBlock = endBlock + 1n

          // 避免 RPC 速率限制
          if (currentBlock < latestBlock) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      } else {
        // 单次查询
        const logs = await publicClient.getLogs({
          address: SIMPLE_VOTING_V5_ADDRESS,
          event: MEMBER_JOINED_EVENT,
          args: {
            proposalId: BigInt(proposalId),
          },
          fromBlock: DEPLOYMENT_BLOCK,
          toBlock: 'latest',
        })

        totalCount = logs.length
      }

      return totalCount
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

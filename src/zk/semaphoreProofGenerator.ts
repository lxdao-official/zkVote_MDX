/**
 * Semaphore 证明生成器
 *
 * 使用 @semaphore-protocol/proof 生成零知识证明
 * 完全兼容 SimpleVotingV5 合约
 */

import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group'
import { generateProof } from '@semaphore-protocol/proof'

const VOTE_NONCE_BITS = 128n
const VOTE_NONCE_BYTES = Number(VOTE_NONCE_BITS / 8n)
const VOTE_NONCE_MASK = (1n << VOTE_NONCE_BITS) - 1n

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto
  }
  throw new Error('Crypto API not available: secure randomness is required for ZK voting')
}

function generateRandomVoteNonce(): bigint {
  const array = new Uint8Array(VOTE_NONCE_BYTES)
  getCrypto().getRandomValues(array)

  return array.reduce<bigint>((acc, byte) => (acc << 8n) | BigInt(byte), 0n)
}

function buildExternalNullifier(proposalId: bigint, voteNonce: bigint): bigint {
  return (proposalId << VOTE_NONCE_BITS) | (voteNonce & VOTE_NONCE_MASK)
}

/**
 * Semaphore 证明输出（匹配 V5 合约参数）
 */
export type SemaphoreProofOutput = {
  merkleTreeDepth: bigint
  merkleTreeRoot: bigint
  nullifier: bigint
  message: bigint // signal (投票选项)
  scope: bigint // external nullifier (proposalId + voteNonce)
  points: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
}

/**
 * 证明生成参数
 */
export type ProofGenerationParams = {
  identity: Identity
  groupMembers: bigint[] // 所有成员的 commitment
  proposalId: number
  optionId: number
}

/**
 * 计算最优 Merkle Tree 深度
 *
 * 根据成员数量选择合适的树深度：
 * - 深度太小：无法容纳所有成员
 * - 深度太大：证明生成速度变慢
 *
/**
 * 生成 Semaphore 零知识证明
 *
 * @param params - 证明生成参数
 * @returns Semaphore 证明对象
 */
export async function generateSemaphoreProof(
  params: ProofGenerationParams
): Promise<SemaphoreProofOutput> {
  try {
    const { identity, groupMembers, proposalId, optionId } = params

    // 验证参数
    if (!groupMembers || !Array.isArray(groupMembers)) {
      throw new Error('groupMembers 必须是一个数组')
    }

    if (groupMembers.length === 0) {
      throw new Error('群组成员列表为空，无法生成证明。请确保至少有一个成员已加入群组。')
    }

    // 验证当前用户是否在群组中
    const userCommitment = identity.commitment
    const isUserInGroup = groupMembers.some(member => member === userCommitment)
    if (!isUserInGroup) {
      console.error('[generateSemaphoreProof] 用户不在群组中', {
        userCommitment: userCommitment.toString(),
        groupMembers: groupMembers.map(m => m.toString()),
      })
      throw new Error('你的身份还未加入群组，请先点击"加入提案"按钮')
    }

    // 1. 构建 Semaphore Group (Merkle Tree)
    // Semaphore v4.x Group 构造函数只接受成员列表，不需要 depth 参数
    const group = new Group()

    // 添加所有成员（验证每个成员值）
    for (let i = 0; i < groupMembers.length; i++) {
      const member = groupMembers[i]

      // 验证成员值的有效性
      if (member === null || member === undefined) {
        console.error(`[generateSemaphoreProof] 成员 ${i} 值无效:`, member)
        throw new Error(`群组成员 ${i} 的值无效`)
      }

      try {
        group.addMember(member)
      } catch (error) {
        console.error(`[generateSemaphoreProof] 添加成员 ${i} 失败:`, error)
        throw new Error(`无法添加成员 ${i} 到 Merkle Tree: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // 2. 生成随机 voteNonce 并构造新的 external nullifier
    const voteNonce = generateRandomVoteNonce()
    const externalNullifier = buildExternalNullifier(BigInt(proposalId), voteNonce)

    // 3. 生成证明
    // message (signal) = optionId (投票选项)
    // scope = externalNullifier (绑定提案 + 随机 nonce)
    // merkleTreeDepth 由库自动根据 Merkle proof 推断
    const fullProof = await generateProof(
      identity,
      group,
      BigInt(optionId), // message/signal
      externalNullifier // scope/external nullifier
    )

    // 3. 格式化为合约所需格式
    // 注意：merkleTreeDepth 的类型处理
    let merkleTreeDepth: bigint

    if (typeof fullProof.merkleTreeDepth === 'number') {
      merkleTreeDepth = BigInt(fullProof.merkleTreeDepth)
    } else if (typeof fullProof.merkleTreeDepth === 'bigint') {
      merkleTreeDepth = fullProof.merkleTreeDepth
    } else if (typeof fullProof.merkleTreeDepth === 'object' && fullProof.merkleTreeDepth !== null) {
      // 可能是包装对象，尝试提取值
      const depthObj = fullProof.merkleTreeDepth as any
      if ('value' in depthObj) {
        merkleTreeDepth = BigInt(depthObj.value)
      } else if ('_hex' in depthObj) {
        // ethers.js BigNumber 格式
        merkleTreeDepth = BigInt(depthObj._hex)
      } else {
        console.error('[generateSemaphoreProof] 无法解析 merkleTreeDepth:', depthObj)
        throw new Error(`无法解析 merkleTreeDepth 对象: ${JSON.stringify(depthObj)}`)
      }
    } else {
      throw new Error(`merkleTreeDepth 类型错误: ${typeof fullProof.merkleTreeDepth}`)
    }

    const proofOutput: SemaphoreProofOutput = {
      merkleTreeDepth: merkleTreeDepth,
      merkleTreeRoot: fullProof.merkleTreeRoot,
      nullifier: fullProof.nullifier,
      message: BigInt(optionId),
      scope: externalNullifier,
      points: fullProof.points as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
    }

    return proofOutput
  } catch (error) {
    console.error('[generateSemaphoreProof] 证明生成失败', error)
    if (error instanceof Error) {
      // 网络错误
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error('无法加载 Semaphore 证明文件，请检查网络连接')
      }
      // 成员资格错误
      if (error.message.includes('not a member') || error.message.includes('not in the group')) {
        throw new Error('身份未加入群组，请先调用 joinProposal')
      }
      // 群组为空错误
      if (error.message.includes('群组成员列表为空')) {
        throw error // 直接抛出我们自定义的错误
      }
      // 参数错误
      if (error.message.includes('必须是一个数组')) {
        throw error
      }
      // 迭代错误 - 可能是 Semaphore 库版本问题
      if (error.message.includes('not iterable')) {
        throw new Error('证明生成失败：群组数据结构错误。请检查 Semaphore 库版本。')
      }
      // 其他错误
      throw new Error(`证明生成失败: ${error.message}`)
    }
    throw new Error('证明生成失败：未知错误')
  }
}

/**
 * 验证证明（本地验证，可选）
 *
 * @param proof - 生成的证明
 * @returns 验证是否通过
 */
export async function verifyProofLocally(proof: SemaphoreProofOutput): Promise<boolean> {
  try {
    // Semaphore SDK 提供了验证功能
    // 这里简化处理，实际验证在链上进行
    return (
      proof.points.length === 8 &&
      proof.merkleTreeDepth > 0n &&
      proof.merkleTreeRoot > 0n &&
      proof.nullifier > 0n
    )
  } catch (error) {
    console.error('[verifyProofLocally] 验证失败', error)
    return false
  }
}

/**
 * 从链上获取群组成员列表
 *
 * 注意：V5 合约使用 Semaphore 的 Group 管理
 * 需要通过事件或专门的 getter 函数获取成员列表
 */
export async function fetchGroupMembers(
  proposalId: number,
  contract: any // Wagmi contract instance
): Promise<bigint[]> {
  try {
    // 方法 1: 通过 Semaphore 的 getMerkleTreeRoot 和重建
    // 方法 2: 监听 MemberAdded 事件
    // 方法 3: 使用合约的 getMembers 函数（如果有）

    // 这里需要根据实际合约实现调整
    // 临时实现：返回空数组（需要根据实际情况实现）
    console.warn('[fetchGroupMembers] 需要实现群组成员获取逻辑')
    return []
  } catch (error) {
    console.error('[fetchGroupMembers] 获取成员失败', error)
    throw new Error('Failed to fetch group members')
  }
}

/**
 * 帮助函数：下载 Semaphore 证明文件到本地
 *
 * 可选：如果想加快证明生成速度，可以将文件下载到 public/semaphore/
 */
export async function downloadSemaphoreFiles(): Promise<void> {
  try {

    const files = [
      { url: SEMAPHORE_FILES.wasmFile, name: 'semaphore.wasm' },
      { url: SEMAPHORE_FILES.zkeyFile, name: 'semaphore.zkey' },
    ]

    for (const file of files) {
      const response = await fetch(file.url)
      if (!response.ok) {
        throw new Error(`Failed to download ${file.name}`)
      }
    }

  } catch (error) {
    console.error('[downloadSemaphoreFiles] 下载失败', error)
    throw error
  }
}

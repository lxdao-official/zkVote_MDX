/**
 * Semaphore 调试工具
 *
 * 用于诊断和测试 Semaphore 相关功能
 */

import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group'

export function debugSemaphoreSetup() {
  console.log('=== Semaphore 调试工具 ===')

  try {
    // 测试 1: 创建身份
    console.log('\n[测试 1] 创建 Semaphore 身份...')
    const identity = new Identity()
    console.log('✅ 身份创建成功')
    console.log('  - Commitment:', identity.commitment.toString())
    console.log('  - Type:', typeof identity.commitment)

    // 测试 2: 创建群组
    console.log('\n[测试 2] 创建 Semaphore 群组...')
    const group = new Group()
    console.log('✅ 群组创建成功')
    console.log('  - Root:', group.root.toString())
    console.log('  - Depth:', group.depth)
    console.log('  - Size:', group.size)

    // 测试 3: 添加成员
    console.log('\n[测试 3] 添加成员到群组...')
    const testCommitment = BigInt('12345678901234567890')
    group.addMember(testCommitment)
    console.log('✅ 成员添加成功')
    console.log('  - 新 Root:', group.root.toString())
    console.log('  - 新 Size:', group.size)

    // 测试 4: 添加真实身份
    console.log('\n[测试 4] 添加真实身份到群组...')
    group.addMember(identity.commitment)
    console.log('✅ 真实身份添加成功')
    console.log('  - 最终 Size:', group.size)

    console.log('\n=== 所有测试通过 ===')
    return true
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    if (error instanceof Error) {
      console.error('  - 错误消息:', error.message)
      console.error('  - 错误堆栈:', error.stack)
    }
    return false
  }
}

// 在浏览器控制台调用此函数进行诊断
if (typeof window !== 'undefined') {
  (window as any).debugSemaphore = debugSemaphoreSetup
}

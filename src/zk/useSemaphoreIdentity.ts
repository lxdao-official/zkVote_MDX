/**
 * Semaphore Identity 管理 Hook
 *
 * 基于 @semaphore-protocol/identity 的身份管理
 * 替代原有的自定义 ZK identity 系统
 */

import { useCallback, useEffect, useState } from 'react'
import { Identity } from '@semaphore-protocol/identity'

const STORAGE_KEY = 'semaphore_identity'

export type SemaphoreIdentityState = {
  identity: Identity | null
  commitment: bigint | null
  isReady: boolean
}

/**
 * Semaphore 身份管理 Hook
 *
 * 功能：
 * - 自动从 localStorage 加载已有身份
 * - 生成新身份并持久化存储
 * - 提供 commitment 用于链上注册
 */
export function useSemaphoreIdentity() {
  const [state, setState] = useState<SemaphoreIdentityState>({
    identity: null,
    commitment: null,
    isReady: false,
  })

  // 从 localStorage 加载身份
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const identity = new Identity(data.privateKey)

        setState({
          identity,
          commitment: identity.commitment,
          isReady: true,
        })
      } else {
        setState((prev) => ({ ...prev, isReady: true }))
      }
    } catch (error) {
      console.error('[useSemaphoreIdentity] 加载身份失败', error)
      setState((prev) => ({ ...prev, isReady: true }))
    }
  }, [])

  /**
   * 生成新的 Semaphore 身份
   *
   * @returns Identity commitment (用于链上注册)
   */
  const generateIdentity = useCallback(() => {
    try {
      // 生成新身份
      const identity = new Identity()

      // 持久化存储
      const data = {
        privateKey: identity.toString(),
        commitment: identity.commitment.toString(),
        createdAt: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

      setState({
        identity,
        commitment: identity.commitment,
        isReady: true,
      })

      return identity.commitment
    } catch (error) {
      console.error('[useSemaphoreIdentity] 生成身份失败', error)
      throw new Error('Failed to generate Semaphore identity')
    }
  }, [])

  /**
   * 确保身份存在（如果不存在则生成）
   */
  const ensureIdentity = useCallback(() => {
    if (state.identity) {
      return state.commitment!
    }
    return generateIdentity()
  }, [state.identity, state.commitment, generateIdentity])

  /**
   * 清除当前身份
   */
  const clearIdentity = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({
      identity: null,
      commitment: null,
      isReady: true,
    })
  }, [])

  /**
   * 导出身份私钥（用于备份）
   */
  const exportIdentity = useCallback(() => {
    if (!state.identity) {
      throw new Error('No identity to export')
    }
    return {
      privateKey: state.identity.toString(),
      commitment: state.identity.commitment.toString(),
    }
  }, [state.identity])

  /**
   * 导入身份私钥（用于恢复）
   */
  const importIdentity = useCallback((privateKey: string) => {
    try {
      const identity = new Identity(privateKey)

      const data = {
        privateKey: identity.toString(),
        commitment: identity.commitment.toString(),
        createdAt: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

      setState({
        identity,
        commitment: identity.commitment,
        isReady: true,
      })

      return identity.commitment
    } catch (error) {
      console.error('[useSemaphoreIdentity] 导入身份失败', error)
      throw new Error('Failed to import Semaphore identity')
    }
  }, [])

  return {
    identity: state.identity,
    commitment: state.commitment,
    isReady: state.isReady,
    hasIdentity: state.identity !== null,
    generateIdentity,
    ensureIdentity,
    clearIdentity,
    exportIdentity,
    importIdentity,
  }
}

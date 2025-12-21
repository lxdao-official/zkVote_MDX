import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { useTranslation } from 'react-i18next'
import SimpleVotingV7ABI from '../abi/SimpleVotingV7.json'
import { SIMPLE_VOTING_V7_ADDRESS } from '../zk/simpleVotingClient'
import { useSemaphoreIdentity } from '../zk/useSemaphoreIdentity'
import { useZkVotingFlow } from '../zk/useZkVotingFlow'
import { checkV7Membership } from '../zk/v7MembershipCheck'

// V7 独立树合约地址
// const SIMPLE_VOTING_V7_ADDRESS = '0xac9086b7efb8bc8ad5226cd6ddc63ce57e766c86' as const
import ZkVoteProgressModal from './ZkVoteProgressModal'
import { voteStyles } from './voteStyles'

const PROPOSAL_ID = 1

const extraStyles: Record<string, React.CSSProperties> = {
  zkDifferenceCard: {
    padding: 'var(--spacing-4)',
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--radius-large)',
    border: '2px solid var(--neutral-200)',
    marginTop: 'var(--spacing-4)',
    lineHeight: 'var(--line-height-relaxed)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  infoBox: {
    padding: 'var(--spacing-4)',
    backgroundColor: '#eff6ff',
    borderRadius: 'var(--radius-large)',
    border: '2px solid #3b82f6',
    marginBottom: 'var(--spacing-4)',
    lineHeight: 'var(--line-height-relaxed)',
  },
}

const styles = { ...voteStyles, ...extraStyles }

export default function ZKChainVote() {
  const { t } = useTranslation()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { identity, commitment, ensureIdentity } = useSemaphoreIdentity()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isCheckingMembership, setIsCheckingMembership] = useState(false)

  const { state: flowState, steps, start, reset } = useZkVotingFlow()

  const { data: title } = useReadContract({
    address: SIMPLE_VOTING_V7_ADDRESS,
    abi: SimpleVotingV7ABI,
    functionName: 'getProposalTitle',
    args: [BigInt(PROPOSAL_ID)],
  })

  const {
    data: optionNames,
    refetch: refetchOptions,
    isPending: isOptionsLoading,
  } = useReadContract({
    address: SIMPLE_VOTING_V7_ADDRESS,
    abi: SimpleVotingV7ABI,
    functionName: 'getOptionNames',
    args: [BigInt(PROPOSAL_ID)],
  })

  const { data: isActive } = useReadContract({
    address: SIMPLE_VOTING_V7_ADDRESS,
    abi: SimpleVotingV7ABI,
    functionName: 'getProposalStatus',
    args: [BigInt(PROPOSAL_ID)],
  })

  // V7: optionNames 是 string[], 转换为带 id 的格式方便渲染
  const options = (optionNames as string[] | undefined)?.map((name, index) => ({
    id: BigInt(index),
    name,
  })) ?? []
  const isEnded = !isActive
  const proposalTitle = typeof title === 'string' ? title : t('zkVote.proposalTitleFallback')
  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '--'

  const txHashToShow = flowState.txHashes.vote ?? flowState.txHashes.join
  const txType = flowState.txHashes.vote ? 'vote' : flowState.txHashes.join ? 'join' : null

  const statusText = useMemo(() => {
    if (isActive === undefined) return '--'
    return isActive ? t('zkVote.statusRunning') : t('zkVote.statusEnded')
  }, [isActive])

  // V7: 检查用户是否已经加入 (通过 getUserGroupId)
  useEffect(() => {
    if (!address) {
      return
    }

    setIsCheckingMembership(true)
    checkV7Membership(PROPOSAL_ID, address)
      .then((isMember) => {
        setHasJoined(isMember)
      })
      .catch((error) => {
        console.error('[V7成员检查] ❌ 成员资格检查失败')
        console.error('[V7成员检查] 错误详情:', error)
        console.error('[V7成员检查] 错误消息:', error?.message)
        console.error('[V7成员检查] 错误栈:', error?.stack)
        // 检查失败时默认为未加入
        setHasJoined(false)
      })
      .finally(() => {
        setIsCheckingMembership(false)
      })
  }, [address])

  // 监听交易哈希变化，更新状态
  useEffect(() => {
    // 只在流程运行时更新状态
    if (flowState.status !== 'running') return

    if (flowState.txHashes.join) {
      setHasJoined(true)
    }
    if (flowState.txHashes.vote) {
      setHasVoted(true)
    }
  }, [flowState.txHashes, flowState.status])

  // 投票成功后刷新选项数据
  useEffect(() => {
    if (flowState.status === 'success' && flowState.txHashes.vote) {
      refetchOptions()
    }
  }, [flowState.status, flowState.txHashes.vote, refetchOptions])

  // 处理模态框关闭和状态重置
  useEffect(() => {
    if (flowState.status === 'success' || flowState.status === 'failed') {
      const timer = setTimeout(() => {
        setModalOpen(false)
        // 成功后不重置流程状态，避免页面重置
        if (flowState.status === 'failed') {
          reset()
        }
        // 投票成功后清空选项
        if (flowState.status === 'success' && flowState.txHashes.vote) {
          setSelectedOption(null)
        }
      }, 2000) // 延长到 2 秒，让用户看清楚成功信息
      return () => clearTimeout(timer)
    }
  }, [flowState.status, flowState.txHashes.vote, reset])

  const triggerFlow = useCallback(
    async (mode: 'full' | 'join-only') => {
      if (!isConnected || !address) {
        alert(t('zkVote.alertConnectFirst'))
        return
      }
      if (selectedOption === null) {
        alert(t('zkVote.alertChooseOptionFirst'))
        return
      }
      if (!identity || !commitment) {
        ensureIdentity()
        return
      }

      // V7 独立树: 每个用户的 Group 只有自己一个成员
      let groupMembers: bigint[] = []
      if (mode === 'full') {
        console.log('========== 🔍 [V7独立树] 准备用户专属 Group 成员 ==========')
        console.log('[ZKChainVote] Proposal ID:', PROPOSAL_ID)
        console.log('[ZKChainVote] 用户 commitment:', commitment?.toString())

        // V7: groupMembers 只包含用户自己的 commitment
        groupMembers = [commitment!]

        console.log('[ZKChainVote] ✅ V7 独立树成员列表')
        console.log('[ZKChainVote] 成员数量:', groupMembers.length, '(仅自己)')
        console.log('[ZKChainVote] 成员:', groupMembers[0].toString())
      }

      console.log('========== 🚀 [步骤 2/5] 启动投票流程 ==========')
      console.log('[ZKChainVote] 流程参数:', {
        requiresJoin: !hasJoined,
        proposalId: PROPOSAL_ID,
        optionId: selectedOption,
        _voterAddress: address,
        groupMembersCount: groupMembers.length,
        mode,
      })

      setModalOpen(true)
      start({
        requiresJoin: !hasJoined,
        proposalId: PROPOSAL_ID,
        optionId: selectedOption,
        _voterAddress: address,
        identity: identity,
        identityCommitment: commitment,
        groupMembers: groupMembers,
        mode,
      })
    },
    [address, identity, commitment, hasJoined, isConnected, selectedOption, start, ensureIdentity]
  )

  const buttonCopy = useMemo(() => {
    if (isEnded) return { label: t('zkVote.buttonEnded'), disabled: true }
    if (!isConnected) return { label: t('zkVote.buttonConnectFirst'), disabled: true }
    if (selectedOption === null) return { label: t('zkVote.buttonChooseOption'), disabled: true }
    if (isCheckingMembership) return { label: t('zkVote.buttonCheckingMembership'), disabled: true }
    if (!identity || !commitment) return { label: t('zkVote.buttonGenerateIdentity'), disabled: false, action: ensureIdentity }
    if (!hasJoined) {
      return { label: t('zkVote.buttonJoinFirst'), disabled: false, action: () => triggerFlow('join-only') }
    }
    return {
      label: hasVoted ? t('zkVote.buttonVoteAgain') : t('zkVote.buttonSubmitZkVote'),
      disabled: false,
      action: () => triggerFlow('full'),
    }
  }, [
    ensureIdentity,
    hasJoined,
    hasVoted,
    identity,
    commitment,
    isCheckingMembership,
    isConnected,
    isEnded,
    selectedOption,
    triggerFlow,
  ])

  const renderTxAnalysis = () => {
    if (!txHashToShow) return null
    if (txType === 'join') {
      return (
        <>
          <p style={styles.analysisText}>{t('zkVote.analysisJoin')}</p>
          <div style={styles.dataBreakdown}>
            <div style={styles.dataItem}>
              <code style={styles.dataSelector}>identityCommitment</code>
              <span style={styles.dataExplain}>
                {commitment ? commitment.toString() : t('zkVote.commitmentFallback')}
              </span>
            </div>
          </div>
        </>
      )
    }

    return (
      <>
        <p style={styles.analysisText}>{t('zkVote.analysisVote')}</p>
        <div style={styles.dataBreakdown}>
          <div style={styles.dataItem}>
            <code style={styles.dataSelector}>nullifierHash</code>
            <span style={styles.dataExplain}>{t('zkVote.analysisNullifier')}</span>
          </div>
          <div style={styles.dataItem}>
            <code style={styles.dataSelector}>voteCommitment</code>
            <span style={styles.dataExplain}>{t('zkVote.analysisVoteCommitment')}</span>
          </div>
          <div style={styles.dataItem}>
            <code style={styles.dataSelector}>proof[0..7]</code>
            <span style={styles.dataExplain}>8 个字段的 Groth16 零知识证明</span>
          </div>
        </div>
      </>
    )
  }

  const renderPrivacySummary = () => {
    if (!txHashToShow) return null
    if (txType === 'join') {
      return (
        <div style={styles.zkDifferenceCard}>
          <strong>✅ 目前你已经匿名加入了提案群组。</strong>
          <p>
            匿名身份的承诺值 (commitment) 已上链，但还没有提交投票。
            接下来点击按钮即可完成真匿名投票流程（证明会在浏览器本地自动生成，耗时 2-5 秒）。
          </p>
        </div>
      )
    }
    return (
      <div style={styles.zkDifferenceCard}>
        <strong>{t('zkVote.afterVoteTitle')}</strong>
        <p>
          {t('zkVote.afterVoteBody')}
        </p>
      </div>
    )
  }

  const shouldReplaceOptionsWithTx =
    flowState.status === 'success' && flowState.lastSuccessTx?.type === 'vote' && !!txHashToShow

  if (!isConnected) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>{t('zkVote.title')}</h3>
          <p style={styles.subtitle}>{t('zkVote.subtitleConnectFirst')}</p>
        </div>
        <div style={styles.notConnected}>{t('zkVote.notConnectedDetail')}</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{t('zkVote.title')}</h3>
        <p style={styles.subtitle}>{t('zkVote.subtitle')}</p>
      </div>

      <div style={styles.walletInfo}>
        <span style={styles.walletLabel}>{t('chainVote.currentWallet')}</span>
        <code style={styles.walletAddress}>{displayAddress}</code>
        <span style={styles.warningBadge}>{t('zkVote.walletWarning')}</span>
      </div>

      <div style={styles.proposalTitle}>
        <strong> {t('chainVote.currentProposal')}</strong> {proposalTitle}
        <div style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
          {t('zkVote.statusLine', { status: statusText, chainId })}
        </div>
      </div>

      {shouldReplaceOptionsWithTx ? (
        <div style={styles.txDetailContainer}>
          <div style={styles.successHeader}>
            <span style={styles.successIcon}>✅</span>
            <span>{t('zkVote.txConfirmed')}</span>
          </div>
          <div style={styles.txCard}>
            <h4 style={styles.txCardTitle}>{t('zkVote.txDetailsTitle')}</h4>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>Transaction Hash:</span>
              <code style={styles.txValue}>{txHashToShow}</code>
            </div>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>From (你的地址):</span>
              <code style={styles.txValueHighlight}>{address}</code>
            </div>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>To (合约地址):</span>
              <code style={styles.txValue}>{SIMPLE_VOTING_V7_ADDRESS}</code>
            </div>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>Network:</span>
              <code style={styles.txValue}>Sepolia Testnet (Chain ID: {chainId})</code>
            </div>
            <div style={styles.inputDataAnalysis}>
              <h4 style={styles.analysisTitle}>{t('zkVote.inputDataTitle')}</h4>
              {renderTxAnalysis()}
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHashToShow}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.explorerLink}
            >
              {t('zkVote.viewOnEtherscan')}
            </a>
          </div>
          {renderPrivacySummary()}
        </div>
      ) : (
        <>
          <div style={styles.optionsSection}>
            <h4>{t('zkVote.voteOptionsTitle')}</h4>
            {isOptionsLoading ? (
              <p>{t('chainVote.loading')}</p>
            ) : (
              <ul style={styles.optionList}>
                {options.map((option) => {
                  const isSelected = selectedOption === Number(option.id)
                  return (
                    <li
                      key={option.id.toString()}
                      style={{
                        ...styles.optionCard,
                        ...(isSelected ? styles.optionCardSelected : {}),
                      }}
                      onClick={() => {
                        setSelectedOption(Number(option.id))
                      }}
                    >
                      <div style={styles.optionHeader}>
                        <div style={styles.radioContainer}>
                          <div
                            style={{
                              ...styles.radio,
                              ...(isSelected ? styles.radioSelected : {}),
                            }}
                          />
                          <div>
                            <div style={styles.optionName}>{option.name}</div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div style={styles.infoBox}>
            <strong>{t('zkVote.newFlowTitle')}</strong>
            <p style={{ margin: '0.5rem 0 0' }}>
              {t('zkVote.newFlowBody')}
            </p>
          </div>

          <button
            style={{
              ...styles.voteButton,
              ...(buttonCopy.disabled ? styles.voteButtonDisabled : {}),
            }}
            disabled={buttonCopy.disabled}
            onClick={buttonCopy.action}
          >
            {buttonCopy.label}
          </button>

          {hasVoted && (
            <p style={{ marginTop: '0.75rem', color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
              {t('zkVote.hasVotedHint')}
            </p>
          )}
        </>
      )}

      {txHashToShow && !isModalOpen && !shouldReplaceOptionsWithTx && (
        <div style={styles.txDetailContainer}>
          <div style={styles.successHeader}>
            <span style={styles.successIcon}>{txType === 'vote' ? '✅' : '📝'}</span>
            <span>
              {txType === 'vote' ? t('zkVote.txMinedVote') : txType === 'join' ? t('zkVote.txMinedJoin') : ''}
            </span>
          </div>
          <div style={styles.txCard}>
            <h4 style={styles.txCardTitle}>{t('zkVote.txDetailsTitle')}</h4>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>Transaction Hash:</span>
              <code style={styles.txValue}>{txHashToShow}</code>
            </div>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>From (你的地址):</span>
              <code style={styles.txValueHighlight}>{address}</code>
            </div>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>To (合约地址):</span>
              <code style={styles.txValue}>{SIMPLE_VOTING_V7_ADDRESS}</code>
            </div>
            <div style={styles.txRow}>
              <span style={styles.txLabel}>Network:</span>
              <code style={styles.txValue}>Sepolia Testnet (Chain ID: {chainId})</code>
            </div>
            <div style={styles.inputDataAnalysis}>
              <h4 style={styles.analysisTitle}>{t('zkVote.inputDataTitle')}</h4>
              {renderTxAnalysis()}
            </div>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHashToShow}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.explorerLink}
            >
              {t('zkVote.viewOnEtherscan')}
            </a>
          </div>
          {renderPrivacySummary()}
        </div>
      )}

      <ZkVoteProgressModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} steps={steps} flowState={flowState} />
    </div>
  )
}

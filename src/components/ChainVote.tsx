import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next'
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
    useAccount,
    useChainId
} from "wagmi";
import SimpleVoteJson from "../abi/SimpleVoteABI.json";
import { voteStyles } from "./voteStyles";

const SIMPLEVOTE_ADDRESS = import.meta.env.VITE_PUBLIC_VOTE_PROXY as `0x${string}`;
const SIMPLEVOTE_ABI = SimpleVoteJson.abi;

interface VoteOption {
    id: bigint;
    name: string;
    voteCount: bigint;
}

// 生成 vote 函数的 input data
function encodeVoteData(proposalId: number, optionId: number): string {
    // vote(uint256,uint256) 的函数选择器是 0xb384abef
    const selector = '0xb384abef';
    // 将参数编码为 32 字节的十六进制
    const param1 = proposalId.toString(16).padStart(64, '0');
    const param2 = optionId.toString(16).padStart(64, '0');
    return `${selector}${param1}${param2}`;
}

export default function ChainVote() {
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const { t } = useTranslation()
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
    const [votedOptionName, setVotedOptionName] = useState<string>('');
    const styles = voteStyles;

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // 固定读取提案 1 的标题
    const { data: proposalTitle } = useReadContract({
        address: SIMPLEVOTE_ADDRESS,
        abi: SIMPLEVOTE_ABI,
        functionName: 'getProposalTitle',
        args: [BigInt(1)],
    });

    // 固定读取提案 1 的选项列表
    const { data: options, isLoading: isLoadingOptions, refetch: refetchOptions } = useReadContract({
        address: SIMPLEVOTE_ADDRESS,
        abi: SIMPLEVOTE_ABI,
        functionName: 'getOptions',
        args: [BigInt(1)],
    });

    const handleVote = () => {
        if (selectedOption === null) {
            alert(t('chainVote.chooseOptionFirst'));
            return;
        }
        // 记录投票的选项信息
        setVotedOptionId(selectedOption);
        const option = optionList.find((_, idx) => idx + 1 === selectedOption);
        if (option) {
            setVotedOptionName(option.name);
        }
        writeContract({
            address: SIMPLEVOTE_ADDRESS,
            abi: SIMPLEVOTE_ABI,
            functionName: 'voteUnlimit',
            args: [BigInt(1), BigInt(selectedOption)],
            gas: BigInt(300000), // 手动设置 gas 限制
        });
    };

    useEffect(() => {
        if (isSuccess) {
            setSelectedOption(null);
            refetchOptions().catch(err => {
                console.warn('刷新选项数据失败:', err);
            });
        }
    }, [isSuccess, refetchOptions]);

    // 未连接钱包时显示提示
    if (!isConnected) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{t('chainVote.title')}</h3>
                    <p style={styles.subtitle}>{t('chainVote.subtitle')}</p>
                </div>
                <div style={styles.notConnected}>
                    <p> {t('chainVote.connectHint')}</p>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                        {t('chainVote.connectHintDetail')}
                    </p>
                </div>
            </div>
        );
    }

    const optionList = (options as VoteOption[]) || [];
    const totalVotes = optionList.reduce((sum, opt) => sum + Number(opt.voteCount), 0);

    return (
        <div style={styles.container}>
            {/* 标题区 */}
            <div style={styles.header}>
                <h3 style={styles.title}> {t('chainVote.title')}</h3>
                <p style={styles.subtitle}>{t('chainVote.subtitle')}</p>
            </div>

            {/* 当前钱包信息 */}
            <div style={styles.walletInfo}>
                <span style={styles.walletLabel}>{t('chainVote.currentWallet')}</span>
                <code style={styles.walletAddress}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
                <span style={styles.warningBadge}> {t('chainVote.publicLinkWarning')}</span>
            </div>

            {/* 当前提案标题显示 */}
            <div style={styles.proposalTitle}>
                <strong> {t('chainVote.currentProposal')}</strong> {proposalTitle ? (proposalTitle as string) : t('chainVote.loading')}
            </div>

            {/* 选项列表 */}
            <div style={styles.section}>
                <label style={styles.label}>{t('chainVote.voteOptions')}</label>
                {isLoadingOptions ? (
                    <p style={styles.loading}>{t('chainVote.loading')}</p>
                ) : optionList.length === 0 ? (
                    <p style={styles.empty}>{t('chainVote.emptyOptions')}</p>
                ) : (
                    <div style={styles.optionList}>
                        {optionList.map((option, index) => {
                            const optionId = index + 1; // 选项 ID 从 1 开始
                            const percentage = totalVotes > 0
                                ? (Number(option.voteCount) / totalVotes * 100).toFixed(1)
                                : '0';
                            const isSelected = selectedOption === optionId;

                            return (
                                <div
                                    key={optionId}
                                    onClick={() => setSelectedOption(optionId)}
                                    style={{
                                        ...styles.optionCard,
                                        ...(isSelected ? styles.optionCardSelected : {}),
                                    }}
                                >
                                    <div style={styles.optionHeader}>
                                        <div style={styles.radioContainer}>
                                            <div style={{
                                                ...styles.radio,
                                                ...(isSelected ? styles.radioSelected : {}),
                                            }} />
                                            <span style={styles.optionName}>{option.name}</span>
                                        </div>
                                        <span style={styles.voteCount}>
                                            {Number(option.voteCount)} 票 ({percentage}%)
                                        </span>
                                    </div>
                                    {/* 进度条 */}
                                    <div style={styles.progressBar}>
                                        <div
                                            style={{
                                                ...styles.progressFill,
                                                width: `${percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 投票按钮 */}
            <button
                onClick={handleVote}
                disabled={isPending || isConfirming || selectedOption === null}
                style={{
                    ...styles.voteButton,
                    ...(isPending || isConfirming ? styles.voteButtonDisabled : {}),
                }}
            >
                                {isPending
                                    ? t('chainVote.waitingSignature')
                                    : isConfirming
                                        ? t('chainVote.confirming')
                                        : ` ${t('chainVote.submitVote')}`}
            </button>

            {/* 状态提示 */}
            {error && (
                <div style={styles.errorMessage}>
                    {t('chainVote.voteFailed')} {error.message.slice(0, 100)}...
                </div>
            )}
            {isSuccess && hash && (
                <div style={styles.txDetailContainer}>
                    <div style={styles.successHeader}>
                        <span style={styles.successIcon}>✅</span>
                        <span>{t('chainVote.txMined')}</span>
                    </div>
                    
                    {/* 交易详情卡片 */}
                    <div style={styles.txCard}>
                        <h4 style={styles.txCardTitle}> {t('chainVote.txDetailsTitle')}</h4>
                        
                        <div style={styles.txRow}>
                            <span style={styles.txLabel}>Transaction Hash:</span>
                            <code style={styles.txValue}>{hash}</code>
                        </div>
                        
                        <div style={styles.txRow}>
                            <span style={styles.txLabel}>From (你的地址):</span>
                            <code style={styles.txValueHighlight}>{address}</code>
                        </div>
                        
                        <div style={styles.txRow}>
                            <span style={styles.txLabel}>To (合约地址):</span>
                            <code style={styles.txValue}>{SIMPLEVOTE_ADDRESS}</code>
                        </div>
                        
                        <div style={styles.txRow}>
                            <span style={styles.txLabel}>Network:</span>
                            <code style={styles.txValue}>Sepolia Testnet (Chain ID: {chainId})</code>
                        </div>
                        
                        <div style={styles.txRow}>
                            <span style={styles.txLabel}>Input Data:</span>
                            <code style={styles.txValueSmall}>{encodeVoteData(1, votedOptionId || 1)}</code>
                        </div>
                        
                        <a
                            href={`https://sepolia.etherscan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.explorerLink}
                        >
                            {t('chainVote.viewOnEtherscan')}
                        </a>
                    </div>
                    
                    {/* Input Data 解析 */}
                    <div style={styles.inputDataAnalysis}>
                        <h4 style={styles.analysisTitle}>{t('chainVote.inputDataAnalysis')}</h4>
                        <p style={styles.analysisText}>
                            {t('chainVote.inputDataExplain')}
                        </p>
                        <div style={styles.dataBreakdown}>
                            <div style={styles.dataItem}>
                                <code style={styles.dataSelector}>0xb384abef</code>
                                <span style={styles.dataExplain}>→ 函数选择器：<strong>vote(uint256,uint256)</strong></span>
                            </div>
                            <div style={styles.dataItem}>
                                <code style={styles.dataParam}>000...001</code>
                                <span style={styles.dataExplain}>→ 第1个参数：<strong>proposalId = 1</strong></span>
                            </div>
                            <div style={styles.dataItem}>
                                <code style={styles.dataParam}>000...00{votedOptionId || 1}</code>
                                                                <span style={styles.dataExplain}>
                                                                    {t('chainVote.param2Explain', {
                                                                        optionId: votedOptionId || 1,
                                                                        optionName: votedOptionName || '...',
                                                                    })}
                                                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* 隐私泄露警告 */}
                    <div style={styles.privacyAlert}>
                        <h4 style={styles.alertTitle}>{t('chainVote.privacyLeakTitle')}</h4>
                        <p style={styles.alertText}>{t('chainVote.privacyLeakIntro')}</p>
                        <ul style={styles.alertList}>
                            <li>{t('chainVote.privacyLeakIdentity', { addr: `${address?.slice(0, 10)}...` })}</li>
                            <li>{t('chainVote.privacyLeakTime')}</li>
                            <li>{t('chainVote.privacyLeakContent', { optionId: votedOptionId, optionName: votedOptionName })}</li>
                            <li>{t('chainVote.privacyLeakLink')}</li>
                        </ul>
                        <p style={styles.alertConclusion}>
                            {t('chainVote.privacyLeakConclusion')}
                        </p>
                    </div>
                </div>
            )}

            {/* 隐私提示 */}
            <div style={styles.privacyNotice}>
                <strong> {t('chainVote.privacyNoticeTitle')}</strong>
                <p>
                    {t('chainVote.privacyNoticeP1')}
                </p>
                <p>
                    {t('chainVote.privacyNoticeP2')}
                </p>
            </div>
        </div>
    );
}

// 样式定义 - 基于 My First NFT 设计系统
// 样式复用由 voteStyles 提供

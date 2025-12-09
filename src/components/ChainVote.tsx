import React, { useState, useEffect } from "react";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
    useAccount,
    useChainId
} from "wagmi";
import SimpleVoteJson from "../abi/SimpleVoteABI.json";

const SIMPLEVOTE_ADDRESS = import.meta.env.VITE_PROXY as `0x${string}`;
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
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
    const [votedOptionName, setVotedOptionName] = useState<string>('');

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
            alert('请先选择一个选项');
            return;
        }
        // 记录投票的选项信息
        setVotedOptionId(selectedOption);
        const option = optionList.find((_, idx) => idx + 1 === selectedOption);
        if (option) {
            setVotedOptionName(option.name);
        }
        console.log(selectedOption);
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
            refetchOptions();
            setSelectedOption(null);
        }
    }, [isSuccess, refetchOptions]);

    // 未连接钱包时显示提示
    if (!isConnected) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h3 style={styles.title}>🗳️ 链上投票体验</h3>
                    <p style={styles.subtitle}>体验完全公开透明的区块链投票</p>
                </div>
                <div style={styles.notConnected}>
                    <p>⚠️ 请先连接钱包以参与投票</p>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                        点击页面顶部的「连接钱包」按钮
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
                <h3 style={styles.title}>🗳️ 链上投票体验</h3>
                <p style={styles.subtitle}>体验完全公开透明的区块链投票</p>
            </div>

            {/* 当前钱包信息 */}
            <div style={styles.walletInfo}>
                <span style={styles.walletLabel}>当前钱包:</span>
                <code style={styles.walletAddress}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
                <span style={styles.warningBadge}>⚠️ 投票记录将公开关联到此地址</span>
            </div>

            {/* 当前提案标题显示 */}
            <div style={styles.proposalTitle}>
                <strong>📋 当前提案:</strong> {proposalTitle ? (proposalTitle as string) : '加载中...'}
            </div>

            {/* 选项列表 */}
            <div style={styles.section}>
                <label style={styles.label}>投票选项:</label>
                {isLoadingOptions ? (
                    <p style={styles.loading}>加载中...</p>
                ) : optionList.length === 0 ? (
                    <p style={styles.empty}>暂无选项</p>
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
                {isPending ? '⏳ 等待签名...' : isConfirming ? '⏳ 确认中...' : ' 提交投票'}
            </button>

            {/* 状态提示 */}
            {error && (
                <div style={styles.errorMessage}>
                    ❌ 投票失败: {error.message.slice(0, 100)}...
                </div>
            )}
            {isSuccess && hash && (
                <div style={styles.txDetailContainer}>
                    <div style={styles.successHeader}>
                        <span style={styles.successIcon}>✅</span>
                        <span>投票交易已上链！</span>
                    </div>
                    
                    {/* 交易详情卡片 */}
                    <div style={styles.txCard}>
                        <h4 style={styles.txCardTitle}>📜 交易详情（链上公开可查）</h4>
                        
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
                            🔗 在 Etherscan 上查看完整交易 →
                        </a>
                    </div>
                    
                    {/* Input Data 解析 */}
                    <div style={styles.inputDataAnalysis}>
                        <h4 style={styles.analysisTitle}>🔍 Input Data 解析</h4>
                        <p style={styles.analysisText}>
                            交易的 Input Data 包含了你调用的函数和参数，任何人都可以解码：
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
                                <span style={styles.dataExplain}>→ 第2个参数：<strong>optionId = {votedOptionId || 1}</strong>（你投给了「{votedOptionName || '...'}」）</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* 隐私泄露警告 */}
                    <div style={styles.privacyAlert}>
                        <h4 style={styles.alertTitle}>⚠️ 隐私泄露分析</h4>
                        <p style={styles.alertText}>从这笔交易中，任何人都可以获取以下信息：</p>
                        <ul style={styles.alertList}>
                            <li><strong>你的身份：</strong>地址 <code>{address?.slice(0, 10)}...</code> 参与了投票</li>
                            <li><strong>投票时间：</strong>交易的区块时间戳精确记录了你何时投票</li>
                            <li><strong>投票内容：</strong>你在提案 #1 中投给了选项 #{votedOptionId}「{votedOptionName}」</li>
                            <li><strong>关联分析：</strong>如果你的地址在其他地方（交易所、社交媒体、ENS）与真实身份关联，投票偏好也将暴露</li>
                        </ul>
                        <p style={styles.alertConclusion}>
                            💡 <strong>这就是为什么我们需要 ZK 投票</strong> —— 证明你有资格投票，但不泄露你是谁、投了什么。
                        </p>
                    </div>
                </div>
            )}

            {/* 隐私提示 */}
            <div style={styles.privacyNotice}>
                <strong>🔍 隐私提示:</strong>
                <p>
                    在这种传统链上投票中，你的投票选择将与你的钱包地址永久关联。
                    任何人都可以通过区块浏览器查看你的投票记录。
                </p>
                <p>
                    这正是我们接下来要用 ZK 证明解决的问题 —— 实现「可验证但匿名」的投票。
                </p>
            </div>
        </div>
    );
}

// 样式定义 - 基于 My First NFT 设计系统
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        margin: 'var(--spacing-8) 0',
        padding: 'var(--spacing-6)',
        borderRadius: 'var(--radius-xlarge)',
        border: '3px solid var(--neutral-black)',
        backgroundColor: 'var(--neutral-white)',
        boxShadow: 'var(--shadow-level-2)',
        transition: 'transform var(--transition-normal) ease',
    },
    header: {
        marginBottom: 'var(--spacing-6)',
        textAlign: 'center',
        padding: 'var(--spacing-3) var(--spacing-5)',
        backgroundColor: 'var(--accent-yellow)',
        borderRadius: 'var(--radius-large)',
        margin: 'var(--spacing-4)',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'var(--font-weight-semibold)',
        margin: '0 0 var(--spacing-1) 0',
        color: 'var(--neutral-900)',
    },
    subtitle: {
        fontSize: '0.95rem',
        color: 'var(--neutral-600)',
        margin: 0,
    },
    notConnected: {
        textAlign: 'center',
        padding: 'var(--spacing-8)',
        backgroundColor: 'var(--accent-yellow-light)',
        border: '1px solid var(--accent-yellow-dark)',
        borderRadius: 'var(--radius-medium)',
        color: 'var(--accent-yellow-text)',
    },
    walletInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        backgroundColor: 'var(--primary-blue-light)',
        border: '2px solid var(--primary-blue)',
        borderRadius: 'var(--radius-medium)',
        marginBottom: 'var(--spacing-6)',
        flexWrap: 'wrap',
    },
    walletLabel: {
        fontSize: '0.875rem',
        color: 'var(--neutral-700)',
        fontWeight: 'var(--font-weight-semibold)',
    },
    walletAddress: {
        fontSize: '0.875rem',
        padding: '0.25rem 0.5rem',
        backgroundColor: 'var(--neutral-white)',
        border: '2px solid var(--primary-blue)',
        borderRadius: 'var(--radius-small)',
        fontFamily: 'Consolas, Monaco, monospace',
        color: 'var(--primary-blue)',
    },
    warningBadge: {
        fontSize: '0.75rem',
        color: 'var(--accent-yellow-text)',
        marginLeft: 'auto',
        fontWeight: 'var(--font-weight-semibold)',
    },
    section: {
        marginBottom: 'var(--spacing-5)',
    },
    label: {
        display: 'block',
        fontSize: '1rem',
        fontWeight: 'var(--font-weight-semibold)',
        marginBottom: 'var(--spacing-2)',
        color: 'var(--neutral-900)',
    },
    select: {
        width: '100%',
        padding: 'var(--spacing-3)',
        borderRadius: 'var(--radius-medium)',
        border: '2px solid var(--neutral-200)',
        backgroundColor: 'var(--neutral-white)',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'all var(--transition-normal) ease',
    },
    loading: {
        color: 'var(--neutral-500)',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    empty: {
        color: 'var(--neutral-500)',
        textAlign: 'center',
    },
    proposalTitle: {
        padding: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-5)',
        backgroundColor: 'var(--accent-purple-light)',
        border: '2px solid var(--accent-purple)',
        borderRadius: 'var(--radius-large)',
        fontSize: '1rem',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--neutral-900)',
    },
    optionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)',
    },
    optionCard: {
        padding: 'var(--spacing-4)',
        borderRadius: 'var(--radius-large)',
        border: '3px solid var(--neutral-200)',
        backgroundColor: 'var(--neutral-25)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal) ease',
    },
    optionCardSelected: {
        borderColor: 'var(--primary-blue)',
        backgroundColor: 'var(--primary-blue-light)',
        transform: 'translateY(-2px)',
        boxShadow: 'var(--shadow-level-2)',
    },
    optionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--spacing-2)',
    },
    radioContainer: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-3)',
        flex: 1,
        minWidth: 0,
    },
    radio: {
        width: '20px',
        height: '20px',
        minWidth: '20px',
        minHeight: '20px',
        borderRadius: '50%',
        border: '3px solid var(--neutral-300)',
        transition: 'all var(--transition-normal) ease',
        flexShrink: 0,
    },
    radioSelected: {
        borderColor: 'var(--primary-blue)',
        backgroundColor: 'var(--primary-blue)',
        boxShadow: 'inset 0 0 0 3px white',
    },
    optionName: {
        fontSize: '1rem',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--neutral-900)',
        wordBreak: 'break-word',
    },
    voteCount: {
        fontSize: '0.875rem',
        color: 'var(--neutral-500)',
        fontWeight: 'var(--font-weight-semibold)',
        flexShrink: 0,
        marginLeft: 'var(--spacing-2)',
    },
    progressBar: {
        display: 'none',
    },
    progressFill: {
        display: 'none',
    },
    voteButton: {
        width: '100%',
        padding: 'var(--spacing-3) var(--spacing-10)',
        fontSize: '1.1rem',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--neutral-black)',
        backgroundColor: 'var(--accent-yellow)',
        border: '3px solid var(--neutral-black)',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        transition: 'all var(--transition-normal) ease',
        boxShadow: 'var(--shadow-bottom-4)',
    },
    voteButtonDisabled: {
        backgroundColor: 'var(--neutral-200)',
        color: 'var(--neutral-400)',
        borderColor: 'var(--neutral-300)',
        cursor: 'not-allowed',
        boxShadow: 'none',
    },
    errorMessage: {
        marginTop: 'var(--spacing-4)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        backgroundColor: 'var(--accent-yellow-light)',
        border: '2px solid var(--accent-yellow-dark)',
        color: '#dc2626',
        borderRadius: 'var(--radius-medium)',
        fontSize: '0.875rem',
        fontWeight: 'var(--font-weight-semibold)',
    },
    successMessage: {
        marginTop: 'var(--spacing-4)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '2px solid #16a34a',
        color: '#16a34a',
        borderRadius: 'var(--radius-medium)',
        fontSize: '0.875rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 'var(--font-weight-semibold)',
    },
    txLink: {
        color: 'var(--primary-blue)',
        textDecoration: 'none',
        fontWeight: 'var(--font-weight-semibold)',
    },
    privacyNotice: {
        marginTop: 'var(--spacing-6)',
        padding: 'var(--spacing-4)',
        backgroundColor: 'var(--accent-yellow-light)',
        border: '2px solid var(--accent-yellow-dark)',
        borderRadius: 'var(--radius-large)',
        borderLeft: '4px solid var(--accent-yellow-dark)',
        fontSize: '0.875rem',
        lineHeight: 'var(--line-height-relaxed)',
        color: 'var(--neutral-700)',
    },
    // 新增：交易详情容器
    txDetailContainer: {
        marginTop: 'var(--spacing-6)',
    },
    successHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
        fontSize: '1.1rem',
        fontWeight: 'var(--font-weight-semibold)',
        color: '#16a34a',
        marginBottom: 'var(--spacing-4)',
    },
    successIcon: {
        fontSize: '1.25rem',
    },
    txCard: {
        padding: 'var(--spacing-4)',
        backgroundColor: 'var(--neutral-25)',
        border: '3px solid var(--neutral-black)',
        borderRadius: 'var(--radius-large)',
        marginBottom: 'var(--spacing-4)',
        boxShadow: 'var(--shadow-level-2)',
    },
    txCardTitle: {
        margin: '0 0 var(--spacing-4) 0',
        fontSize: '1rem',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--neutral-900)',
    },
    txRow: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 'var(--spacing-1)',
        marginBottom: 'var(--spacing-3)',
        paddingBottom: 'var(--spacing-3)',
        borderBottom: '1px dashed var(--neutral-200)',
    },
    txLabel: {
        fontSize: '0.85rem',
        color: 'var(--neutral-600)',
        fontWeight: 'var(--font-weight-semibold)',
    },
    txValue: {
        fontSize: '0.75rem',
        fontFamily: 'Consolas, Monaco, monospace',
        backgroundColor: 'var(--neutral-100)',
        padding: 'var(--spacing-2)',
        borderRadius: 'var(--radius-small)',
        wordBreak: 'break-all' as const,
        color: 'var(--neutral-700)',
        border: '1px solid var(--neutral-200)',
    },
    txValueHighlight: {
        fontSize: '0.75rem',
        fontFamily: 'Consolas, Monaco, monospace',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 'var(--spacing-2)',
        borderRadius: 'var(--radius-small)',
        wordBreak: 'break-all' as const,
        color: '#dc2626',
        border: '2px solid #dc2626',
    },
    txValueSmall: {
        fontSize: '0.7rem',
        fontFamily: 'Consolas, Monaco, monospace',
        backgroundColor: 'var(--neutral-100)',
        padding: 'var(--spacing-2)',
        borderRadius: 'var(--radius-small)',
        wordBreak: 'break-all' as const,
        color: 'var(--neutral-600)',
        border: '1px solid var(--neutral-200)',
    },
    explorerLink: {
        display: 'inline-block',
        marginTop: 'var(--spacing-2)',
        color: 'var(--primary-blue)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: 'var(--font-weight-semibold)',
        transition: 'color var(--transition-normal) ease',
    },
    inputDataAnalysis: {
        padding: 'var(--spacing-4)',
        backgroundColor: 'var(--primary-blue-light)',
        border: '2px solid var(--primary-blue)',
        borderRadius: 'var(--radius-large)',
        marginBottom: 'var(--spacing-4)',
    },
    analysisTitle: {
        margin: '0 0 var(--spacing-3) 0',
        fontSize: '1rem',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--neutral-900)',
    },
    analysisText: {
        fontSize: '0.875rem',
        color: 'var(--neutral-600)',
        margin: '0 0 var(--spacing-3) 0',
        lineHeight: 'var(--line-height-relaxed)',
    },
    dataBreakdown: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 'var(--spacing-2)',
    },
    dataItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-3)',
        flexWrap: 'wrap' as const,
    },
    dataSelector: {
        fontSize: '0.8rem',
        fontFamily: 'Consolas, Monaco, monospace',
        backgroundColor: 'var(--primary-blue)',
        color: 'var(--neutral-white)',
        padding: '0.25rem 0.5rem',
        borderRadius: 'var(--radius-small)',
        fontWeight: 'var(--font-weight-semibold)',
    },
    dataParam: {
        fontSize: '0.8rem',
        fontFamily: 'Consolas, Monaco, monospace',
        backgroundColor: 'var(--accent-yellow)',
        color: 'var(--neutral-black)',
        padding: '0.25rem 0.5rem',
        borderRadius: 'var(--radius-small)',
        fontWeight: 'var(--font-weight-semibold)',
    },
    dataExplain: {
        fontSize: '0.85rem',
        color: 'var(--neutral-600)',
    },
    privacyAlert: {
        padding: 'var(--spacing-4)',
        backgroundColor: 'var(--accent-orange-light)',
        border: '3px solid var(--accent-orange)',
        borderRadius: 'var(--radius-large)',
        borderLeft: '4px solid var(--accent-orange)',
        boxShadow: 'var(--shadow-level-1)',
    },
    alertTitle: {
        margin: '0 0 var(--spacing-3) 0',
        fontSize: '1rem',
        fontWeight: 'var(--font-weight-semibold)',
        color: '#dc2626',
    },
    alertText: {
        fontSize: '0.875rem',
        color: 'var(--neutral-700)',
        margin: '0 0 var(--spacing-2) 0',
        lineHeight: 'var(--line-height-relaxed)',
    },
    alertList: {
        margin: '0 0 var(--spacing-4) 0',
        paddingLeft: 'var(--spacing-5)',
        fontSize: '0.85rem',
        lineHeight: 'var(--line-height-relaxed)',
        color: 'var(--neutral-700)',
        textAlign: 'left' as const,
    },
    alertConclusion: {
        fontSize: '0.9rem',
        color: 'var(--neutral-900)',
        margin: 0,
        padding: 'var(--spacing-3)',
        backgroundColor: 'var(--accent-yellow-light)',
        border: '2px solid var(--accent-yellow-dark)',
        borderRadius: 'var(--radius-medium)',
        fontWeight: 'var(--font-weight-semibold)',
    },
};

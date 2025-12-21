import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const STORAGE_KEY = 'zkvote:lang'

const resources = {
  en: {
    translation: {
      common: {
        appName: 'My First ZKVote',
        language: 'Language',
        loading: 'Loading...',
        zh: '中文',
        en: 'English',
      },
      hero: {
        title: 'My First ZKVote',
        subtitle: 'My First ZK Vote',
        tagline: 'Make a real vote and understand the value of Zero-Knowledge Proofs in Web3.',
        description: 'Perfect for newcomers who want to experience a <strong>privacy-friendly vote</strong>.',
        durationLabel: 'Estimated time',
        durationValue: '~ 1 hour',
        durationNote: '(depends on you)',
        builderLabel: 'Built by',
        builderValue: 'LXDAO Community',
        start: 'Start →',
        scrollHint: 'Scroll down to explore',
        lxdaoAria: 'Visit LXDAO website',
      },
      footer: {
        tagline: 'Publicly auditable, privacy preserved.',
        lxdaoAria: 'Visit LXDAO website',
        builtWith: 'Built with LXDAO',
      },
      wallet: {
        connecting: 'Connecting...',
        connect: 'Connect Wallet',
        network: 'Network',
        ensName: 'ENS name',
        walletAddress: 'Wallet address',
        balance: 'Balance',
        disconnect: 'Disconnect',
      },
      chainVote: {
        title: '🗳️ On-chain voting',
        subtitle: 'Experience a fully transparent on-chain vote',
        connectHint: 'Please connect your wallet to vote',
        connectHintDetail: 'Click “Connect Wallet” at the top',
        currentWallet: 'Current wallet:',
        publicLinkWarning: 'Your voting record will be publicly linked to this address',
        currentProposal: 'Current proposal:',
        loading: 'Loading...',
        voteOptions: 'Voting options:',
        emptyOptions: 'No options yet',
        submitVote: 'Submit vote',
        waitingSignature: '⏳ Waiting for signature...',
        confirming: '⏳ Confirming...',
        chooseOptionFirst: 'Please choose an option first',
        voteFailed: '❌ Vote failed:',
        txMined: 'Vote transaction is on-chain!',
        txDetailsTitle: 'Transaction details (public on-chain)',
        viewOnEtherscan: '🔗 View on Etherscan →',
        inputDataAnalysis: '🔍 Input Data analysis',
        inputDataExplain: 'The transaction input contains the called function and parameters. Anyone can decode it:',
        param2Explain: '→ Param #2: optionId = {{optionId}} (you voted for “{{optionName}}”)',
        privacyLeakTitle: '⚠️ Privacy leakage analysis',
        privacyLeakIntro: 'From this transaction, anyone can learn:',
        privacyLeakIdentity: 'Your identity: address {{addr}} participated in voting',
        privacyLeakTime: 'Voting time: the block timestamp records exactly when you voted',
        privacyLeakContent: 'Voting choice: in proposal #1 you voted for option #{{optionId}} “{{optionName}}”',
        privacyLeakLink:
          'Linkage risk: if your address is linked to a real identity elsewhere (exchange, social, ENS), your preference can be exposed',
        privacyLeakConclusion:
          '💡 This is why we need ZK voting — prove you are eligible, without revealing who you are or what you voted for.',
        privacyNoticeTitle: 'Privacy note:',
        privacyNoticeP1:
          'In traditional on-chain voting, your choice becomes permanently linked to your wallet address. Anyone can view your voting history via a block explorer.',
        privacyNoticeP2:
          'This is exactly what we will solve next with ZK proofs — “verifiable but anonymous” voting.',
      },
      zkVote: {
        statusRunning: 'Voting in progress',
        statusEnded: 'Ended',
        proposalTitleFallback: 'Loading...',
        alertConnectFirst: 'Please connect your wallet first',
        alertChooseOptionFirst: 'Please choose an option first',
        commitmentFallback: '(save locally)',
        analysisJoin:
          'This transaction calls joinProposal. The input data only contains your identityCommitment, and cannot be used to derive your real identity.',
        analysisVote:
          'This ZK vote transaction carries nullifierHash, voteCommitment and a zero-knowledge proof. The chain verifies the proof, but cannot learn which option you chose.',
        analysisNullifier: 'Anti-double-voting marker (anonymous identity + proposalId + random voteNonce)',
        analysisVoteCommitment: 'Hides your choice (Poseidon(nullifierHash, option, secret))',
        afterVoteTitle: '🎉 You have completed a ZK vote.',
        afterVoteBody:
          'Unlike traditional voting, block explorers only show nullifierHash/voteCommitment/proof—not the exact option or your real identity—so the vote cannot be linked to your wallet address.',
        title: '🛡️ ZK voting',
        subtitleConnectFirst: 'Please connect your wallet to continue',
        notConnectedDetail: 'No wallet detected. Click the top button to connect.',
        subtitle: 'Generate an anonymous identity and follow the full ZK voting flow.',
        walletWarning: 'Your vote is not directly revealed in the transaction input',
        statusLine: 'Status: {{status}} | Network: Sepolia (ChainId {{chainId}})',
        txConfirmed: 'Vote transaction confirmed (completed)',
        txMinedVote: 'Vote transaction is on-chain',
        txMinedJoin: 'Anonymous identity registered',
        txDetailsTitle: '📜 Transaction details (public on-chain)',
        inputDataTitle: '🔍 Input Data interpretation',
        viewOnEtherscan: '🔗 View on Etherscan →',
        hasVotedHint:
          '✅ You have completed an anonymous vote. Want to vote again? You can vote anytime—each vote uses a fresh nullifier.',
        voteOptionsTitle: 'Voting options',
        newFlowTitle: '💡 New voting flow',
        newFlowBody:
          'No manual proof import needed. After you click the vote button, the app generates a ZK proof locally in your browser (2–5 seconds) and submits it on-chain. Your choice stays private.',
        buttonEnded: 'Voting ended',
        buttonConnectFirst: 'Please connect wallet',
        buttonChooseOption: 'Please choose an option',
        buttonCheckingMembership: 'Checking membership...',
        buttonGenerateIdentity: 'Generate anonymous identity',
        buttonJoinFirst: 'Join proposal first (vote later)',
        buttonVoteAgain: 'Vote again (ZK)',
        buttonSubmitZkVote: 'Submit ZK vote now',
      },
      zkModal: {
        title: '🛠 ZK Voting Flow',
        helper: 'Do not close or refresh this page until all steps complete.',
        viewTx: 'View transaction →',
        success: '✅ {{action}} succeeded! Transaction confirmed. Thanks for participating.',
        actionVote: 'Vote',
        actionJoin: 'Join',
        steps: {
          STEP1_PREPARE: { title: 'Prepare', description: 'Validating vote information...' },
          STEP2_JOIN_GROUP: { title: 'Join proposal group', description: 'Calling joinProposal...' },
          STEP3_SYNC_MEMBERS: { title: 'Sync members', description: 'Rebuilding Merkle Tree...' },
          STEP4_GENERATE_PROOF: { title: 'Generate ZK proof', description: 'Computed locally (2–5 seconds)' },
          STEP5_SUBMIT_VOTE: { title: 'Submit vote', description: 'Waiting for wallet confirmation...' },
          STEP6_CONFIRMATION: { title: 'Confirm on-chain', description: 'Waiting for network confirmation (usually 10–30s)' },
        },
        errors: {
          ProposalExpired: { title: 'Voting ended', action: 'Back to details' },
          NotJoined: { title: 'Not joined yet', action: 'Join again' },
          InsufficientGas: { title: 'Insufficient gas', action: 'Get test ETH and retry' },
          NetworkError: { title: 'Network error', action: 'Check network and retry' },
          ProofFailed: { title: 'Proof generation failed', action: 'Generate again' },
          UserRejected: { title: 'User rejected transaction', action: 'Start again' },
        },
      },
    },
  },
  zh: {
    translation: {
      common: {
        appName: 'My First ZKVote',
        language: '语言',
        loading: '加载中...',
        zh: '中文',
        en: 'English',
      },
      hero: {
        title: 'My First ZKVote',
        subtitle: '我的第一次 ZK 投票',
        tagline: '在这里，用一次实投票，理解零知识证明在 Web3 里的价值。',
        description: '适合刚接触加密世界、想体验 <strong>隐私友好型投票</strong> 的你。',
        durationLabel: '预计体验时长',
        durationValue: '约 1 小时',
        durationNote: '(视个人情况而定)',
        builderLabel: '构建者',
        builderValue: 'LXDAO 社区',
        start: '开始体验 →',
        scrollHint: '向下滚动开始探索',
        lxdaoAria: '访问 LXDAO 官网',
      },
      footer: {
        tagline: '公开可审计，隐私不泄露。',
        lxdaoAria: '访问 LXDAO 官网',
        builtWith: 'Built with LXDAO',
      },
      wallet: {
        connecting: '连接中...',
        connect: '连接钱包',
        network: '网络',
        ensName: 'ENS 名称',
        walletAddress: '钱包地址',
        balance: '余额',
        disconnect: '断开连接',
      },
      chainVote: {
        title: '🗳️ 链上投票体验',
        subtitle: '体验完全公开透明的区块链投票',
        connectHint: '请先连接钱包以参与投票',
        connectHintDetail: '点击页面顶部的「连接钱包」按钮',
        currentWallet: '当前钱包:',
        publicLinkWarning: '投票记录将公开关联到此地址',
        currentProposal: '当前提案:',
        loading: '加载中...',
        voteOptions: '投票选项:',
        emptyOptions: '暂无选项',
        submitVote: '提交投票',
        waitingSignature: '⏳ 等待签名...',
        confirming: '⏳ 确认中...',
        chooseOptionFirst: '请先选择一个选项',
        voteFailed: '❌ 投票失败:',
        txMined: '投票交易已上链！',
        txDetailsTitle: '交易详情（链上公开可查）',
        viewOnEtherscan: '🔗 在 Etherscan 上查看完整交易 →',
        inputDataAnalysis: '🔍 Input Data 解析',
        inputDataExplain: '交易的 Input Data 包含了你调用的函数和参数，任何人都可以解码：',
        param2Explain: '→ 第2个参数：optionId = {{optionId}}（你投给了「{{optionName}}」）',
        privacyLeakTitle: '⚠️ 隐私泄露分析',
        privacyLeakIntro: '从这笔交易中，任何人都可以获取以下信息：',
        privacyLeakIdentity: '你的身份：地址 {{addr}} 参与了投票',
        privacyLeakTime: '投票时间：交易的区块时间戳精确记录了你何时投票',
        privacyLeakContent: '投票内容：你在提案 #1 中投给了选项 #{{optionId}}「{{optionName}}」',
        privacyLeakLink: '关联分析：如果你的地址在其他地方（交易所、社交媒体、ENS）与真实身份关联，投票偏好也将暴露',
        privacyLeakConclusion: '💡 这就是为什么我们需要 ZK 投票 —— 证明你有资格投票，但不泄露你是谁、投了什么。',
        privacyNoticeTitle: '隐私提示:',
        privacyNoticeP1:
          '在这种传统链上投票中，你的投票选择将与你的钱包地址永久关联。任何人都可以通过区块浏览器查看你的投票记录。',
        privacyNoticeP2: '这正是我们接下来要用 ZK 证明解决的问题 —— 实现「可验证但匿名」的投票。',
      },
      zkVote: {
        statusRunning: '投票进行中',
        statusEnded: '已结束',
        proposalTitleFallback: '加载中...',
        alertConnectFirst: '请先连接钱包',
        alertChooseOptionFirst: '请先选择一个选项',
        commitmentFallback: '（请记录在本地）',
        analysisJoin:
          '这笔交易调用了 joinProposal，Input Data 只包含你的 identityCommitment。任何人无法从中反推出你的真实身份。',
        analysisVote:
          '这笔 ZK 投票交易携带了 nullifierHash、voteCommitment 和零知识证明。链上验证 proof 合法，但无法得知你具体投给了哪个选项。',
        analysisNullifier: '防重复投票标识（匿名身份 + 提案ID + 随机 voteNonce）',
        analysisVoteCommitment: '隐藏投票选择 (Poseidon(nullifierHash, option, secret))',
        afterVoteTitle: '🎉 你已经完成了一次 ZK 投票。',
        afterVoteBody:
          '与传统投票不同：区块浏览器只会看到 nullifierHash/voteCommitment/proof，看不到具体选项或真实身份，因此无法把这次投票与你的钱包地址绑定。',
        title: '🛡️ ZK 投票体验',
        subtitleConnectFirst: '请先连接钱包再继续',
        notConnectedDetail: '未检测到钱包连接，点击页面顶部按钮连接',
        subtitle: '完成匿名身份，导入零知识证明后即可体验完整流程',
        walletWarning: '你的投票记录不会直接暴露在 Input Data 中',
        statusLine: '状态：{{status}} | 网络：Sepolia (ChainId {{chainId}})',
        txConfirmed: '投票交易已确认（已完成）',
        txMinedVote: '投票交易已上链',
        txMinedJoin: '匿名身份已登记',
        txDetailsTitle: '📜 交易详情（链上公开可查）',
        inputDataTitle: '🔍 Input Data 解读',
        viewOnEtherscan: '🔗 在 Etherscan 查看完整交易 →',
        hasVotedHint: '✅ 你已经完成一次匿名投票。想继续表达意见？随时再投一票，系统会为每次投票生成全新的 nullifier。',
        voteOptionsTitle: '投票选项',
        newFlowTitle: '💡 新的投票流程',
        newFlowBody:
          '现在你无需手动导入证明！点击投票按钮后，系统会自动在浏览器本地生成 ZK 证明（耗时 2-5 秒），然后直接提交到链上。整个过程完全隐私，你的投票选项不会泄露。',
        buttonEnded: '投票已结束',
        buttonConnectFirst: '请先连接钱包',
        buttonChooseOption: '请先选择选项',
        buttonCheckingMembership: '检查成员资格...',
        buttonGenerateIdentity: '生成匿名身份',
        buttonJoinFirst: '先加入提案（可稍后投票）',
        buttonVoteAgain: '再投一票 (ZK)',
        buttonSubmitZkVote: '立即提交 ZK 投票',
      },
      zkModal: {
        title: '🛠 ZK 投票流程',
        helper: '请勿关闭或刷新页面，直到所有步骤完成。',
        viewTx: '查看交易详情 →',
        success: '✅ {{action}}成功！交易已确认，感谢你的参与。',
        actionVote: '投票',
        actionJoin: '加入',
        steps: {
          STEP1_PREPARE: { title: '准备数据', description: '正在验证投票信息...' },
          STEP2_JOIN_GROUP: { title: '加入提案群组', description: '正在调用 joinProposal...' },
          STEP3_SYNC_MEMBERS: { title: '同步成员', description: '正在重建 Merkle Tree...' },
          STEP4_GENERATE_PROOF: { title: '生成零知识证明', description: '浏览器本地计算，耗时 2-5 秒' },
          STEP5_SUBMIT_VOTE: { title: '提交投票', description: '等待钱包确认交易...' },
          STEP6_CONFIRMATION: { title: '区块确认', description: '等待网络确认，通常 10-30 秒' },
        },
        errors: {
          ProposalExpired: { title: '投票已结束', action: '返回详情页' },
          NotJoined: { title: '尚未加入提案', action: '重新加入' },
          InsufficientGas: { title: 'Gas 余额不足', action: '获取测试币后重试' },
          NetworkError: { title: '网络连接异常', action: '检查网络后重试' },
          ProofFailed: { title: '证明生成失败', action: '重新生成证明' },
          UserRejected: { title: '交易被用户取消', action: '重新发起投票' },
        },
      },
    },
  },
} as const

function getInitialLanguage(): 'zh' | 'en' {
  if (typeof window === 'undefined') return 'zh'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh' || stored === 'en') return stored
  const nav = window.navigator.language?.toLowerCase() ?? ''
  return nav.startsWith('zh') ? 'zh' : 'en'
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lng)
    document.documentElement.lang = lng
  }
})

export { STORAGE_KEY }
export default i18n

// 基于 MyFirstZKVote.mdx 内容的测试题目

export interface QuizQuestion {
  id: number
  type: 'single' | 'multiple'
  question: string
  options: string[]
  correctAnswer: number | number[] // 单选是单个数字，多选是数组
  explanation?: string
}

export const quizQuestions: QuizQuestion[] = [
  // ========== 单选题 (10题) ==========
  {
    id: 1,
    type: 'single',
    question: '区块链投票相比传统电子投票系统的主要优势是什么？',
    options: [
      '投票速度更快',
      '公开透明、不可篡改、端到端可验证',
      '成本更低',
      '完全匿名'
    ],
    correctAnswer: 1,
    explanation: '区块链投票提供公开透明、不可篡改的记录，实现端到端可验证性。'
  },
  {
    id: 2,
    type: 'single',
    question: '传统链上投票存在的主要隐私问题是什么？',
    options: [
      '投票结果不准确',
      '投票速度太慢',
      '投票记录完全公开，地址与投票偏好可被关联',
      '只能投一次票'
    ],
    correctAnswer: 2,
    explanation: '传统链上投票会公开记录钱包地址、投票选项等信息，容易将身份与投票偏好关联。'
  },
  {
    id: 3,
    type: 'single',
    question: '零知识证明系统中的"证明者"（Prover）是指？',
    options: [
      '验证投票结果的人',
      '掌握秘密信息并希望证明自己知道该秘密的人',
      '智能合约',
      '区块链节点'
    ],
    correctAnswer: 1,
    explanation: '证明者掌握某个秘密信息，希望向验证者证明自己确实知道这个秘密。'
  },
  {
    id: 4,
    type: 'single',
    question: '零知识证明的"零知识性"是指？',
    options: [
      '验证者不需要任何知识就能验证',
      '证明者不需要知道任何信息',
      '验证者除了"语句是真的"这一事实外不会获得任何额外信息',
      '证明过程不需要计算'
    ],
    correctAnswer: 2,
    explanation: '零知识性保证验证者无法从证明内容中还原出证明者所掌握的秘密。'
  },
  {
    id: 5,
    type: 'single',
    question: '在ZK投票系统中，identity commitment 是什么？',
    options: [
      '投票的选项',
      '用户的钱包地址',
      '对身份秘密（identitySecret）进行哈希计算得到的承诺值',
      '投票的时间戳'
    ],
    correctAnswer: 2,
    explanation: 'Identity commitment = Hash(identitySecret)，用于在不暴露身份秘密的情况下证明身份。'
  },
  {
    id: 6,
    type: 'single',
    question: 'Nullifier 在ZK投票系统中的作用是什么？',
    options: [
      '记录投票时间',
      '防止重复投票',
      '加密投票内容',
      '验证投票结果'
    ],
    correctAnswer: 1,
    explanation: 'Nullifier = Hash(identitySecret, electionId)，用于防止同一个选民多次投票。'
  },
  {
    id: 7,
    type: 'single',
    question: 'zk-SNARK 中的 "SNARK" 是什么的缩写？',
    options: [
      'Simple Non-interactive ARgument of Knowledge',
      'Succinct Non-interactive ARgument of Knowledge',
      'Secure Non-interactive ARgument of Knowledge',
      'Swift Non-interactive ARgument of Knowledge'
    ],
    correctAnswer: 1,
    explanation: 'SNARK = Succinct Non-Interactive Argument of Knowledge，特点是简洁、非交互式。'
  },
  {
    id: 8,
    type: 'single',
    question: '在ZK投票流程中，零知识证明是在哪里生成的？',
    options: [
      '在智能合约中',
      '在区块链节点上',
      '在用户浏览器本地',
      '在中心化服务器上'
    ],
    correctAnswer: 2,
    explanation: 'ZK证明在用户浏览器本地生成，保护用户隐私，不需要将秘密信息发送到服务器。'
  },
  {
    id: 9,
    type: 'single',
    question: 'Merkle树在ZK投票系统中用于？',
    options: [
      '加密投票选项',
      '组织选民集合，证明某个身份承诺属于授权选民',
      '计算投票结果',
      '生成随机数'
    ],
    correctAnswer: 1,
    explanation: 'Merkle树用于组织所有选民的身份承诺，证明者通过Merkle路径证明自己是授权选民之一。'
  },
  {
    id: 10,
    type: 'single',
    question: '完成ZK投票后，在区块链上能看到哪些信息？',
    options: [
      '投票者的真实身份和投票选项',
      '投票者的identitySecret',
      '交易发起地址、proof和nullifier，但无法还原具体身份和选项',
      '完全看不到任何信息'
    ],
    correctAnswer: 2,
    explanation: 'ZK投票在链上公开proof和nullifier，但无法从中还原投票者身份和具体选项，实现可验证的匿名性。'
  },

  // ========== 多选题 (5题) ==========
  {
    id: 11,
    type: 'multiple',
    question: '零知识证明系统必须满足哪三个核心性质？（多选）',
    options: [
      '完备性（Completeness）',
      '可靠性（Soundness）',
      '零知识性（Zero-Knowledge）',
      '高效性（Efficiency）',
      '匿名性（Anonymity）'
    ],
    correctAnswer: [0, 1, 2],
    explanation: '零知识证明的三大性质是：完备性、可靠性和零知识性。'
  },
  {
    id: 12,
    type: 'multiple',
    question: '在ZK投票系统中，哪些是私有输入（witness）？（多选）',
    options: [
      '身份秘密 identitySecret',
      'Merkle 路径',
      '投票选项 vote',
      '选民集合的 Merkle 根 root',
      '投票 ID electionId'
    ],
    correctAnswer: [0, 1, 2],
    explanation: 'identitySecret、Merkle路径和投票选项都是私有输入；而root和electionId是公开输入。'
  },
  {
    id: 13,
    type: 'multiple',
    question: 'ZK投票流程包括哪些主要步骤？（多选）',
    options: [
      '生成身份秘密与承诺',
      '加入选民集合（Merkle树）',
      '本地构造ZK证明',
      '提交投票交易',
      '中心化服务器验证'
    ],
    correctAnswer: [0, 1, 2, 3],
    explanation: 'ZK投票是去中心化的，不需要中心化服务器验证。验证由智能合约在链上完成。'
  },
  {
    id: 14,
    type: 'multiple',
    question: '关于zk-SNARK和zk-STARK的说法，哪些是正确的？（多选）',
    options: [
      'zk-SNARK的证明大小通常更小',
      'zk-STARK不需要可信初始化（trusted setup）',
      'zk-SNARK适合所有场景',
      'zk-STARK更适合大规模复杂计算',
      '两者都是非交互式零知识证明'
    ],
    correctAnswer: [0, 1, 3, 4],
    explanation: 'zk-SNARK证明小但需要trusted setup；zk-STARK无需trusted setup但证明更大；两者各有优势，适用于不同场景。'
  },
  {
    id: 15,
    type: 'multiple',
    question: 'ZK投票系统在实际应用中需要注意哪些安全边界？（多选）',
    options: [
      '确保identitySecret的安全存储',
      '防止nullifier被重复使用',
      '验证Merkle根的正确性',
      '确保Setup阶段的安全性',
      '完全隐藏交易发起地址'
    ],
    correctAnswer: [0, 1, 2, 3],
    explanation: 'ZK投票无法隐藏交易发起地址（这是区块链的基本特性），但能保护投票内容和身份关联的隐私。'
  }
]

// 计算得分
export function calculateScore(userAnswers: Record<number, number | number[]>): {
  score: number
  correctCount: number
  wrongCount: number
  totalQuestions: number
  details: Array<{
    questionId: number
    isCorrect: boolean
    userAnswer: number | number[]
    correctAnswer: number | number[]
  }>
} {
  let correctCount = 0
  const details: Array<{
    questionId: number
    isCorrect: boolean
    userAnswer: number | number[]
    correctAnswer: number | number[]
  }> = []

  quizQuestions.forEach((question) => {
    const userAnswer = userAnswers[question.id]
    let isCorrect = false

    if (question.type === 'single') {
      isCorrect = userAnswer === question.correctAnswer
    } else {
      // 多选题：需要完全匹配
      const correctArray = question.correctAnswer as number[]
      const userArray = userAnswer as number[]
      
      if (Array.isArray(userArray) && Array.isArray(correctArray)) {
        isCorrect = 
          userArray.length === correctArray.length &&
          userArray.every((ans) => correctArray.includes(ans))
      }
    }

    if (isCorrect) correctCount++

    details.push({
      questionId: question.id,
      isCorrect,
      userAnswer: userAnswer ?? (question.type === 'single' ? -1 : []),
      correctAnswer: question.correctAnswer
    })
  })

  const totalQuestions = quizQuestions.length
  const wrongCount = totalQuestions - correctCount
  const score = Math.round((correctCount / totalQuestions) * 100)

  return {
    score,
    correctCount,
    wrongCount,
    totalQuestions,
    details
  }
}

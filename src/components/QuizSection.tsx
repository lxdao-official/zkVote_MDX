import { useState } from 'react'
import { useAccount } from 'wagmi'
import { quizQuestions, calculateScore } from '../data/quizData'

type QuizStep = 'intro' | 'quiz' | 'result'

interface QuizResultType {
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
}

export default function QuizSection() {
  const { address, isConnected } = useAccount()
  const [step, setStep] = useState<QuizStep>('intro')
  const [userAnswers, setUserAnswers] = useState<Record<number, number | number[]>>({})
  const [quizResult, setQuizResult] = useState<QuizResultType | null>(null)

  const handleStartQuiz = () => {
    if (!isConnected || !address) {
      alert('请先连接钱包才能进行测试')
      return
    }
    setStep('quiz')
    setUserAnswers({})
    setQuizResult(null)
    // 滚动到测试区域
    setTimeout(() => {
      document.getElementById('quiz-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleSingleChoice = (questionId: number, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }

  const handleMultipleChoice = (questionId: number, optionIndex: number) => {
    setUserAnswers((prev) => {
      const currentAnswers = (prev[questionId] as number[]) || []
      const newAnswers = currentAnswers.includes(optionIndex)
        ? currentAnswers.filter((idx) => idx !== optionIndex)
        : [...currentAnswers, optionIndex]
      
      return {
        ...prev,
        [questionId]: newAnswers
      }
    })
  }

  const handleSubmit = async () => {
    // 检查是否所有题目都已作答
    const allAnswered = quizQuestions.every((q) => {
      const answer = userAnswers[q.id]
      if (q.type === 'single') {
        return answer !== undefined && answer !== -1
      } else {
        return Array.isArray(answer) && answer.length > 0
      }
    })

    if (!allAnswered) {
      alert('请完成所有题目后再提交！')
      return
    }

    // 计算得分
    const result = calculateScore(userAnswers)
    setQuizResult(result)
    setStep('result')

    // 滚动到结果区域
    setTimeout(() => {
      document.getElementById('quiz-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    // 保存测试结果到数据库
    if (address) {
      try {
        await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: address,
            score: result.score,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            totalQuestions: result.totalQuestions
          }),
        })
      } catch (error) {
        console.error('保存测试结果失败:', error)
      }
    }
  }

  const handleRetry = () => {
    setStep('quiz')
    setUserAnswers({})
    setQuizResult(null)
    setTimeout(() => {
      document.getElementById('quiz-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleBackToIntro = () => {
    setStep('intro')
    setUserAnswers({})
    setQuizResult(null)
  }

  // 初始状态 - 测试介绍
  if (step === 'intro') {
    return (
      <div id="quiz-container" style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>知识测试</h2>
          <p style={styles.subtitle}>
            检验你对 ZK 投票的理解程度
          </p>
        </div>

        <div style={styles.content}>
          <div style={styles.infoBox}>
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>题目数量</span>
              <div>
                <div style={styles.infoLabel}></div>
                <div style={styles.infoValue}>15 道题</div>
              </div>
            </div>
            
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>预计时长</span>
              <div>
                <div style={styles.infoLabel}></div>
                <div style={styles.infoValue}>10-15 分钟</div>
              </div>
            </div>
            
            <div style={styles.infoItem}>
              <span style={styles.infoIcon}>题型</span>
              <div>
                <div style={styles.infoLabel}></div>
                <div style={styles.infoValue}>单选 + 多选</div>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div style={styles.warningBox}>
              <span style={styles.warningIcon}>提示：</span>
              <span style={styles.warningText}>
                请先连接钱包才能开始测试
              </span>
            </div>
          )}

          <button
            onClick={handleStartQuiz}
            type="button"
            style={{
              ...styles.startButton,
              ...(isConnected ? {} : styles.startButtonDisabled)
            }}
          >
            开始测试
          </button>

          {isConnected && address && (
            <p style={styles.walletInfo}>
              当前钱包：{address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // 答题状态
  if (step === 'quiz') {
    return (
      <div id="quiz-container" style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>ZKVote 知识测试</h2>
          <p style={styles.subtitle}>共 15 题：10 道单选题 + 5 道多选题</p>
        </div>

        <div style={styles.questionsWrapper}>
          {quizQuestions.map((question, index) => (
            <div key={question.id} style={styles.questionContainer}>
              <div style={styles.questionHeader}>
                <span style={styles.questionNumber}>
                  {question.type === 'single' ? '单选题' : '多选题'} {index + 1}
                </span>
              </div>
              
              <p style={styles.questionText}>{question.question}</p>
              
              <div style={styles.optionsContainer}>
                {question.options.map((option, optionIndex) => {
                  const isSelected = question.type === 'single'
                    ? userAnswers[question.id] === optionIndex
                    : Array.isArray(userAnswers[question.id]) && 
                      (userAnswers[question.id] as number[]).includes(optionIndex)

                  return (
                    <label
                      key={optionIndex}
                      style={{
                        ...styles.optionLabel,
                        ...(isSelected ? styles.optionSelected : {})
                      }}
                    >
                      <input
                        type={question.type === 'single' ? 'radio' : 'checkbox'}
                        name={`question-${question.id}`}
                        checked={isSelected}
                        onChange={() => {
                          if (question.type === 'single') {
                            handleSingleChoice(question.id, optionIndex)
                          } else {
                            handleMultipleChoice(question.id, optionIndex)
                          }
                        }}
                        style={styles.optionInput}
                      />
                      <span style={styles.optionText}>
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleBackToIntro} style={styles.backButton}>
            返回
          </button>
          <button onClick={handleSubmit} style={styles.submitButton}>
            提交答案
          </button>
        </div>
      </div>
    )
  }

  // 结果状态
  if (step === 'result' && quizResult) {
    return (
      <div id="quiz-result" style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>测试结果</h2>
        </div>

        <div style={styles.resultContainer}>
          <div style={styles.scoreCircle}>
            <div style={styles.scoreNumber}>{quizResult.score}</div>
            <div style={styles.scoreLabel}>分</div>
          </div>

          <div style={styles.resultStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>总题数：</span>
              <span style={styles.statValue}>{quizResult.totalQuestions} 题</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>正确：</span>
              <span style={{ ...styles.statValue, color: '#10b981' }}>
                {quizResult.correctCount} 题
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>错误：</span>
              <span style={{ ...styles.statValue, color: '#ef4444' }}>
                {quizResult.wrongCount} 题
              </span>
            </div>
          </div>

          <div style={styles.resultMessage}>
            {quizResult.score >= 90 && '优秀！你已经完全掌握了ZK投票的核心概念！'}
            {quizResult.score >= 70 && quizResult.score < 90 && '良好！你对ZK投票有了较好的理解！'}
            {quizResult.score >= 60 && quizResult.score < 70 && '及格！继续加油，多复习教程内容！'}
            {quizResult.score < 60 && '建议再仔细阅读教程，加深理解！'}
          </div>
        </div>

        <div style={styles.questionsWrapper}>
          <h3 style={styles.reviewTitle}>答题详情</h3>
          {quizQuestions.map((question, index) => {
            const questionResult = quizResult.details.find((d) => d.questionId === question.id)
            
            return (
              <div key={question.id} style={styles.questionContainer}>
                <div style={styles.questionHeader}>
                  <span style={styles.questionNumber}>
                    {question.type === 'single' ? '单选题' : '多选题'} {index + 1}
                  </span>
                  {questionResult && (
                    <span style={{
                      ...styles.resultBadge,
                      backgroundColor: questionResult.isCorrect ? '#10b981' : '#ef4444'
                    }}>
                      {questionResult.isCorrect ? '正确' : '错误'}
                    </span>
                  )}
                </div>
                
                <p style={styles.questionText}>{question.question}</p>
                
                <div style={styles.optionsContainer}>
                  {question.options.map((option, optionIndex) => {
                    const isUserAnswer = question.type === 'single'
                      ? questionResult?.userAnswer === optionIndex
                      : Array.isArray(questionResult?.userAnswer) && 
                        questionResult.userAnswer.includes(optionIndex)

                    const isCorrectOption = question.type === 'single'
                      ? question.correctAnswer === optionIndex
                      : Array.isArray(question.correctAnswer) && 
                        question.correctAnswer.includes(optionIndex)

                    const showWrong = isUserAnswer && !isCorrectOption

                    return (
                      <div
                        key={optionIndex}
                        style={{
                          ...styles.optionLabel,
                          ...(isCorrectOption ? styles.optionCorrect : {}),
                          ...(showWrong ? styles.optionWrong : {})
                        }}
                      >
                        <span style={styles.optionText}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </span>
                        {isCorrectOption && <span style={styles.correctMark}>[正确]</span>}
                        {showWrong && <span style={styles.wrongMark}>[错误]</span>}
                      </div>
                    )
                  })}
                </div>

                {question.explanation && (
                  <div style={styles.explanation}>
                    <strong>解析：</strong>{question.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleBackToIntro} style={styles.backButton}>
            返回首页
          </button>
          <button onClick={handleRetry} style={styles.retryButton}>
            重新测试
          </button>
        </div>
      </div>
    )
  }

  return null
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    margin: '3rem auto',
    maxWidth: '800px',
    padding: '2rem',
    borderRadius: '16px',
    border: '3px solid #000',
    backgroundColor: '#fff',
    boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.2)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#ddd6fe',
    borderRadius: '12px',
    border: '3px solid #000',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#475569',
    margin: 0,
    fontWeight: '500',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'center',
  },
  infoBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    width: '100%',
    marginBottom: '1rem',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    border: '2px solid #000',
    borderRadius: '8px',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.1)',
  },
  infoIcon: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#8b5cf6',
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  infoValue: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: '700',
  },
  warningBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    width: '100%',
  },
  warningIcon: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#f59e0b',
  },
  warningText: {
    fontSize: '1rem',
    color: '#78350f',
    fontWeight: '600',
  },
  startButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.25rem 3rem',
    fontSize: '1.3rem',
    fontWeight: '700',
    backgroundColor: '#10b981',
    color: '#fff',
    border: '3px solid #000',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  walletInfo: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0.5rem 0 0 0',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  questionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    width: '100%',
  },
  questionContainer: {
    padding: '1.5rem',
    backgroundColor: '#fff',
    border: '2px solid #000',
    borderRadius: '8px',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.1)',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  questionNumber: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#8b5cf6',
    backgroundColor: '#f3e8ff',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    border: '2px solid #8b5cf6',
  },
  questionText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 1rem 0',
    lineHeight: '1.6',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
    fontWeight: '600',
  },
  optionCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    fontWeight: '600',
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    fontWeight: '600',
  },
  optionInput: {
    marginRight: '0.75rem',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  optionText: {
    fontSize: '1rem',
    color: '#334155',
    flex: 1,
  },
  correctMark: {
    fontSize: '1.25rem',
    color: '#10b981',
    fontWeight: '700',
    marginLeft: '0.5rem',
  },
  wrongMark: {
    fontSize: '1.25rem',
    color: '#ef4444',
    fontWeight: '700',
    marginLeft: '0.5rem',
  },
  explanation: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '6px',
    fontSize: '0.95rem',
    color: '#78350f',
    lineHeight: '1.6',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem',
    flexWrap: 'wrap',
  },
  submitButton: {
    padding: '1rem 3rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: '3px solid #000',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s',
  },
  backButton: {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    backgroundColor: '#64748b',
    color: '#fff',
    border: '3px solid #000',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s',
  },
  retryButton: {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    backgroundColor: '#10b981',
    color: '#fff',
    border: '3px solid #000',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s',
  },
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    marginBottom: '2rem',
    padding: '2rem',
    backgroundColor: '#f8fafc',
    border: '3px solid #000',
    borderRadius: '12px',
  },
  scoreCircle: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    backgroundColor: '#8b5cf6',
    border: '4px solid #000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.2)',
  },
  scoreNumber: {
    fontSize: '3.5rem',
    fontWeight: '700',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#fff',
  },
  resultStats: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  resultMessage: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#fff',
    border: '2px solid #000',
    borderRadius: '8px',
  },
  reviewTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e2e8f0',
  },
  resultBadge: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#fff',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
  },
}

import { useState } from 'react'
import { quizQuestions, calculateScore, type QuizQuestion } from '../data/quizData'

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
}

export default function QuizModal({ isOpen, onClose, walletAddress }: QuizModalProps) {
  const [currentStep, setCurrentStep] = useState<'quiz' | 'result'>('quiz')
  const [userAnswers, setUserAnswers] = useState<Record<number, number | number[]>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizResult, setQuizResult] = useState<{
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
  } | null>(null)

  console.log('QuizModal - isOpen:', isOpen, 'walletAddress:', walletAddress)

  if (!isOpen) return null

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
    setCurrentStep('result')
    setShowExplanation(true)

    // 保存测试结果到数据库（如果有钱包地址）
    if (walletAddress) {
      try {
        await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            score: result.score,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            totalQuestions: result.totalQuestions
          }),
        })
        // 不阻塞用户查看结果，静默保存
      } catch (error) {
        console.error('保存测试结果失败:', error)
        // 不影响用户体验，静默失败
      }
    }
  }

  const handleRetry = () => {
    setUserAnswers({})
    setQuizResult(null)
    setCurrentStep('quiz')
    setShowExplanation(false)
  }

  const getQuestionResult = (questionId: number) => {
    if (!quizResult) return null
    return quizResult.details.find((d) => d.questionId === questionId)
  }

  const renderQuestion = (question: QuizQuestion, index: number) => {
    const questionResult = getQuestionResult(question.id)

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
              {questionResult.isCorrect ? '✓ 正确' : '✗ 错误'}
            </span>
          )}
        </div>
        
        <p style={styles.questionText}>{question.question}</p>
        
        <div style={styles.optionsContainer}>
          {question.options.map((option, optionIndex) => {
            const isSelected = question.type === 'single'
              ? userAnswers[question.id] === optionIndex
              : Array.isArray(userAnswers[question.id]) && 
                (userAnswers[question.id] as number[]).includes(optionIndex)

            const isCorrectOption = question.type === 'single'
              ? question.correctAnswer === optionIndex
              : Array.isArray(question.correctAnswer) && 
                (question.correctAnswer as number[]).includes(optionIndex)

            const showCorrect = showExplanation && isCorrectOption
            const showWrong = showExplanation && isSelected && !isCorrectOption

            return (
              <label
                key={optionIndex}
                style={{
                  ...styles.optionLabel,
                  ...(isSelected && !showExplanation ? styles.optionSelected : {}),
                  ...(showCorrect ? styles.optionCorrect : {}),
                  ...(showWrong ? styles.optionWrong : {}),
                  cursor: showExplanation ? 'not-allowed' : 'pointer'
                }}
              >
                <input
                  type={question.type === 'single' ? 'radio' : 'checkbox'}
                  name={`question-${question.id}`}
                  checked={isSelected}
                  onChange={() => {
                    if (!showExplanation) {
                      if (question.type === 'single') {
                        handleSingleChoice(question.id, optionIndex)
                      } else {
                        handleMultipleChoice(question.id, optionIndex)
                      }
                    }
                  }}
                  disabled={showExplanation}
                  style={styles.optionInput}
                />
                <span style={styles.optionText}>
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </span>
                {showCorrect && <span style={styles.correctMark}>✓</span>}
                {showWrong && <span style={styles.wrongMark}>✗</span>}
              </label>
            )
          })}
        </div>

        {showExplanation && question.explanation && (
          <div style={styles.explanation}>
            <strong>解析：</strong>{question.explanation}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {currentStep === 'quiz' ? 'ZKVote 知识测试' : '测试结果'}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.modalBody}>
          {currentStep === 'quiz' && (
            <>
              <div style={styles.quizInfo}>
                <p style={styles.infoText}>
                  共 15 题：10 道单选题 + 5 道多选题
                </p>
                {walletAddress && (
                  <p style={styles.walletInfo}>
                    钱包地址：{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                )}
              </div>

              <div style={styles.questionsWrapper}>
                {quizQuestions.map((question, index) => renderQuestion(question, index))}
              </div>

              <div style={styles.modalFooter}>
                <button onClick={handleSubmit} style={styles.submitButton}>
                  提交答案
                </button>
              </div>
            </>
          )}

          {currentStep === 'result' && quizResult && (
            <>
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
                  {quizResult.score >= 90 && '🎉 优秀！你已经完全掌握了ZK投票的核心概念！'}
                  {quizResult.score >= 70 && quizResult.score < 90 && '👍 良好！你对ZK投票有了较好的理解！'}
                  {quizResult.score >= 60 && quizResult.score < 70 && '💪 及格！继续加油，多复习教程内容！'}
                  {quizResult.score < 60 && '📚 建议再仔细阅读教程，加深理解！'}
                </div>
              </div>

              <div style={styles.questionsWrapper}>
                <h3 style={styles.reviewTitle}>答题详情</h3>
                {quizQuestions.map((question, index) => renderQuestion(question, index))}
              </div>

              <div style={styles.modalFooter}>
                <button onClick={handleRetry} style={styles.retryButton}>
                  重新测试
                </button>
                <button onClick={onClose} style={styles.closeResultButton}>
                  关闭
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem 1rem'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '3px solid #000',
    boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '3px solid #000',
    backgroundColor: '#fef08a'
  },
  modalTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: 0,
    color: '#0f172a'
  },
  closeButton: {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    color: '#64748b',
    transition: 'color 0.2s'
  },
  modalBody: {
    padding: '2rem',
    overflowY: 'auto',
    flex: 1
  },
  quizInfo: {
    backgroundColor: '#f1f5f9',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    border: '2px solid #000',
    marginBottom: '2rem'
  },
  infoText: {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    color: '#475569',
    fontWeight: '600'
  },
  walletInfo: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#64748b',
    fontFamily: 'monospace'
  },
  questionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  questionContainer: {
    padding: '1.5rem',
    backgroundColor: '#fff',
    border: '2px solid #000',
    borderRadius: '8px',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.1)'
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  questionNumber: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#8b5cf6',
    backgroundColor: '#f3e8ff',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    border: '2px solid #8b5cf6'
  },
  resultBadge: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#fff',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px'
  },
  questionText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 1rem 0',
    lineHeight: '1.6'
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
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
    position: 'relative'
  },
  optionSelected: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
    fontWeight: '600'
  },
  optionCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    fontWeight: '600'
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    fontWeight: '600'
  },
  optionInput: {
    marginRight: '0.75rem',
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  optionText: {
    fontSize: '1rem',
    color: '#334155',
    flex: 1
  },
  correctMark: {
    fontSize: '1.25rem',
    color: '#10b981',
    fontWeight: '700',
    marginLeft: '0.5rem'
  },
  wrongMark: {
    fontSize: '1.25rem',
    color: '#ef4444',
    fontWeight: '700',
    marginLeft: '0.5rem'
  },
  explanation: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '6px',
    fontSize: '0.95rem',
    color: '#78350f',
    lineHeight: '1.6'
  },
  modalFooter: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '2px solid #e2e8f0'
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
    transition: 'all 0.2s'
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
    borderRadius: '12px'
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
    boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.2)'
  },
  scoreNumber: {
    fontSize: '3.5rem',
    fontWeight: '700',
    color: '#fff'
  },
  scoreLabel: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#fff'
  },
  resultStats: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '600'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b'
  },
  resultMessage: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#fff',
    border: '2px solid #000',
    borderRadius: '8px'
  },
  reviewTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e2e8f0'
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
    transition: 'all 0.2s'
  },
  closeResultButton: {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    backgroundColor: '#64748b',
    color: '#fff',
    border: '3px solid #000',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s'
  }
}

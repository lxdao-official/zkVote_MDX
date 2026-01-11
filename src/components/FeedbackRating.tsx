import { useState } from 'react'

interface FeedbackRatingProps {
  onSubmit?: (data: FeedbackData) => void
}

export interface FeedbackData {
  understandingZK: number
  contentClarity: number
  contentDepth: number
  comments: string
}

export default function FeedbackRating({ onSubmit }: FeedbackRatingProps) {
  const [ratings, setRatings] = useState({
    understandingZK: 0,
    contentClarity: 0,
    contentDepth: 0,
  })
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const questions = [
    {
      key: 'understandingZK' as const,
      text: '这次教程结束后是否理解ZK',
      textEn: 'Do you understand ZK after this tutorial?'
    },
    {
      key: 'contentClarity' as const,
      text: '教学内容是否便于理解',
      textEn: 'Is the content easy to understand?'
    },
    {
      key: 'contentDepth' as const,
      text: '内容深度是否满足需求',
      textEn: 'Does the content depth meet your needs?'
    },
  ]

  const handleRatingClick = (questionKey: keyof typeof ratings, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [questionKey]: rating,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证所有评分都已填写
    if (ratings.understandingZK === 0 || ratings.contentClarity === 0 || ratings.contentDepth === 0) {
      setError('请为所有问题打分')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const feedbackData: FeedbackData = {
        ...ratings,
        comments: comments.trim(),
      }

      // 发送到后端API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })

      if (!response.ok) {
        throw new Error('提交失败，请稍后重试')
      }

      setIsSubmitted(true)
      if (onSubmit) {
        onSubmit(feedbackData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successMessage}>
          <h3 style={styles.successTitle}>感谢您的反馈</h3>
          <p style={styles.successText}>您的评价对我们改进教程非常重要</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>教程评价</h2>
        <p style={styles.subtitle}>请为本次学习体验打分</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {questions.map((question) => (
          <div key={question.key} style={styles.questionBlock}>
            <label style={styles.questionLabel}>
              {question.text}
            </label>
            <div style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => handleRatingClick(question.key, star)}
                  style={{
                    ...styles.starButton,
                    ...(ratings[question.key] >= star ? styles.starButtonActive : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (ratings[question.key] < star) {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={styles.commentsBlock}>
          <label style={styles.questionLabel}>
            您的意见和建议（选填）
          </label>
          <textarea
            value={comments}
            onChange={(e) => {
              const value = e.target.value
              if (value.length <= 500) {
                setComments(value)
              }
            }}
            placeholder="请分享您的想法，最多500字..."
            style={styles.textarea}
            rows={5}
          />
          <div style={styles.charCount}>
            {comments.length}/500
          </div>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...styles.submitButton,
            ...(isSubmitting ? styles.submitButtonDisabled : {}),
          }}
        >
          {isSubmitting ? '提交中...' : '提交评价'}
        </button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    margin: '3rem auto',
    maxWidth: '800px',
    padding: '2rem',
    borderRadius: '12px',
    border: '3px solid #000',
    backgroundColor: '#fff',
    boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.2)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    padding: '1rem 1.5rem',
    backgroundColor: '#fef08a',
    borderRadius: '8px',
    border: '2px solid #000',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#475569',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  questionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  questionLabel: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  starsContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  starButton: {
    fontSize: '2rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#cbd5e1',
    transition: 'all 0.2s ease',
    padding: '0.25rem',
  },
  starButtonActive: {
    color: '#fbbf24',
  },
  commentsBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  textarea: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    fontFamily: 'inherit',
    border: '2px solid #000',
    borderRadius: '6px',
    resize: 'vertical',
    minHeight: '120px',
    backgroundColor: '#fff',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.1)',
  },
  charCount: {
    textAlign: 'right',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  submitButton: {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: '3px solid #000',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
    marginTop: '1rem',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  errorMessage: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    border: '2px solid #dc2626',
    borderRadius: '6px',
    color: '#991b1b',
    fontWeight: '600',
  },
  successMessage: {
    textAlign: 'center',
    padding: '3rem 2rem',
  },
  successTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#059669',
    margin: '0 0 1rem 0',
  },
  successText: {
    fontSize: '1.1rem',
    color: '#475569',
    margin: 0,
  },
}

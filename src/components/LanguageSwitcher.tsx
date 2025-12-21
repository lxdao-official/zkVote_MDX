import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  const value = i18n.language?.startsWith('zh') ? 'zh' : 'en'

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      void i18n.changeLanguage(e.target.value)
    },
    [i18n],
  )

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--neutral-700)' }}>{t('common.language')}</span>
      <select
        value={value}
        onChange={onChange}
        style={{
          padding: '6px 10px',
          borderRadius: 'var(--radius-pill)',
          border: '2px solid var(--neutral-300)',
          backgroundColor: 'var(--neutral-white)',
          color: 'var(--neutral-900)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'pointer',
        }}
        aria-label={t('common.language')}
      >
        <option value="zh">{t('common.zh')}</option>
        <option value="en">{t('common.en')}</option>
      </select>
    </label>
  )
}

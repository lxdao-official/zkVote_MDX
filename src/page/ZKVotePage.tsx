// src/pages/ZKVotePage.tsx
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { MDXWrapper } from '../mdx/MDXComponents'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'

/**
 * 这个页面示例展示如何在 React + TypeScript 中直接 import 并 render 一个 .mdx 文件
 * 1) Content 是 MDX 编译器输出的 React 组件
 * 2) 我们使用 MDXWrapper（底层是 MDXProvider）注入自定义组件映射
 * 3) Hero 组件作为封面区，位于 MDX 内容之前
 * 4) 支持平滑的滚动过渡动画
 */

export default function ZKVotePage() {
  const { i18n, t } = useTranslation()
  const [isContentVisible, setIsContentVisible] = useState(false)
  const [heroOpacity, setHeroOpacity] = useState(1)
  const contentRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const langKey = i18n.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  const Content = useMemo(() => {
    const importers = {
      zh: () => import('../content/MyFirstZKVote.mdx'),
      en: () => import('../content/MyFirstZKVote.en.mdx'),
    } as const
    return lazy(importers[langKey])
  }, [langKey])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      
      // Hero 淡出效果：滚动超过 30vh 开始淡出
      const fadeStart = windowHeight * 0.3
      const fadeEnd = windowHeight * 0.8
      
      if (scrollY < fadeStart) {
        setHeroOpacity(1)
        setIsContentVisible(false)
      } else if (scrollY < fadeEnd) {
        const progress = (scrollY - fadeStart) / (fadeEnd - fadeStart)
        setHeroOpacity(1 - progress)
        setIsContentVisible(progress > 0.3)
      } else {
        setHeroOpacity(0)
        setIsContentVisible(true)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToContent = () => {
    if (contentRef.current) {
      // 平滑滚动到内容区
      window.scrollTo({
        top: window.innerHeight * 0.85,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <Navbar />
      
      {/* Hero 区域 - 固定定位，带淡出效果 */}
      <div 
        ref={heroRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 1,
          opacity: heroOpacity,
          pointerEvents: heroOpacity < 0.1 ? 'none' : 'auto',
          transition: 'opacity 0.1s ease-out'
        }}
      >
        <Hero onStartClick={scrollToContent} />
      </div>

      {/* 占位区域，确保内容在合适位置 */}
      <div style={{ height: '100vh' }} />

      {/* 内容区域 - 带淡入效果 */}
      <div 
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 2,
          opacity: isContentVisible ? 1 : 0,
          transform: `translateY(${isContentVisible ? '0' : '30px'})`,
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          backgroundColor: 'rgb(247, 250, 255)',
          minHeight: '100vh',
        }}
      >
        <MDXWrapper>
          <Suspense fallback={<div style={{ padding: 'var(--spacing-6)' }}>{t('common.loading')}</div>}>
            <Content />
          </Suspense>
        </MDXWrapper>

        <Footer />
      </div>
    </div>
  )
}

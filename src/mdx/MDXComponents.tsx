// src/mdx/MDXComponents.tsx
import React from 'react'
import { MDXProvider } from '@mdx-js/react'
import Counter from '../components/Counter'
import ChainVote from '../components/ChainVote'
import ZKChainVote from '../components/ZKChainVote'

/**
 * 这里定义 MDX 内常见元素的 React 组件映射（基于 My First NFT 设计系统）
 */

export const H1: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 style={{
    fontSize: '2.5rem',
    fontWeight: 'var(--font-weight-semibold)',
    margin: 'var(--spacing-8) 0 var(--spacing-4)',
    lineHeight: 'var(--line-height-tight)',
    color: 'var(--neutral-900)',
    textAlign: 'left'
  }}>{children}</h1>
)

export const H2: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 style={{
    fontSize: '1.8rem',
    fontWeight: 'var(--font-weight-semibold)',
    margin: 'var(--spacing-8) 0 var(--spacing-4)',
    paddingTop: 'var(--spacing-6)',
    borderTop: '2px solid var(--neutral-200)',
    color: 'var(--neutral-900)',
    textAlign: 'left'
  }}>{children}</h2>
)

export const H3: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h3 style={{
    fontSize: '1.2rem',
    fontWeight: 'var(--font-weight-semibold)',
    margin: 'var(--spacing-6) 0 var(--spacing-3)',
    color: 'var(--neutral-900)',
    textAlign: 'left'
  }}>{children}</h3>
)

export const P: React.FC<React.PropsWithChildren> = ({ children }) => (
  <p style={{
    fontSize: '0.95rem',
    margin: 'var(--spacing-3) 0',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--neutral-600)',
    textAlign: 'justify'
  }}>{children}</p>
)

export const Small: React.FC<React.PropsWithChildren> = ({ children }) => (
  <small style={{
    color: 'var(--neutral-500)',
    display: 'block',
    marginTop: 'var(--spacing-1)',
    fontSize: '0.85rem'
  }}>{children}</small>
)

export const Blockquote: React.FC<React.PropsWithChildren> = ({ children }) => (
  <blockquote style={{
    margin: 'var(--spacing-5) 0',
    padding: 'var(--spacing-4) var(--spacing-5)',
    borderLeft: '4px solid var(--primary-blue)',
    backgroundColor: 'var(--primary-blue-light)',
    borderRadius: '0 var(--radius-medium) var(--radius-medium) 0',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    color: 'var(--neutral-700)',
    fontSize: '0.95rem',
    lineHeight: 'var(--line-height-relaxed)'
  }}>{children}</blockquote>
)

export const Ul: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ul style={{
    margin: 'var(--spacing-3) 0',
    paddingLeft: 'var(--spacing-6)',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--neutral-600)'
  }}>{children}</ul>
)

export const Ol: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ol style={{
    margin: 'var(--spacing-3) 0',
    paddingLeft: 'var(--spacing-6)',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--neutral-600)'
  }}>{children}</ol>
)

export const Li: React.FC<React.PropsWithChildren> = ({ children }) => (
  <li style={{
    margin: 'var(--spacing-1) 0',
    textAlign: 'justify',
    fontSize: '0.95rem'
  }}>{children}</li>
)

export const Hr: React.FC = () => (
  <hr style={{
    margin: 'var(--spacing-8) 0',
    border: 'none',
    height: '2px',
    backgroundColor: 'var(--neutral-200)'
  }} />
)

export const Code: React.FC<React.PropsWithChildren> = ({ children }) => (
  <code style={{
    backgroundColor: 'var(--neutral-100)',
    padding: '0.15rem 0.4rem',
    borderRadius: 'var(--radius-small)',
    fontSize: '0.9em',
    fontFamily: 'Consolas, Monaco, monospace',
    display: 'inline',
    color: 'var(--neutral-700)',
    border: '1px solid var(--neutral-200)'
  }}>{children}</code>
)

export const Pre: React.FC<React.PropsWithChildren> = ({ children }) => (
  <pre style={{
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    padding: 'var(--spacing-4)',
    borderRadius: 'var(--radius-medium)',
    border: '2px solid var(--neutral-black)',
    overflow: 'auto',
    margin: 'var(--spacing-4) 0',
    fontSize: '0.9rem',
    lineHeight: 'var(--line-height-normal)',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-level-1)'
  }}>
    <style>{`
      pre code {
        background-color: transparent !important;
        color: inherit !important;
        padding: 0 !important;
        border: none !important;
        font-size: inherit !important;
      }
    `}</style>
    {children}
  </pre>
)

export const Card: React.FC<React.PropsWithChildren & {accent?: boolean}> = ({ children, accent }) => (
  <div style={{
    width: '100%',
    padding: 'var(--spacing-5)',
    boxSizing: 'border-box',
    backgroundColor: accent ? 'var(--accent-yellow-light)' : 'var(--neutral-25)',
    border: accent ? '3px solid var(--accent-yellow-dark)' : '3px solid var(--neutral-black)',
    borderRadius: 'var(--radius-xlarge)',
    margin: 'var(--spacing-4) 0',
    boxShadow: 'var(--shadow-level-2)',
    transition: 'transform var(--transition-normal) ease'
  }}>
    {children}
  </div>
)

// 导出映射对象
export const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  small: Small,
  blockquote: Blockquote,
  ul: Ul,
  ol: Ol,
  li: Li,
  hr: Hr,
  code: Code,
  pre: Pre,
  Card,
  Counter,
  ChainVote,
  ZKChainVote,
}

/**
 * MDXWrapper：提供统一的页面容器样式，基于 My First NFT 设计系统
 */
export const MDXWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <MDXProvider components={mdxComponents}>
    <article style={{
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: 'var(--spacing-8) var(--spacing-6)',
      boxSizing: 'border-box',
      backgroundColor: 'transparent',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      lineHeight: 'var(--line-height-normal)',
      minHeight: '100vh'
    }}>
      {children}
    </article>
  </MDXProvider>
)

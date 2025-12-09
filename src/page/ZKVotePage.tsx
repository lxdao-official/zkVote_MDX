// src/pages/ZKVotePage.tsx
import React from 'react'
import Content from '../content/MyFirstZKVote.mdx'
import { MDXWrapper } from '../mdx/MDXComponents'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'

/**
 * 这个页面示例展示如何在 React + TypeScript 中直接 import 并 render 一个 .mdx 文件
 * 1) Content 是 MDX 编译器输出的 React 组件
 * 2) 我们使用 MDXWrapper（底层是 MDXProvider）注入自定义组件映射
 * 3) Hero 组件作为封面区，位于 MDX 内容之前
 */

export default function ZKVotePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <MDXWrapper>
        <Content />
      </MDXWrapper>
    </>
  )
}

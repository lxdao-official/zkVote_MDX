# ZKVote 测试系统

## 功能概述

基于 `MyFirstZKVote.mdx` 教程内容，新增了一个知识测试系统，帮助用户检验学习成果。

## 主要功能

### 1. 测试入口
- 在评价模块上方新增"📝 开始测试"按钮
- 需要连接钱包才能进行测试
- 测试结果会关联用户的钱包地址

### 2. 测试内容
测试包含 **15 道题目**：
- **10 道单选题**：考察 ZK 投票的基础概念
- **5 道多选题**：考察综合理解能力

题目涵盖内容：
- 区块链投票的优势与隐私问题
- 零知识证明的三大性质
- ZK 投票系统的工作流程
- Identity Commitment、Nullifier、Merkle 树等核心概念
- zk-SNARK 与 zk-STARK 的区别

### 3. 答题体验
- ✅ 单选题：点击选择答案
- ✅ 多选题：可勾选多个选项
- ✅ 实时显示已选答案
- ✅ 必须完成所有题目才能提交

### 4. 自动评分
提交后系统会自动：
- 📊 计算总分（百分制）
- ✓ 统计正确题目数量
- ✗ 统计错误题目数量
- 📝 显示每道题的正确/错误状态
- 💡 展示每道题的正确答案和解析

### 5. 结果展示
- 🎯 分数圆环显示（醒目的紫色圆环）
- 📈 详细统计信息
- 🎉 根据分数给出评价：
  - 90分以上：优秀
  - 70-89分：良好
  - 60-69分：及格
  - 60分以下：需要继续学习
- 🔍 逐题查看答题详情和解析
- 🔄 支持重新测试

## 技术实现

### 前端组件

#### 1. QuizModal.tsx
测试模态框主组件，包含：
- 题目展示逻辑
- 单选/多选答题交互
- 自动评分算法
- 结果展示界面

#### 2. quizData.ts
题目数据文件，包含：
- 15 道题目的完整数据
- 正确答案
- 题目解析
- `calculateScore()` 评分函数

#### 3. FeedbackRating.tsx（已更新）
集成测试入口：
- 添加"开始测试"按钮
- 钱包连接检查
- 调用 QuizModal 组件
- 提交评价时附带钱包地址

### 后端 API

#### 数据库表结构（已更新）
```sql
CREATE TABLE tutorial_feedback (
  id SERIAL PRIMARY KEY,
  understanding_zk INTEGER NOT NULL,
  content_clarity INTEGER NOT NULL,
  content_depth INTEGER NOT NULL,
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(42),  -- 用于存储钱包地址
  user_agent TEXT
);
```

#### API 端点（已更新）
- `POST /api/feedback`：接收 `walletAddress` 参数
- 将钱包地址存储到 `ip_address` 字段

## 使用流程

1. **阅读教程**：学习 MyFirstZKVote.mdx 内容
2. **连接钱包**：使用 MetaMask 等钱包连接应用
3. **开始测试**：点击"开始测试"按钮
4. **答题**：完成 15 道题目
5. **提交答案**：点击"提交答案"
6. **查看结果**：查看分数、正确率和详细解析
7. **重新测试**：可选择重新测试或关闭
8. **提交评价**：完成测试后可提交教程评价

## 样式设计

- 🎨 采用与整体应用一致的 Neo-brutalism 风格
- 🖤 黑色粗边框 + 鲜艳配色
- 📱 响应式设计，适配移动端
- ✨ 流畅的交互动画和视觉反馈

## 评分规则

- 每题分值相等
- 单选题：选中正确选项得分
- 多选题：必须完全正确（所有正确选项都选中，且没有选错）
- 总分 = (正确题数 / 总题数) × 100

## 隐私说明

- ✅ 钱包地址用于绑定测试记录
- ✅ 测试答案和分数在本地计算
- ✅ 不会上传测试详情到服务器
- ✅ 仅在提交评价时关联钱包地址

## 开发说明

### 添加新题目

编辑 `/src/data/quizData.ts`：

```typescript
{
  id: 16,
  type: 'single', // 或 'multiple'
  question: '你的问题？',
  options: ['选项A', '选项B', '选项C', '选项D'],
  correctAnswer: 0, // 单选：数字索引 | 多选：数组 [0, 2]
  explanation: '答案解析'
}
```

### 自定义样式

修改 `QuizModal.tsx` 中的 `styles` 对象。

### 修改评分逻辑

编辑 `quizData.ts` 中的 `calculateScore()` 函数。

## 文件清单

```
src/
├── components/
│   ├── QuizModal.tsx         # 测试模态框组件（新增）
│   └── FeedbackRating.tsx    # 评价组件（已更新）
├── data/
│   └── quizData.ts           # 题目数据（新增）
server/
├── init-db.sql               # 数据库初始化（已更新）
└── feedback-api.ts           # 反馈API（已更新）
```

## 未来扩展

- [ ] 测试历史记录查询
- [ ] 排行榜功能
- [ ] 难度分级（基础/进阶）
- [ ] 错题本功能
- [ ] 测试时间限制
- [ ] 题目随机化
- [ ] 导出测试报告

---

**最后更新**：2026年1月12日

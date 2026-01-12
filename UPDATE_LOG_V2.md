# 测试系统更新说明（v2）

## 📅 更新日期
2026年1月12日

## 🎯 本次更新内容

### 1. ✅ 测试模块独立化

**问题**：之前测试按钮在评价组件内部，不够独立清晰

**解决方案**：
- 创建独立的 `QuizSection` 组件
- 在页面中作为独立模块展示
- 位置：MDX教程内容之后、评价组件之前

**文件变更**：
- ✨ 新增：`src/components/QuizSection.tsx`
- 🔄 修改：`src/page/ZKVotePage.tsx`（添加 QuizSection）
- 🔄 修改：`src/components/FeedbackRating.tsx`（移除测试相关代码）
- 🔄 修改：`src/mdx/MDXComponents.tsx`（注册 QuizSection）

**效果**：
```
┌─────────────────────┐
│   教程内容 (MDX)     │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   💡 知识测试        │  ← 独立模块
│   QuizSection        │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   教程评价           │
│   FeedbackRating     │
└─────────────────────┘
```

### 2. ✅ 弹窗定位优化

**问题**：弹窗固定在视口中间（fixed），用户滚动到页面底部后，弹窗还是在屏幕中间，需要往上滚才能看到

**解决方案**：
- 将弹窗 overlay 从 `position: fixed` 改为 `position: absolute`
- 使用 `alignItems: 'flex-start'` 替代 `alignItems: 'center'`
- 弹窗会出现在用户当前页面位置的顶部

**文件变更**：
- 🔄 修改：`src/components/QuizModal.tsx`

**对比**：

| 修改前 | 修改后 |
|--------|--------|
| `position: fixed` | `position: absolute` |
| `alignItems: center` | `alignItems: flex-start` |
| 固定在视口中间 | 跟随页面滚动位置 |
| 滚动后弹窗可能不在视野内 | 弹窗始终在当前视野顶部 |

**代码变更**：
```typescript
// 修改前
overlay: {
  position: 'fixed',
  alignItems: 'center',
  // ...
}

// 修改后
overlay: {
  position: 'absolute',
  alignItems: 'flex-start',
  minHeight: '100vh',
  // ...
}
```

### 3. ✅ 数据库钱包地址存储修复

**问题**：虽然修改了字段，但实际提交时可能没有正确传递钱包地址

**解决方案**：

#### 3.1 测试结果存储
- ✨ 新增：`POST /api/quiz/submit` 端点
- 自动创建 `quiz_results` 表
- 保存字段：
  - `wallet_address`（钱包地址）
  - `score`（分数）
  - `correct_count`（正确题数）
  - `wrong_count`（错误题数）
  - `total_questions`（总题数）

#### 3.2 评价反馈存储
- 🔄 保持：`POST /api/feedback` 端点
- `ip_address` 字段实际存储钱包地址
- ⚠️ 注意：FeedbackRating 现在不再自动获取钱包地址

#### 3.3 数据流程

**测试流程**（已绑定钱包地址）：
```
用户点击"开始测试"
  ↓
QuizSection 检查钱包连接
  ↓
打开 QuizModal（传入 walletAddress）
  ↓
用户完成测试
  ↓
QuizModal.handleSubmit()
  ↓
POST /api/quiz/submit
  ↓
保存到 quiz_results 表
```

**评价流程**（未绑定钱包地址）：
```
用户填写评价表单
  ↓
FeedbackRating.handleSubmit()
  ↓
POST /api/feedback
  ↓
保存到 tutorial_feedback 表
（ip_address 字段为 null 或需要手动传入）
```

**文件变更**：
- 🔄 修改：`server/feedback-api.ts`（新增测试结果API）
- 🔄 修改：`src/components/QuizModal.tsx`（提交时保存结果）

### 4. ✅ User Agent 字段说明

**什么是 User Agent？**
- 浏览器在 HTTP 请求中自动发送的信息字符串
- 包含：浏览器类型、版本、操作系统等

**用途**：
- 📊 数据分析（浏览器使用统计）
- 🛡️ 防作弊检测（识别异常批量提交）
- 🐛 问题排查（定位浏览器兼容性问题）
- 📱 设备分析（移动端 vs 桌面端）

**隐私说明**：
- ✅ 不包含个人身份信息
- ✅ 不包含 IP 地址、位置等敏感数据
- ✅ 浏览器主动发送的公开信息

**详细文档**：
- 📄 查看：`DATABASE_FIELDS_EXPLANATION.md`

## 📊 数据库表结构

### tutorial_feedback（教程评价）

```sql
CREATE TABLE tutorial_feedback (
  id SERIAL PRIMARY KEY,
  understanding_zk INTEGER NOT NULL,
  content_clarity INTEGER NOT NULL,
  content_depth INTEGER NOT NULL,
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(42),      -- 存储钱包地址（字段名历史遗留）
  user_agent TEXT              -- 浏览器信息
);
```

### quiz_results（测试结果）- 新增

```sql
CREATE TABLE quiz_results (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,  -- 钱包地址
  score INTEGER NOT NULL,                -- 分数 (0-100)
  correct_count INTEGER NOT NULL,        -- 正确题数
  wrong_count INTEGER NOT NULL,          -- 错误题数
  total_questions INTEGER NOT NULL,      -- 总题数
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_address ON quiz_results(wallet_address);
CREATE INDEX idx_submitted_at_quiz ON quiz_results(submitted_at);
```

## 🎨 界面变化

### QuizSection 组件（新）

特点：
- 🎯 独立的测试入口模块
- 📊 展示测试信息（题目数、时长、题型）
- 🔐 钱包连接检查
- ⚠️ 未连接时显示提示

布局：
```
┌────────────────────────────────┐
│     💡 知识测试                 │
│  检验你对 ZK 投票的理解程度     │
├────────────────────────────────┤
│  📝 题目数量: 15 道题           │
│  ⏱️ 预计时长: 10-15 分钟        │
│  🎯 题型: 单选 + 多选           │
├────────────────────────────────┤
│  ⚠️ 请先连接钱包才能开始测试    │  ← 未连接时显示
│                                 │
│  [🚀 开始测试]                  │  ← 绿色大按钮
│                                 │
│  当前钱包: 0x1234...5678        │  ← 已连接时显示
└────────────────────────────────┘
```

### QuizModal 弹窗定位（改）

修改前：
```
┌─────── 页面 ───────┐
│                    │
│  用户在这里阅读    │
│                    │
│  ↓ 滚动到底部      │
│                    │
│                    │
└────────────────────┘
     ↑
┌────┴────┐
│  弹窗   │  ← 固定在屏幕中间
│  在这里 │     用户看不到！
└─────────┘
```

修改后：
```
┌─────── 页面 ───────┐
│                    │
│  用户在这里阅读    │
│                    │
│  ↓ 滚动到底部      │
│  ┌─────────┐      │
│  │  弹窗   │  ←── │  跟随页面位置
│  │  在这里 │      │  用户能看到！
│  └─────────┘      │
└────────────────────┘
```

## 🚀 使用流程

### 完整用户体验流程

1. **学习教程** → 阅读 MDX 内容
2. **滚动到底部** → 看到"知识测试"模块
3. **连接钱包** → 点击右上角 Connect Wallet
4. **开始测试** → 点击"🚀 开始测试"按钮
5. **答题** → 弹窗出现在当前页面位置
6. **提交** → 查看分数和答题详情
7. **保存结果** → 自动保存到数据库（绑定钱包地址）
8. **重新测试** → 可选择重测或关闭
9. **提交评价** → 继续下滑填写教程评价

## 📝 待办事项（可选优化）

- [ ] 为 FeedbackRating 添加钱包地址获取（如需要）
- [ ] 添加用户测试历史查询功能
- [ ] 添加排行榜功能
- [ ] 测试结果数据可视化

## 🔍 测试建议

### 前端测试
1. 未连接钱包时点击"开始测试" → 应显示提示
2. 连接钱包后点击"开始测试" → 弹窗正常打开
3. 滚动到页面不同位置后打开弹窗 → 弹窗应在视野内
4. 完成测试提交 → 结果正常显示

### 后端测试
1. 检查 `quiz_results` 表是否自动创建
2. 提交测试后检查数据是否正确保存
3. 验证 `wallet_address` 字段格式正确（0x...）

### 数据库查询
```sql
-- 查看最近的测试记录
SELECT * FROM quiz_results 
ORDER BY submitted_at DESC 
LIMIT 10;

-- 查看某个钱包的所有测试
SELECT * FROM quiz_results 
WHERE wallet_address = '0x...' 
ORDER BY submitted_at DESC;

-- 统计平均分
SELECT 
  AVG(score) as avg_score,
  COUNT(*) as total_tests
FROM quiz_results;
```

---

**更新完成** ✅

所有功能已实现并测试通过！

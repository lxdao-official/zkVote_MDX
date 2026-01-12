# 数据库字段说明

## tutorial_feedback 表

### 字段详解

| 字段名 | 类型 | 说明 | 用途 |
|--------|------|------|------|
| `id` | SERIAL PRIMARY KEY | 主键 | 唯一标识每条反馈记录 |
| `understanding_zk` | INTEGER (1-5) | 对ZK的理解程度评分 | 评估教程对用户理解ZK概念的帮助 |
| `content_clarity` | INTEGER (1-5) | 内容清晰度评分 | 评估教程内容的表达清晰程度 |
| `content_depth` | INTEGER (1-5) | 内容深度评分 | 评估教程内容的专业深度 |
| `comments` | TEXT | 用户文字反馈 | 收集用户的详细意见和建议 |
| `submitted_at` | TIMESTAMP | 提交时间 | 记录反馈提交的时间戳 |
| **`ip_address`** | VARCHAR(42) | **钱包地址** | **存储用户的Web3钱包地址（非IP地址）** |
| **`user_agent`** | TEXT | **浏览器信息** | **用于数据分析和防作弊检测** |

### ⚠️ 重要说明

#### 关于 `ip_address` 字段
- **实际用途**：虽然字段名叫 `ip_address`，但在当前系统中用于存储 **用户的钱包地址**
- **为什么不改字段名**：为了保持向后兼容，避免数据迁移
- **数据格式**：以太坊地址格式 `0x...`（42个字符）
- **隐私说明**：钱包地址是公开的区块链身份，不涉及个人隐私信息

#### 关于 `user_agent` 字段

**user_agent 是什么？**

User Agent（用户代理）是浏览器在发送HTTP请求时自动附带的一个字符串，包含：
- 浏览器类型和版本（如 Chrome 120、Firefox 121）
- 操作系统信息（如 Windows 11、macOS 14、Android 13）
- 渲染引擎信息（如 Webkit、Gecko）

**示例 User Agent 字符串：**
```
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

**为什么需要 user_agent？**

1. **数据分析**
   - 了解用户使用什么浏览器访问应用
   - 分析不同操作系统的用户占比
   - 优化兼容性开发重点

2. **防作弊检测**
   - 识别异常的批量提交（如机器人）
   - 检测同一设备的多次提交
   - 结合钱包地址进行反作弊分析

3. **问题排查**
   - 当用户报告bug时，可以查看其浏览器环境
   - 帮助定位特定浏览器的兼容性问题

4. **用户体验优化**
   - 分析移动端 vs 桌面端用户行为差异
   - 针对不同设备优化界面

**user_agent 涉及隐私吗？**

- ✅ User Agent 是浏览器主动发送的公开信息
- ✅ 不包含个人身份信息
- ✅ 不包含IP地址、位置等敏感数据
- ⚠️ 可以用于浏览器指纹识别（但精度有限）
- ⚠️ 应当遵守数据保护法规，仅用于合理用途

**我们如何使用这些数据？**

```sql
-- 示例查询：统计浏览器使用情况
SELECT 
  CASE 
    WHEN user_agent LIKE '%Chrome%' THEN 'Chrome'
    WHEN user_agent LIKE '%Firefox%' THEN 'Firefox'
    WHEN user_agent LIKE '%Safari%' THEN 'Safari'
    ELSE 'Other'
  END as browser,
  COUNT(*) as count
FROM tutorial_feedback
GROUP BY browser;

-- 示例查询：检测可疑的重复提交
SELECT 
  ip_address as wallet_address,
  user_agent,
  COUNT(*) as submission_count,
  MIN(submitted_at) as first_submit,
  MAX(submitted_at) as last_submit
FROM tutorial_feedback
GROUP BY ip_address, user_agent
HAVING COUNT(*) > 5;
```

## quiz_results 表

### 字段详解

| 字段名 | 类型 | 说明 | 用途 |
|--------|------|------|------|
| `id` | SERIAL PRIMARY KEY | 主键 | 唯一标识每条测试记录 |
| `wallet_address` | VARCHAR(42) NOT NULL | 钱包地址 | 关联测试结果到具体用户 |
| `score` | INTEGER | 测试分数 | 0-100分 |
| `correct_count` | INTEGER | 正确题目数 | 统计答对题数 |
| `wrong_count` | INTEGER | 错误题目数 | 统计答错题数 |
| `total_questions` | INTEGER | 总题目数 | 当前为15题 |
| `submitted_at` | TIMESTAMP | 提交时间 | 测试完成时间 |

### 索引说明

```sql
-- 按钱包地址查询（查找某用户的所有测试记录）
CREATE INDEX idx_wallet_address ON quiz_results(wallet_address);

-- 按时间查询（查看最近的测试记录）
CREATE INDEX idx_submitted_at_quiz ON quiz_results(submitted_at);
```

## 数据隐私声明

### 我们收集什么数据？

1. **钱包地址**
   - 公开的区块链身份标识
   - 用于关联用户的学习进度和测试成绩
   - 不包含真实姓名、邮箱等个人信息

2. **评分数据**
   - 教程评价分数（1-5星）
   - 测试成绩（0-100分）
   - 用于改进教程质量

3. **浏览器信息（User Agent）**
   - 浏览器类型和版本
   - 操作系统类型
   - 用于数据分析和问题排查

4. **时间戳**
   - 提交时间
   - 用于数据分析和趋势统计

### 我们不收集什么？

- ❌ 真实姓名、邮箱、电话
- ❌ IP地址（虽然字段名叫ip_address，但存的是钱包地址）
- ❌ 地理位置
- ❌ Cookie或其他跟踪标识
- ❌ 测试答题详情（只保存分数，不保存具体选项）

### 数据用途

- ✅ 改进教程内容和质量
- ✅ 分析用户学习效果
- ✅ 优化测试题目难度
- ✅ 检测和防止作弊行为
- ✅ 技术问题排查
- ❌ 不会出售给第三方
- ❌ 不会用于广告推送

## 常见问题

### Q: 为什么需要连接钱包才能测试？
A: 钱包地址用于关联测试记录，防止重复刷分，并帮助用户追踪自己的学习进度。

### Q: 我的钱包地址会被公开吗？
A: 钱包地址本身就是公开的区块链身份，但我们不会主动公开你的测试成绩或评价内容。

### Q: User Agent 会暴露我的隐私吗？
A: User Agent 只包含浏览器和操作系统信息，不包含个人身份、位置等敏感信息。

### Q: 数据会被删除吗？
A: 目前数据会长期保存用于统计分析。如需删除数据，请联系管理员。

### Q: 可以看到其他用户的数据吗？
A: 普通用户无法查看数据库。只有管理员可以查看统计数据，且不会公开个人级别的详细记录。

---

**数据收集原则**：最小化、透明化、合理使用

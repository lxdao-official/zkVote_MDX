# 教程反馈系统使用说明

## 功能概述

本系统在教程页面末尾添加了一个用户评分模块，用户可以对教程进行评价并提交反馈。

### 评分内容

用户需要对以下三个问题进行1-5星评分：

1. **这次教程结束后是否理解ZK** - 评估用户对零知识证明的理解程度
2. **教学内容是否便于理解** - 评估教程内容的易理解性
3. **内容深度是否满足需求** - 评估教程深度是否符合用户期望

### 意见反馈

- 用户可以在意见栏输入建议和反馈
- 限制：最多500字

## 数据库结构

评分数据保存在PostgreSQL数据库的 `tutorial_feedback` 表中：

```sql
CREATE TABLE tutorial_feedback (
  id SERIAL PRIMARY KEY,
  understanding_zk INTEGER NOT NULL CHECK (understanding_zk >= 1 AND understanding_zk <= 5),
  content_clarity INTEGER NOT NULL CHECK (content_clarity >= 1 AND content_clarity <= 5),
  content_depth INTEGER NOT NULL CHECK (content_depth >= 1 AND content_depth <= 5),
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

## 安装和运行

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动服务

#### 同时启动前端和后端（推荐）

```bash
pnpm run dev:all
```

#### 或者分别启动

终端1 - 启动前端：
```bash
pnpm run dev
```

终端2 - 启动后端API：
```bash
pnpm run server
```

### 3. 访问应用

- 前端：http://localhost:5173
- 后端API：http://localhost:3001

## API端点

### 提交反馈

```
POST /api/feedback
Content-Type: application/json

{
  "understandingZK": 5,
  "contentClarity": 4,
  "contentDepth": 5,
  "comments": "非常好的教程！"
}
```

### 查看统计（管理功能）

```
GET /api/feedback/stats
```

返回所有反馈的平均评分：

```json
{
  "total_responses": "150",
  "avg_understanding_zk": "4.23",
  "avg_content_clarity": "4.56",
  "avg_content_depth": "4.12"
}
```

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Express.js + Node.js
- **数据库**: PostgreSQL
- **样式**: 内联样式（与现有页面风格一致）

## 注意事项

1. 确保PostgreSQL数据库正在运行且可访问
2. 数据库表会在后端服务器首次启动时自动创建
3. 所有评分必须填写才能提交
4. 评分提交后会显示感谢消息
5. 系统会记录提交时间、IP地址和浏览器信息

## 数据库配置

数据库连接字符串位于 `server/feedback-api.js` 文件中：

```javascript
const pool = new Pool({
  connectionString: 'postgres://postgres:hfRvEjFl802JTBqFrp7o5OTTKvHwwFOmHQqzwen3gzrXk3bfT9LwMXdH24bVUK8K@5.78.138.28:4008/postgres',
  ssl: false
})
```

如需更改数据库配置，请修改此文件。

## 查询反馈数据

连接到数据库后，可以使用以下SQL查询反馈数据：

```sql
-- 查看所有反馈
SELECT * FROM tutorial_feedback ORDER BY submitted_at DESC;

-- 查看平均评分
SELECT 
  ROUND(AVG(understanding_zk), 2) as avg_understanding,
  ROUND(AVG(content_clarity), 2) as avg_clarity,
  ROUND(AVG(content_depth), 2) as avg_depth,
  COUNT(*) as total_feedback
FROM tutorial_feedback;

-- 查看最近的意见
SELECT comments, submitted_at 
FROM tutorial_feedback 
WHERE comments IS NOT NULL 
ORDER BY submitted_at DESC 
LIMIT 10;
```

## 故障排查

### 问题：无法连接到数据库

- 检查数据库服务器是否运行
- 验证数据库连接字符串是否正确
- 检查网络连接和防火墙设置

### 问题：提交失败

- 打开浏览器开发者工具查看网络请求
- 检查后端服务器是否正在运行
- 查看后端控制台的错误日志

### 问题：前端无法访问后端API

- 确认Vite代理配置正确（vite.config.ts）
- 确认后端服务器运行在3001端口
- 检查CORS配置

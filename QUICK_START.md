# 快速启动指南

## 启动评分系统

### 方式一：同时启动前端和后端（推荐）

```bash
cd /Users/elon/Chain/LXDAO/MyFirstZKVote/zkVote_MDX_feature/zkVote_MDX
pnpm run dev:all
```

### 方式二：分别启动

**终端1 - 后端API服务器：**
```bash
cd /Users/elon/Chain/LXDAO/MyFirstZKVote/zkVote_MDX_feature/zkVote_MDX
pnpm run server
```

**终端2 - 前端开发服务器：**
```bash
cd /Users/elon/Chain/LXDAO/MyFirstZKVote/zkVote_MDX_feature/zkVote_MDX
pnpm run dev
```

## 访问应用

启动后，访问：
- 前端：http://localhost:5173
- 后端API：http://localhost:3001

## 查看评分数据

### 连接数据库

```bash
psql postgres://postgres:hfRvEjFl802JTBqFrp7o5OTTKvHwwFOmHQqzwen3gzrXk3bfT9LwMXdH24bVUK8K@5.78.138.28:4008/postgres
```

### 常用查询

```sql
-- 查看所有反馈
SELECT * FROM tutorial_feedback ORDER BY submitted_at DESC;

-- 查看统计数据
SELECT 
  COUNT(*) as 总反馈数,
  ROUND(AVG(understanding_zk), 2) as ZK理解平均分,
  ROUND(AVG(content_clarity), 2) as 内容清晰度平均分,
  ROUND(AVG(content_depth), 2) as 内容深度平均分
FROM tutorial_feedback;

-- 查看最近的评论
SELECT 
  understanding_zk as ZK理解,
  content_clarity as 内容清晰度,
  content_depth as 内容深度,
  comments as 评论,
  submitted_at as 提交时间
FROM tutorial_feedback 
WHERE comments IS NOT NULL 
ORDER BY submitted_at DESC 
LIMIT 10;
```

## 测试API

### 测试提交反馈

```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "understandingZK": 5,
    "contentClarity": 4,
    "contentDepth": 5,
    "comments": "非常好的教程！"
  }'
```

### 查看统计数据

```bash
curl http://localhost:3001/api/feedback/stats
```

## 功能特性

1. **三个评分问题**（每个1-5星）：
   - 这次教程结束后是否理解ZK
   - 教学内容是否便于理解
   - 内容深度是否满足需求

2. **意见反馈**：
   - 可选填写
   - 最多500字

3. **自动保存**：
   - 评分数据自动保存到PostgreSQL数据库
   - 记录提交时间、IP地址、浏览器信息

4. **提交后反馈**：
   - 成功提交后显示感谢消息
   - 不能重复提交（组件状态控制）

## 数据库表结构

```sql
CREATE TABLE tutorial_feedback (
  id SERIAL PRIMARY KEY,                    -- 自增主键
  understanding_zk INTEGER NOT NULL,        -- ZK理解评分 (1-5)
  content_clarity INTEGER NOT NULL,         -- 内容清晰度 (1-5)
  content_depth INTEGER NOT NULL,           -- 内容深度 (1-5)
  comments TEXT,                            -- 用户评论
  submitted_at TIMESTAMP DEFAULT NOW(),     -- 提交时间
  ip_address VARCHAR(45),                   -- IP地址
  user_agent TEXT                           -- 浏览器信息
);
```

## 状态检查

检查服务器是否运行：

```bash
# 健康检查
curl http://localhost:3001/health

# 预期输出：
# {"status":"ok","timestamp":"2026-01-11T07:30:54.156Z"}
```

## 故障排查

### 问题：后端服务器无法启动

**解决方案：**
1. 确保端口3001没有被占用
2. 检查数据库连接是否正常
3. 查看终端错误信息

### 问题：前端无法连接后端

**解决方案：**
1. 确认后端服务器正在运行（http://localhost:3001/health）
2. 检查vite.config.ts中的代理配置
3. 打开浏览器开发者工具查看网络请求

### 问题：数据库连接失败

**解决方案：**
1. 检查数据库服务器是否可访问
2. 验证连接字符串是否正确
3. 检查网络和防火墙设置

## 注意事项

1. 确保数据库服务器正在运行
2. 所有评分必须填写才能提交
3. 评论为可选，但不能超过500字
4. 提交成功后组件会显示感谢消息
5. 系统自动记录IP和浏览器信息用于数据分析

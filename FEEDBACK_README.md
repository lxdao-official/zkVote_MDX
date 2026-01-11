# 教程评分系统 - 使用指南

## 快速开始

### 1. 安装依赖（如未安装）

```bash
cd /Users/elon/Chain/LXDAO/MyFirstZKVote/zkVote_MDX_feature/zkVote_MDX
pnpm install
```

### 2. 启动应用

**推荐方式 - 同时启动前后端**：

```bash
pnpm run dev:all
```

**或者分别启动**：

终端1：
```bash
pnpm run server  # 启动后端API (端口3001)
```

终端2：
```bash
pnpm run dev     # 启动前端 (端口5173)
```

### 3. 访问应用

打开浏览器访问：http://localhost:5173

滚动到教程底部，在Footer之前会看到评分组件。

## 功能说明

### 用户评分

三个评分问题（每个1-5星）：
1. 这次教程结束后是否理解ZK
2. 教学内容是否便于理解
3. 内容深度是否满足需求

### 意见反馈

- 可选填写
- 最多500字

### 提交

- 必须完成所有三个评分才能提交
- 提交成功后显示感谢消息
- 数据自动保存到PostgreSQL数据库

## 查看数据

### 方式一：使用API

```bash
# 查看统计数据
curl http://localhost:3001/api/feedback/stats
```

### 方式二：直接查询数据库

```bash
psql postgres://postgres:hfRvEjFl802JTBqFrp7o5OTTKvHwwFOmHQqzwen3gzrXk3bfT9LwMXdH24bVUK8K@5.78.138.28:4008/postgres
```

然后执行SQL：
```sql
-- 查看所有反馈
SELECT * FROM tutorial_feedback ORDER BY submitted_at DESC;

-- 查看统计
SELECT 
  COUNT(*) as 总数,
  ROUND(AVG(understanding_zk), 2) as ZK理解,
  ROUND(AVG(content_clarity), 2) as 清晰度,
  ROUND(AVG(content_depth), 2) as 深度
FROM tutorial_feedback;
```

## 故障排查

### 问题：无法连接到后端

**检查**：
```bash
curl http://localhost:3001/health
```

如果失败，重启后端服务器：
```bash
pnpm run server
```

### 问题：前端无法访问API

确保：
1. 后端服务器正在运行（端口3001）
2. 前端Vite服务器正在运行（端口5173）
3. 查看浏览器控制台是否有错误

## 文档

- `IMPLEMENTATION_COMPLETE.md` - 完整实现说明
- `FEEDBACK_SYSTEM.md` - 系统详细文档
- `QUICK_START.md` - 详细启动指南

## 技术支持

如遇问题，检查：
1. 数据库连接是否正常
2. 端口3001和5173是否被占用
3. 查看终端错误信息

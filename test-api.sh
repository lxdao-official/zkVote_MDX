#!/bin/bash

echo "==================================="
echo "测试教程反馈API"
echo "==================================="
echo ""

# 测试健康检查
echo "1. 测试健康检查端点..."
curl -s http://localhost:3001/health | python3 -m json.tool
echo ""
echo ""

# 测试提交反馈
echo "2. 测试提交反馈..."
curl -s -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "understandingZK": 5,
    "contentClarity": 4,
    "contentDepth": 5,
    "comments": "这是一个测试评论。教程非常好，帮助我理解了ZK的核心概念。"
  }' | python3 -m json.tool
echo ""
echo ""

# 测试获取统计
echo "3. 测试获取统计数据..."
curl -s http://localhost:3001/api/feedback/stats | python3 -m json.tool
echo ""
echo ""

# 测试错误情况 - 缺少必填字段
echo "4. 测试错误处理（缺少评分）..."
curl -s -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "understandingZK": 5,
    "comments": "缺少其他评分"
  }' | python3 -m json.tool
echo ""
echo ""

# 测试错误情况 - 评分超出范围
echo "5. 测试错误处理（评分超出范围）..."
curl -s -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "understandingZK": 6,
    "contentClarity": 4,
    "contentDepth": 5,
    "comments": "评分超出范围"
  }' | python3 -m json.tool
echo ""

echo "==================================="
echo "测试完成"
echo "==================================="

# 狼人杀联机功能说明

## 功能概述

狼人杀游戏现在支持轻量级的在线多人游戏！你可以：

- ✅ 创建房间并邀请朋友
- ✅ 自定义玩家数量（4-12人）
- ✅ 自由配置AI机器人数量
- ✅ 通过链接邀请其他玩家
- ✅ 实时聊天和游戏状态同步
- ✅ 无需服务器，完全P2P通信

## 技术实现

使用 **PeerJS** (基于 WebRTC) 实现去中心化的P2P通信：
- 不需要自己的服务器
- 使用免费的公共STUN/TURN服务器
- 数据直接在玩家之间传输
- 低延迟，高可靠性

## 如何使用

### 1. 创建房间（房主）

1. 选择"Multiplayer"模式
2. 点击"Create New Room"
3. 设置游戏参数：
   - **Total Players**: 总玩家数（4-12）
   - **AI Bots**: AI机器人数量
   - 真实玩家数 = 总玩家数 - AI机器人数
4. 点击"Create Room"
5. 复制生成的邀请链接
6. 分享链接给你的朋友们

### 2. 加入房间（玩家）

**方式一：通过链接**
- 点击房主分享的链接
- 输入你的名字
- 连接钱包并生成ZK身份
- 自动加入房间

**方式二：手动输入**
- 选择"Join Existing Room"
- 输入房间ID
- 输入你的名字
- 连接钱包并生成ZK身份
- 加入房间

### 3. 准备开始

1. 所有玩家加入后，点击"Ready"按钮
2. 房主等待所有玩家准备就绪
3. 房主点击"Start Game"开始游戏

### 4. 游戏进行

- 游戏会自动同步所有玩家的状态
- 可以在聊天框中交流
- 投票和行动会实时同步
- 房主控制游戏流程的推进

## 文件结构

```
src/games/werewolf/
├── WerewolfGameRouter.tsx      # 游戏模式选择器（单人/多人）
├── WerewolfGame.tsx             # 单人游戏（原版）
├── MultiplayerWerewolfGame.tsx # 多人游戏
├── MultiplayerManager.ts        # P2P通信管理器
├── BotLogic.ts                  # AI机器人逻辑
├── components/                  # UI组件
│   ├── PixelComponents.tsx
│   ├── DetailedPixelAvatar.tsx
│   ├── MagicCircle.tsx
│   └── Campfire.tsx
└── WerewolfGame.css            # 样式
```

## 核心组件说明

### MultiplayerManager.ts

负责P2P通信的核心类：

```typescript
class MultiplayerManager {
  createRoom(playerName: string): Promise<string>  // 创建房间
  joinRoom(roomId: string, playerName: string)     // 加入房间
  sendMessage(message: NetworkMessage)             // 发送消息
  broadcast(message: NetworkMessage)               // 广播消息
  updateGameState(gameState: GameState)           // 更新游戏状态
  disconnect()                                     // 断开连接
}
```

### MultiplayerWerewolfGame.tsx

多人游戏的主组件，包含：
- 房间创建/加入逻辑
- 玩家管理
- 游戏状态同步
- 聊天系统
- 投票和行动系统

## 消息类型

```typescript
type MessageType = 
  | 'PLAYER_JOIN'        // 玩家加入
  | 'PLAYER_LEAVE'       // 玩家离开
  | 'PLAYER_READY'       // 玩家准备
  | 'GAME_START'         // 游戏开始
  | 'GAME_STATE_UPDATE'  // 游戏状态更新
  | 'CHAT_MESSAGE'       // 聊天消息
  | 'VOTE_ACTION'        // 投票行动
  | 'NIGHT_ACTION'       // 夜晚行动
  | 'ROLE_ASSIGNMENT'    // 角色分配
```

## 游戏流程

1. **大厅阶段** (LOBBY)
   - 玩家加入房间
   - 设置准备状态
   - 房主开始游戏

2. **角色揭示** (ROLE_REVEAL)
   - 每个玩家看到自己的角色
   - 房主控制进入夜晚

3. **夜晚阶段** (NIGHT)
   - 狼人选择攻击目标
   - 预言家查验身份
   - 女巫使用药水

4. **白天讨论** (DAY_DISCUSS)
   - 公布夜晚结果
   - 玩家自由讨论
   - AI机器人发言

5. **白天投票** (DAY_VOTE)
   - 投票驱逐玩家
   - 统计票数
   - 公布结果

6. **游戏结束** (GAME_OVER)
   - 好人阵营胜利（狼人全部出局）
   - 狼人阵营胜利（狼人数≥好人数）

## 配置示例

### 4人局（快速游戏）
- 总玩家: 4
- AI机器人: 2
- 真人玩家: 2
- 角色配置: 1狼人, 1预言家, 2村民

### 6人局（经典配置）
- 总玩家: 6
- AI机器人: 3
- 真人玩家: 3
- 角色配置: 1-2狼人, 1预言家, 1女巫, 2-3村民

### 10人局（完整体验）
- 总玩家: 10
- AI机器人: 5
- 真人玩家: 5
- 角色配置: 2-3狼人, 1预言家, 1女巫, 5-6村民

## 常见问题

### Q: 为什么连接不上？
A: 
- 检查网络连接
- 尝试刷新页面
- 确保浏览器允许WebRTC

### Q: 房主离开了怎么办？
A: 目前房主离开游戏会中断。建议房主保持在线直到游戏结束。

### Q: 可以中途加入吗？
A: 不可以。玩家必须在游戏开始前加入。

### Q: AI机器人会作弊吗？
A: 不会。AI机器人遵循相同的游戏规则，不知道其他玩家的角色。

### Q: 聊天记录会保存吗？
A: 不会。聊天记录仅在当前游戏会话中存在。

## 未来改进

- [ ] 支持房主迁移（房主离开时转移给其他玩家）
- [ ] 添加游戏回放功能
- [ ] 支持自定义角色配置
- [ ] 添加更多角色（猎人、守卫等）
- [ ] 支持语音聊天
- [ ] 添加玩家统计和排行榜
- [ ] 优化移动端体验

## 开发调试

```bash
# 启动开发服务器
pnpm dev

# 多设备测试
# 1. 在电脑上访问 http://localhost:5173/werewolf
# 2. 在手机上访问 http://<你的IP>:5173/werewolf
# 3. 创建房间并测试多人连接
```

## 依赖

- `peerjs`: ^1.5.5 - P2P通信库
- `react`: ^18.3.1
- `wagmi`: ^3.0.1 - Web3钱包连接
- `@semaphore-protocol/identity`: ^4.14.0 - ZK身份

## 贡献

欢迎提交Issue和Pull Request！

## 许可

MIT License

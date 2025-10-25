# 区块链存证积分系统设计

## 方案概述

**核心理念**: 用区块链做数据存证和透明化，积分系统保持传统模式，避免代币风险。

## 系统架构

```
用户投票 → 传统数据库 → 区块链存证
    ↓           ↓           ↓
  积分奖励   业务处理    数据透明化
```

### 双重记录机制
- **主数据库**: 存储完整业务数据，处理积分逻辑
- **区块链**: 存储关键数据哈希，确保数据不可篡改

## 区块链存证内容

### 1. 投票记录存证
```javascript
// 投票时写入区块链的数据
const voteProof = {
    voteId: "vote_12345",
    userId: "user_67890", 
    stockCode: "000001",
    prediction: "up",        // 预测方向
    timestamp: 1640995200,   // 投票时间
    basePrice: 12.50,        // 基准价格
    endTime: 1641081600,     // 截止时间
    dataHash: "0x1a2b3c..."  // 数据完整性哈希
}
```

### 2. 结算记录存证
```javascript
// 结算时写入区块链的数据
const settlementProof = {
    voteId: "vote_12345",
    finalPrice: 12.80,       // 最终价格
    actualResult: "up",      // 实际结果
    settlementTime: 1641081600,
    participants: 156,       // 参与人数
    correctUsers: 89,        // 预测正确人数
    totalRewards: 890,       // 总奖励积分
    dataHash: "0x4d5e6f..."  // 结算数据哈希
}
```

### 3. 积分变动存证
```javascript
// 积分奖励记录存证
const rewardProof = {
    userId: "user_67890",
    voteId: "vote_12345", 
    rewardType: "correct_prediction",
    pointsEarned: 10,        // 获得积分数
    previousBalance: 150,    // 之前积分
    newBalance: 160,         // 新积分余额
    timestamp: 1641081600,
    dataHash: "0x7g8h9i..."
}
```

## 智能合约设计 (无代币版本)

### 1. 投票存证合约
```go
package main

import (
    "crypto/sha256"
    "encoding/json"
    "fmt"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type VoteProofContract struct {
    contractapi.Contract
}

type VoteRecord struct {
    VoteID      string `json:"voteId"`
    UserID      string `json:"userId"`
    StockCode   string `json:"stockCode"`
    Prediction  string `json:"prediction"`
    Timestamp   int64  `json:"timestamp"`
    BasePrice   string `json:"basePrice"`
    DataHash    string `json:"dataHash"`
}

// 存储投票证明
func (v *VoteProofContract) StoreVoteProof(ctx contractapi.TransactionContextInterface,
    voteID string, userID string, stockCode string, prediction string, 
    timestamp int64, basePrice string, dataHash string) error {
    
    // 创建投票记录
    voteRecord := VoteRecord{
        VoteID:     voteID,
        UserID:     userID,
        StockCode:  stockCode,
        Prediction: prediction,
        Timestamp:  timestamp,
        BasePrice:  basePrice,
        DataHash:   dataHash,
    }
    
    // 序列化并存储到区块链
    voteJSON, err := json.Marshal(voteRecord)
    if err != nil {
        return err
    }
    
    // 使用复合键存储: vote_{voteId}_{userId}
    key := fmt.Sprintf("vote_%s_%s", voteID, userID)
    return ctx.GetStub().PutState(key, voteJSON)
}

// 查询投票证明
func (v *VoteProofContract) QueryVoteProof(ctx contractapi.TransactionContextInterface,
    voteID string, userID string) (*VoteRecord, error) {
    
    key := fmt.Sprintf("vote_%s_%s", voteID, userID)
    voteJSON, err := ctx.GetStub().GetState(key)
    if err != nil {
        return nil, fmt.Errorf("failed to read vote proof: %v", err)
    }
    
    if voteJSON == nil {
        return nil, fmt.Errorf("vote proof not found")
    }
    
    var voteRecord VoteRecord
    err = json.Unmarshal(voteJSON, &voteRecord)
    if err != nil {
        return nil, err
    }
    
    return &voteRecord, nil
}

// 验证数据完整性
func (v *VoteProofContract) VerifyDataIntegrity(ctx contractapi.TransactionContextInterface,
    voteID string, userID string, originalData string) (bool, error) {
    
    // 获取链上存储的哈希
    voteRecord, err := v.QueryVoteProof(ctx, voteID, userID)
    if err != nil {
        return false, err
    }
    
    // 计算原始数据的哈希
    hash := sha256.Sum256([]byte(originalData))
    calculatedHash := fmt.Sprintf("%x", hash)
    
    // 比较哈希值
    return calculatedHash == voteRecord.DataHash, nil
}
```

### 2. 积分存证合约
```go
type PointsProofContract struct {
    contractapi.Contract
}

type PointsRecord struct {
    UserID          string `json:"userId"`
    VoteID          string `json:"voteId"`
    RewardType      string `json:"rewardType"`
    PointsEarned    int    `json:"pointsEarned"`
    PreviousBalance int    `json:"previousBalance"`
    NewBalance      int    `json:"newBalance"`
    Timestamp       int64  `json:"timestamp"`
    DataHash        string `json:"dataHash"`
}

// 存储积分变动证明
func (p *PointsProofContract) StorePointsProof(ctx contractapi.TransactionContextInterface,
    userID string, voteID string, rewardType string, pointsEarned int,
    previousBalance int, newBalance int, timestamp int64, dataHash string) error {
    
    pointsRecord := PointsRecord{
        UserID:          userID,
        VoteID:          voteID,
        RewardType:      rewardType,
        PointsEarned:    pointsEarned,
        PreviousBalance: previousBalance,
        NewBalance:      newBalance,
        Timestamp:       timestamp,
        DataHash:        dataHash,
    }
    
    pointsJSON, err := json.Marshal(pointsRecord)
    if err != nil {
        return err
    }
    
    // 使用时间戳确保唯一性
    key := fmt.Sprintf("points_%s_%d", userID, timestamp)
    return ctx.GetStub().PutState(key, pointsJSON)
}

// 查询用户积分历史
func (p *PointsProofContract) QueryUserPointsHistory(ctx contractapi.TransactionContextInterface,
    userID string) ([]*PointsRecord, error) {
    
    // 使用范围查询获取用户所有积分记录
    startKey := fmt.Sprintf("points_%s_", userID)
    endKey := fmt.Sprintf("points_%s_~", userID)
    
    resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()
    
    var records []*PointsRecord
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }
        
        var record PointsRecord
        err = json.Unmarshal(queryResponse.Value, &record)
        if err != nil {
            return nil, err
        }
        records = append(records, &record)
    }
    
    return records, nil
}
```

## 后端集成实现

### 1. 区块链存证服务
```javascript
const crypto = require('crypto');
const { TBaaSClient } = require('tencentcloud-sdk-nodejs').tbaas.v20180416;

class BlockchainProofService {
    constructor() {
        this.client = new TBaaSClient({
            credential: {
                secretId: process.env.TENCENT_SECRET_ID,
                secretKey: process.env.TENCENT_SECRET_KEY,
            },
            region: "ap-beijing",
        });
    }
    
    // 生成数据哈希
    generateDataHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
    
    // 存储投票证明到区块链
    async storeVoteProof(voteData) {
        const dataHash = this.generateDataHash(voteData);
        
        const args = [
            voteData.voteId,
            voteData.userId,
            voteData.stockCode,
            voteData.prediction,
            voteData.timestamp.toString(),
            voteData.basePrice.toString(),
            dataHash
        ];
        
        try {
            const result = await this.invokeContract('VoteProofContract', 'StoreVoteProof', args);
            console.log(`投票证明已存储到区块链: ${voteData.voteId}`);
            return { success: true, hash: dataHash, txId: result.txId };
        } catch (error) {
            console.error('区块链存证失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 存储积分变动证明
    async storePointsProof(pointsData) {
        const dataHash = this.generateDataHash(pointsData);
        
        const args = [
            pointsData.userId,
            pointsData.voteId,
            pointsData.rewardType,
            pointsData.pointsEarned.toString(),
            pointsData.previousBalance.toString(),
            pointsData.newBalance.toString(),
            pointsData.timestamp.toString(),
            dataHash
        ];
        
        try {
            const result = await this.invokeContract('PointsProofContract', 'StorePointsProof', args);
            console.log(`积分变动证明已存储: ${pointsData.userId}`);
            return { success: true, hash: dataHash, txId: result.txId };
        } catch (error) {
            console.error('积分存证失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 验证数据完整性
    async verifyDataIntegrity(voteId, userId, originalData) {
        const args = [voteId, userId, JSON.stringify(originalData)];
        
        try {
            const result = await this.invokeContract('VoteProofContract', 'VerifyDataIntegrity', args);
            return { isValid: result.data === 'true' };
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }
    
    // 调用智能合约的通用方法
    async invokeContract(contractName, method, args) {
        const params = {
            Module: "transaction",
            Operation: "invoke",
            ClusterId: process.env.CLUSTER_ID,
            ChaincodeName: contractName,
            ChannelName: "mychannel",
            Peers: ["peer0.org1.example.com"],
            FuncName: method,
            Args: args
        };
        
        const result = await this.client.Invoke(params);
        return JSON.parse(result.Data);
    }
}

module.exports = BlockchainProofService;
```

### 2. 业务逻辑集成
```javascript
const BlockchainProofService = require('./blockchainProofService');
const blockchainProof = new BlockchainProofService();

// 修改投票提交逻辑
async function submitVote(userId, voteId, prediction) {
    try {
        // 1. 保存到传统数据库
        const userVote = new UserVote({
            userId: userId,
            voteId: voteId,
            prediction: prediction,
            voteTime: new Date()
        });
        await userVote.save();
        
        // 2. 获取投票详情
        const vote = await Vote.findById(voteId);
        
        // 3. 存储到区块链作为证明
        const voteProofData = {
            voteId: voteId,
            userId: userId,
            stockCode: vote.stockCode,
            prediction: prediction,
            timestamp: Date.now(),
            basePrice: vote.basePrice
        };
        
        const proofResult = await blockchainProof.storeVoteProof(voteProofData);
        
        // 4. 更新投票统计
        await Vote.findByIdAndUpdate(voteId, {
            $inc: { 
                participants: 1,
                [prediction === 'up' ? 'upVotes' : 'downVotes']: 1
            }
        });
        
        return {
            success: true,
            message: '投票成功',
            blockchainProof: proofResult.success ? proofResult.hash : null
        };
        
    } catch (error) {
        console.error('投票失败:', error);
        return { success: false, message: '投票失败' };
    }
}

// 修改积分奖励逻辑
async function rewardPoints(userId, voteId, points, rewardType) {
    try {
        // 1. 获取用户当前积分
        const user = await User.findById(userId);
        const previousBalance = user.points;
        const newBalance = previousBalance + points;
        
        // 2. 更新数据库中的积分
        await User.findByIdAndUpdate(userId, {
            $inc: { 
                points: points,
                correctVotes: rewardType === 'correct_prediction' ? 1 : 0
            }
        });
        
        // 3. 存储积分变动证明到区块链
        const pointsProofData = {
            userId: userId,
            voteId: voteId,
            rewardType: rewardType,
            pointsEarned: points,
            previousBalance: previousBalance,
            newBalance: newBalance,
            timestamp: Date.now()
        };
        
        const proofResult = await blockchainProof.storePointsProof(pointsProofData);
        
        console.log(`用户 ${userId} 获得 ${points} 积分，区块链证明: ${proofResult.hash}`);
        
        return {
            success: true,
            pointsEarned: points,
            newBalance: newBalance,
            blockchainProof: proofResult.success ? proofResult.hash : null
        };
        
    } catch (error) {
        console.error('积分奖励失败:', error);
        return { success: false, error: error.message };
    }
}
```

## 前端展示 (区块链证明)

### 1. 投票记录页面
```javascript
// 显示投票的区块链证明
Page({
    data: {
        voteHistory: [],
        showProof: false,
        currentProof: null
    },
    
    // 查看区块链证明
    async showBlockchainProof(e) {
        const voteId = e.currentTarget.dataset.voteid;
        
        try {
            wx.showLoading({ title: '查询中...' });
            
            const res = await wx.request({
                url: `${app.globalData.serverUrl}/blockchain/proof/${voteId}`,
                header: {
                    'Authorization': `Bearer ${app.globalData.token}`
                }
            });
            
            if (res.data.success) {
                this.setData({
                    currentProof: res.data.data,
                    showProof: true
                });
            }
            
        } catch (error) {
            wx.showToast({
                title: '查询失败',
                icon: 'none'
            });
        } finally {
            wx.hideLoading();
        }
    }
});
```

### 2. 区块链证明弹窗
```xml
<!-- 区块链证明弹窗 -->
<view class="proof-modal {{showProof ? 'show' : ''}}" bindtap="hideProof">
    <view class="proof-content" catchtap="preventClose">
        <view class="proof-header">
            <text class="proof-title">区块链存证证明</text>
            <text class="proof-close" bindtap="hideProof">×</text>
        </view>
        
        <view class="proof-body">
            <view class="proof-item">
                <text class="proof-label">投票ID:</text>
                <text class="proof-value">{{currentProof.voteId}}</text>
            </view>
            
            <view class="proof-item">
                <text class="proof-label">预测方向:</text>
                <text class="proof-value">{{currentProof.prediction === 'up' ? '看涨' : '看跌'}}</text>
            </view>
            
            <view class="proof-item">
                <text class="proof-label">投票时间:</text>
                <text class="proof-value">{{currentProof.timestamp}}</text>
            </view>
            
            <view class="proof-item">
                <text class="proof-label">数据哈希:</text>
                <text class="proof-hash">{{currentProof.dataHash}}</text>
            </view>
            
            <view class="proof-item">
                <text class="proof-label">区块链交易ID:</text>
                <text class="proof-hash">{{currentProof.txId}}</text>
            </view>
            
            <view class="proof-verify">
                <text class="verify-status verified">✓ 数据已通过区块链验证</text>
                <text class="verify-desc">此记录已永久存储在区块链上，无法篡改</text>
            </view>
        </view>
    </view>
</view>
```

## 系统优势

### 1. 合规安全
- ✅ 无代币，避免金融监管风险
- ✅ 传统积分系统，用户理解成本低
- ✅ 区块链仅做存证，不涉及价值转移

### 2. 技术亮点
- ✅ 数据不可篡改，增强用户信任
- ✅ 透明化投票过程，公开公正
- ✅ 区块链技术背书，提升项目价值

### 3. 用户体验
- ✅ 无需学习区块链操作
- ✅ 积分系统保持简单易懂
- ✅ 可查看区块链证明，增加信任感

## 开发工时

| 模块 | 工时 | 说明 |
|------|------|------|
| 智能合约开发 | 1.5人天 | 存证合约，无代币逻辑 |
| 后端集成 | 2人天 | SDK集成，业务改造 |
| 前端证明展示 | 0.5人天 | 区块链证明查看 |
| **总计** | **4人天** | **比代币方案减少1人天** |

## 成本预估

- **开发成本**: 4人天 × ¥1500 = ¥6,000
- **运营成本**: ¥200-600/月 (仅存证，调用量少)

**这个方案既满足了区块链技术需求，又避免了代币风险，是最佳的折中方案！**
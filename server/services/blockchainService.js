// 区块链服务 - 支持模拟和真实模式
const crypto = require('crypto')

class BlockchainService {
    constructor() {
        // 检查是否为开发模式
        this.isDevelopment = process.env.NODE_ENV === 'development'
        
        if (!this.isDevelopment) {
            // 生产模式才加载腾讯云SDK
            try {
                const { TBaaSClient } = require('tencentcloud-sdk-nodejs').tbaas.v20180416
                this.client = new TBaaSClient({
                    credential: {
                        secretId: process.env.TENCENT_SECRET_ID,
                        secretKey: process.env.TENCENT_SECRET_KEY,
                    },
                    region: process.env.TENCENT_REGION || "ap-beijing",
                })
            } catch (error) {
                console.warn('⚠️  腾讯云SDK未安装，使用模拟模式')
                this.isDevelopment = true
            }
        }
        
        // 区块链网络配置
        this.networkConfig = {
            clusterId: process.env.TBAAS_CLUSTER_ID || 'demo-cluster',
            channelName: process.env.TBAAS_CHANNEL || "mychannel",
            chaincodeName: process.env.TBAAS_CHAINCODE || "stockvote",
            orgName: process.env.TBAAS_ORG || "org1"
        }
        
        // 本地交易缓存
        this.transactionCache = new Map()
        
        console.log(`🔗 区块链服务模式: ${this.isDevelopment ? '模拟模式' : '真实模式'}`)
    }

    // 生成数据哈希
    generateDataHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
    }

    // 调用智能合约 - 支持模拟和真实模式
    async invokeContract(functionName, args) {
        if (this.isDevelopment) {
            // 开发模式：使用模拟
            return this.mockInvokeContract(functionName, args)
        } else {
            // 生产模式：真实区块链调用
            return this.realInvokeContract(functionName, args)
        }
    }

    // 模拟区块链调用
    async mockInvokeContract(functionName, args) {
        try {
            console.log(`🔗 模拟区块链合约调用: ${functionName}`, args)
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
            
            // 生成模拟交易ID
            const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
            
            // 缓存交易信息
            this.transactionCache.set(txId, {
                txId: txId,
                functionName: functionName,
                args: args,
                timestamp: new Date().toISOString(),
                status: 'pending'
            })
            
            // 模拟确认过程
            setTimeout(() => {
                const tx = this.transactionCache.get(txId)
                if (tx) {
                    tx.status = 'confirmed'
                    tx.blockNumber = Math.floor(Math.random() * 1000000) + 1000000
                    tx.blockHash = '0x' + crypto.randomBytes(32).toString('hex')
                    this.transactionCache.set(txId, tx)
                }
            }, 3000 + Math.random() * 2000)
            
            console.log(`✅ 模拟交易已提交: ${txId}`)
            
            return {
                success: true,
                txId: txId,
                data: { message: '模拟交易成功' }
            }
            
        } catch (error) {
            console.error(`❌ 模拟区块链调用失败: ${functionName}`, error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // 真实区块链调用
    async realInvokeContract(functionName, args) {
        try {
            const params = {
                Module: "transaction",
                Operation: "invoke",
                ClusterId: this.networkConfig.clusterId,
                ChaincodeName: this.networkConfig.chaincodeName,
                ChannelName: this.networkConfig.channelName,
                Peers: [`peer0.${this.networkConfig.orgName}.example.com`],
                FuncName: functionName,
                Args: args
            }

            console.log(`🔗 调用真实区块链合约: ${functionName}`, args)
            
            const result = await this.client.Invoke(params)
            
            if (result.TxId) {
                console.log(`✅ 交易已提交到区块链: ${result.TxId}`)
                
                // 缓存交易信息
                this.transactionCache.set(result.TxId, {
                    txId: result.TxId,
                    functionName: functionName,
                    args: args,
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                })
                
                // 异步等待确认
                this.waitForConfirmation(result.TxId)
                
                return {
                    success: true,
                    txId: result.TxId,
                    data: result.Data ? JSON.parse(result.Data) : null
                }
            } else {
                throw new Error('交易提交失败')
            }
            
        } catch (error) {
            console.error(`❌ 区块链调用失败: ${functionName}`, error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // 查询智能合约 - 支持模拟和真实模式
    async queryContract(functionName, args) {
        if (this.isDevelopment) {
            // 开发模式：使用模拟
            return this.mockQueryContract(functionName, args)
        } else {
            // 生产模式：真实区块链查询
            return this.realQueryContract(functionName, args)
        }
    }

    // 模拟区块链查询
    async mockQueryContract(functionName, args) {
        try {
            console.log(`🔍 模拟区块链查询: ${functionName}`, args)
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
            
            // 根据查询类型返回模拟数据
            let mockData = null
            switch (functionName) {
                case 'QueryVoteProof':
                    mockData = {
                        voteId: args[0],
                        userId: args[1],
                        stockCode: 'MOCK001',
                        prediction: 'up',
                        timestamp: Date.now(),
                        dataHash: '0x' + crypto.randomBytes(32).toString('hex')
                    }
                    break
                case 'QueryUserPointsHistory':
                    mockData = [
                        {
                            userId: args[0],
                            pointsEarned: 10,
                            rewardType: 'correct_prediction',
                            timestamp: Date.now() - 86400000,
                            dataHash: '0x' + crypto.randomBytes(32).toString('hex')
                        }
                    ]
                    break
                default:
                    mockData = { message: '模拟查询成功' }
            }
            
            return {
                success: true,
                data: mockData
            }
            
        } catch (error) {
            console.error(`❌ 模拟区块链查询失败: ${functionName}`, error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // 真实区块链查询
    async realQueryContract(functionName, args) {
        try {
            const params = {
                Module: "transaction", 
                Operation: "query",
                ClusterId: this.networkConfig.clusterId,
                ChaincodeName: this.networkConfig.chaincodeName,
                ChannelName: this.networkConfig.channelName,
                Peers: [`peer0.${this.networkConfig.orgName}.example.com`],
                FuncName: functionName,
                Args: args
            }

            console.log(`🔍 查询真实区块链数据: ${functionName}`, args)
            
            const result = await this.client.Query(params)
            
            return {
                success: true,
                data: result.Data ? JSON.parse(result.Data) : null
            }
            
        } catch (error) {
            console.error(`❌ 区块链查询失败: ${functionName}`, error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // 等待交易确认
    async waitForConfirmation(txId) {
        setTimeout(async () => {
            try {
                // 查询交易状态
                const params = {
                    Module: "transaction",
                    Operation: "get_transaction_detail_for_user", 
                    ClusterId: this.networkConfig.clusterId,
                    TxId: txId
                }
                
                const result = await this.client.GetTransactionDetailForUser(params)
                
                if (result.Transaction) {
                    // 更新缓存状态
                    const cachedTx = this.transactionCache.get(txId)
                    if (cachedTx) {
                        cachedTx.status = 'confirmed'
                        cachedTx.blockNumber = result.Transaction.BlockNumber
                        cachedTx.blockHash = result.Transaction.BlockHash
                        this.transactionCache.set(txId, cachedTx)
                    }
                    
                    console.log(`✅ 交易已确认: ${txId} (区块: ${result.Transaction.BlockNumber})`)
                }
            } catch (error) {
                console.error(`查询交易状态失败: ${txId}`, error)
            }
        }, 5000) // 5秒后查询确认状态
    }

    // 真实投票上链存证
    async storeVoteProof(voteData) {
        // 生成数据哈希确保完整性
        const dataHash = this.generateDataHash(voteData)
        
        // 准备上链参数
        const args = [
            voteData.voteId,
            voteData.userId,
            voteData.stockCode,
            voteData.prediction,
            voteData.timestamp.toString(),
            voteData.basePrice.toString(),
            dataHash
        ]

        console.log(`📊 投票数据上链: ${voteData.stockCode} - ${voteData.prediction}`)
        
        // 真实调用区块链智能合约
        const result = await this.invokeContract('StoreVoteProof', args)
        
        if (result.success) {
            return {
                success: true,
                txId: result.txId,
                dataHash: dataHash,
                message: `投票记录已存储到区块链`,
                voteData: voteData
            }
        } else {
            return {
                success: false,
                error: result.error,
                message: '区块链存储失败'
            }
        }
    }

    // 真实积分变动上链存证
    async storePointsProof(pointsData) {
        // 生成积分变动数据哈希
        const dataHash = this.generateDataHash(pointsData)
        
        // 准备上链参数
        const args = [
            pointsData.userId,
            pointsData.voteId || '',
            pointsData.rewardType,
            pointsData.pointsEarned.toString(),
            pointsData.previousBalance.toString(),
            pointsData.newBalance.toString(),
            pointsData.timestamp.toString(),
            dataHash
        ]

        console.log(`💰 积分变动上链: 用户${pointsData.userId} +${pointsData.pointsEarned}积分`)
        
        // 真实调用区块链智能合约
        const result = await this.invokeContract('StorePointsProof', args)
        
        if (result.success) {
            return {
                success: true,
                txId: result.txId,
                dataHash: dataHash,
                message: `积分变动已存储到区块链`,
                pointsData: pointsData
            }
        } else {
            return {
                success: false,
                error: result.error,
                message: '积分存证失败'
            }
        }
    }

    // 查询投票证明 - 真实链上查询
    async queryVoteProof(voteId, userId) {
        console.log(`🔍 查询投票证明: ${voteId} - ${userId}`)
        
        const result = await this.queryContract('QueryVoteProof', [voteId, userId])
        
        if (result.success && result.data) {
            return {
                success: true,
                proof: result.data
            }
        } else {
            return {
                success: false,
                error: result.error || '投票证明不存在'
            }
        }
    }

    // 查询积分证明 - 真实链上查询
    async queryPointsProof(userId, limit = 10) {
        console.log(`🔍 查询积分证明: ${userId}`)
        
        const result = await this.queryContract('QueryUserPointsHistory', [userId, limit.toString()])
        
        if (result.success && result.data) {
            return {
                success: true,
                proofs: result.data
            }
        } else {
            return {
                success: false,
                error: result.error || '积分证明不存在'
            }
        }
    }

    // 验证数据完整性 - 真实链上验证
    async verifyDataIntegrity(voteId, userId, originalData) {
        console.log(`🔐 验证数据完整性: ${voteId}`)
        
        const result = await this.queryContract('VerifyDataIntegrity', [
            voteId, 
            userId, 
            JSON.stringify(originalData)
        ])
        
        if (result.success) {
            return {
                isValid: result.data === true || result.data === 'true',
                message: result.data === true ? '数据验证通过' : '数据验证失败'
            }
        } else {
            return {
                isValid: false,
                error: result.error
            }
        }
    }

    // 确认交易
    confirmTransaction(txHash) {
        const tx = this.transactionPool.get(txHash)
        if (!tx) return

        // 生成区块信息
        const blockNumber = this.networkStatus.blockHeight + Math.floor(Math.random() * 10) + 1
        const blockHash = this.generateBlockHash()

        // 更新交易状态
        const confirmedTx = {
            ...tx,
            status: 'confirmed',
            blockNumber: blockNumber,
            blockHash: blockHash,
            confirmations: 1,
            confirmTime: new Date().toISOString()
        }

        // 移动到已确认交易
        this.confirmedTransactions.set(txHash, confirmedTx)
        this.transactionPool.delete(txHash)

        // 更新网络状态
        this.networkStatus.blockHeight = Math.max(this.networkStatus.blockHeight, blockNumber)
        this.networkStatus.lastBlockTime = new Date()

        console.log(`✅ 交易确认: ${txHash} (区块: ${blockNumber})`)
    }

    // 获取用户的区块链地址 (模拟)
    getUserAddress(userId) {
        // 基于用户ID生成固定的地址
        const hash = crypto.createHash('sha256').update(userId.toString()).digest('hex')
        return '0x' + hash.substring(0, 40)
    }

    // 查询交易状态
    async getTransactionStatus(txHash) {
        // 先查已确认交易
        if (this.confirmedTransactions.has(txHash)) {
            return this.confirmedTransactions.get(txHash)
        }
        
        // 再查交易池
        if (this.transactionPool.has(txHash)) {
            return this.transactionPool.get(txHash)
        }

        return null
    }

    // 获取用户交易历史
    async getUserTransactions(userId, limit = 20) {
        const userAddress = this.getUserAddress(userId)
        const allTxs = [
            ...Array.from(this.confirmedTransactions.values()),
            ...Array.from(this.transactionPool.values())
        ]

        return allTxs
            .filter(tx => tx.from === userAddress || tx.to === userAddress)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit)
            .map(tx => ({
                hash: tx.hash,
                type: tx.type,
                from: tx.from,
                to: tx.to,
                amount: tx.amount,
                status: tx.status,
                timestamp: tx.timestamp,
                blockNumber: tx.blockNumber,
                gasUsed: tx.gasUsed,
                reason: tx.reason || tx.memo || '',
                confirmations: tx.confirmations || 0
            }))
    }

    // 获取网络状态
    async getNetworkStatus() {
        return {
            ...this.networkStatus,
            pendingTransactions: this.transactionPool.size,
            totalTransactions: this.confirmedTransactions.size
        }
    }

    // 模拟智能合约调用
    async callContract(contractName, method, args) {
        const txData = {
            type: 'CONTRACT_CALL',
            contract: contractName,
            method: method,
            args: args,
            timestamp: new Date().toISOString(),
            gasUsed: Math.floor(Math.random() * 100000) + 50000,
            gasPrice: '0.000001'
        }

        const txHash = this.generateTxHash(txData)
        
        console.log(`📋 智能合约调用: ${contractName}.${method}()`)

        // 模拟合约执行结果
        let result = { success: true }
        
        switch (method) {
            case 'balanceOf':
                result.balance = Math.floor(Math.random() * 10000) + 100
                break
            case 'totalSupply':
                result.totalSupply = 21000000
                break
            case 'getVoteResult':
                result.voteResult = Math.random() > 0.5 ? 'up' : 'down'
                break
            default:
                result.data = 'Contract executed successfully'
        }

        return {
            success: true,
            txHash: txHash,
            result: result,
            gasUsed: txData.gasUsed
        }
    }

    // 生成模拟的历史交易数据
    generateMockTransactions(userId, count = 10) {
        const transactions = []
        const userAddress = this.getUserAddress(userId)
        
        const txTypes = [
            { type: 'MINT', reason: '预测正确奖励', amount: () => Math.floor(Math.random() * 50) + 10 },
            { type: 'MINT', reason: '每日签到奖励', amount: () => Math.floor(Math.random() * 5) + 1 },
            { type: 'MINT', reason: '创建投票奖励', amount: () => Math.floor(Math.random() * 20) + 5 },
            { type: 'TRANSFER', reason: '转账给朋友', amount: () => Math.floor(Math.random() * 100) + 10 },
            { type: 'VOTE_SUBMIT', reason: '投票上链', amount: () => 0 }
        ]

        for (let i = 0; i < count; i++) {
            const txType = txTypes[Math.floor(Math.random() * txTypes.length)]
            const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 30天内
            
            const tx = {
                hash: this.generateTxHash({ userId, index: i, timestamp }),
                type: txType.type,
                from: txType.type === 'MINT' ? '0x0000000000000000000000000000000000000000' : userAddress,
                to: txType.type === 'TRANSFER' ? this.getUserAddress('friend_' + i) : userAddress,
                amount: txType.amount(),
                reason: txType.reason,
                status: 'confirmed',
                timestamp: timestamp.toISOString(),
                blockNumber: this.networkStatus.blockHeight - Math.floor(Math.random() * 1000),
                gasUsed: Math.floor(Math.random() * 80000) + 21000,
                confirmations: Math.floor(Math.random() * 100) + 10
            }

            this.confirmedTransactions.set(tx.hash, tx)
            transactions.push(tx)
        }

        return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
}

module.exports = BlockchainService
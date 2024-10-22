# 加密资产管理器

这是一个基于 [Next.js](https://nextjs.org) 开发的加密资产管理工具，旨在帮助用户更好地管理他们的加密钱包、项目和日常任务。

## 安装和运行

1. 确保您的系统已安装 Node.js（推荐版本 14.0.0 或更高）。

2. 克隆项目到本地：
   ```
   git clone https://github.com/Shaochuanchao/crypto-portfolio-manager.git
   ```

3. 进入项目目录：
   ```
   cd crypto-portfolio-manager
   ```

4. 安装依赖：
   ```
   npm install
   ```

5. 配置环境变量：
   - 复制 `.env.example` 文件并重命名为 `.env`
   - 在 `.env` 文件中，设置您的 API 密钥：
     ```
     ETHERSCAN_API_KEY=您的_ETHERSCAN_API_KEY
     INFURA_API_KEY=您的_INFURA_API_KEY
     ```

6. 运行开发服务器：
   ```
   npm run dev
   ```

7. 在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 功能模块

### 1. 钱包管理

- 添加、编辑和删除钱包
- 支持多种钱包类型（如 EVM、StarkNet 等）
- 批量导入钱包
- 为钱包添加别名、Twitter 和邮箱信息
- 查看与钱包关联的项目

### 2. 项目管理

- 添加、编辑和删除项目
- 设置项目详细信息（如名称、描述、社交媒体链接等）
- 标记项目为必做或非必做
- 设置项目阶段和空投阶段
- 关联钱包到项目

### 3. 任务管理

- 创建每日任务和一次性任务
- 将任务关联到特定项目
- 设置任务开始和结束时间
- 添加任务说明和攻略链接
- 创建和管理子任务

### 4. 工具

- 实时显示以太坊 Gas 价格（需要 Etherscan API 密钥）

### 5. Infura API 集成

- 获取不同网络的最新区块信息
- 分析最新区块中的 top 10 交易合约
- 计算每个合约在最新区块中消耗的 gas

## 贡献

欢迎提交 Pull Requests 来改进这个项目。对于重大更改，请先开 issue 讨论您想要改变的内容。

## 许可证

[MIT](https://choosealicense.com/licenses/mit/)

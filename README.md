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
     # Etherscan API（用于获取 Gas 价格）
     ETHERSCAN_API_KEY=您的_ETHERSCAN_API_KEY

     # OKX API（用于查询钱包资产）
     NEXT_PUBLIC_OKX_API_KEY=您的_OKX_API_KEY
     NEXT_PUBLIC_OKX_SECRET_KEY=您的_OKX_SECRET_KEY
     NEXT_PUBLIC_OKX_PASSPHRASE=您的_OKX_PASSPHRASE
     NEXT_PUBLIC_OKX_PROJECT_ID=您的_OKX_PROJECT_ID
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
- 实时查看钱包资产（支持多链资产查询）
  - EVM 钱包支持查询多个网络的资产（包括 Ethereum、Optimism、BSC、Arbitrum、zkSync Era、Polygon zkEVM、Base、Linea 等）
  - StarkNet 钱包提供 Starkscan 链接

### 2. 项目管理

- 添加、编辑和删除项目
- 设置项目详细信息（如名称、描述、社交媒体链接等）
- 标记项目为必做或非必做
- 设置项目阶段和空投阶段
- 关联钱包到项目

### 3. 任务管理

- 创建每日任务、一次性任务和鸡肋任务
- 将任务关联到特定项目
- 设置任务优先级（1-5星）和优先级备注
- 设置任务开始和结束时间
- 添加任务说明和攻略链接
- 创建和管理子任务
- 每日任务自动重置完成状态

### 4. 工具功能

- 实时显示以太坊 Gas 价格（每分钟更新）
- 支持查看多链资产明细
- 资产价值自动缓存（1分钟更新一次）

## 数据存储

- 使用 IndexedDB 进行本地数据存储
- 支持数据的持久化存储和缓存管理
- 自动管理 API 请求频率限制

## 贡献

欢迎提交 Pull Requests 来改进这个项目。对于重大更改，请先开 issue 讨论您想要改变的内容。

## 许可证

[MIT](https://choosealicense.com/licenses/mit/)

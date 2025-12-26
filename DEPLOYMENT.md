# CattoPic 部署指南

[English](./docs/DEPLOYMENT_EN.md)

## 项目架构

```
┌─────────────────────┐         ┌─────────────────────────────────┐
│                     │         │          Cloudflare             │
│   Vercel            │         │                                 │
│   ┌─────────────┐   │  HTTPS  │   ┌─────────────┐               │
│   │  Next.js    │   │ ──────► │   │   Worker    │               │
│   │  Frontend   │   │         │   │   (Hono)    │               │
│   └─────────────┘   │         │   └──────┬──────┘               │
│                     │         │          │                      │
└─────────────────────┘         │    ┌─────┴─────┐                │
                                │    │           │                │
                                │ ┌──▼───┐   ┌───▼──┐   ┌────┐   │
                                │ │  R2  │   │  D1  │   │ KV │   │
                                │ │Bucket│   │  DB  │   │    │   │
                                │ └──────┘   └──────┘   └────┘   │
                                └─────────────────────────────────┘
```

| 组件 | 平台 | 用途 |
|------|------|------|
| Frontend | Vercel | Next.js 前端应用 |
| API | Cloudflare Worker | 后端 API 服务 (Hono) |
| Storage | Cloudflare R2 | 图片文件存储 |
| Database | Cloudflare D1 | SQLite 数据库（元数据、API Key） |
| Cache | Cloudflare KV | 缓存层 |
| Queue | Cloudflare Queues | 异步任务（文件删除） |

---

## 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) 包管理器
- [Cloudflare 账户](https://dash.cloudflare.com/)
- [Vercel 账户](https://vercel.com/)

---

## 一、Cloudflare 资源配置

### 1.1 登录 Wrangler CLI

```bash
cd worker
pnpm install
pnpm wrangler login
```

### 1.2 创建 R2 Bucket

```bash
pnpm wrangler r2 bucket create cattopic-r2 --location=apac
```

> `--location=apac` 将存储桶部署在亚太区域以获得更低延迟

### 1.3 创建 D1 数据库

```bash
pnpm wrangler d1 create CattoPic-D1 --location=apac
```

输出示例：
```
✅ Successfully created DB 'CattoPic-D1' in region APAC
Created your new D1 database.

[[d1_databases]]
binding = "DB"
database_name = "CattoPic-D1"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 记录此 ID
```

### 1.4 创建 KV 命名空间

```bash
pnpm wrangler kv namespace create CACHE_KV
```

输出示例：
```
🌀 Creating namespace with title "cattopic-worker-CACHE_KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "CACHE_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 记录此 ID
```

### 1.5 创建 Queue

```bash
pnpm wrangler queues create cattopic-delete-queue
```

### 1.6 初始化数据库表结构

```bash
pnpm wrangler d1 execute CattoPic-D1 --remote --file=schema.sql
```

### 1.7 配置 wrangler.toml

从模板复制配置文件：

```bash
cp wrangler.example.toml wrangler.toml
```

编辑 `worker/wrangler.toml`，填入上面获取的 ID：

```toml
name = 'cattopic-worker'
main = 'src/index.ts'
compatibility_date = '2024-12-01'
compatibility_flags = ['nodejs_compat']

[vars]
ENVIRONMENT = 'production'
R2_PUBLIC_URL = 'https://your-r2-domain.com'  # 你的 R2 公开访问域名

[images]
binding = "IMAGES"

[[r2_buckets]]
binding = 'R2_BUCKET'
bucket_name = 'cattopic-r2'  # 你创建的 R2 bucket 名称

[[d1_databases]]
binding = 'DB'
database_name = 'CattoPic-D1'
database_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'  # 替换为你的 D1 database_id

[[kv_namespaces]]
binding = "CACHE_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 替换为你的 KV namespace id

[triggers]
crons = ['0 * * * *']  # 每小时清理过期图片

[dev]
port = 8787
local_protocol = 'http'
```

---

## 二、Cloudflare Worker 部署

### 2.1 部署 Worker

```bash
cd worker
pnpm wrangler deploy
```

部署成功后输出示例：
```
Uploaded cattopic-worker
Deployed cattopic-worker triggers
  https://cattopic-worker.<your-subdomain>.workers.dev
```

### 2.2 添加 API Key

```bash
pnpm wrangler d1 execute CattoPic-D1 --remote --command "
INSERT INTO api_keys (key, created_at) VALUES ('your-api-key-here', datetime('now'));
"
```

> 建议使用强随机字符串作为 API Key，例如：`openssl rand -hex 32`

### 2.3 验证部署

```bash
# 测试认证
curl -X POST \
  -H "Authorization: Bearer your-api-key-here" \
  https://cattopic-worker.<your-subdomain>.workers.dev/api/validate-api-key

# 预期返回
{"success":true,"data":{"valid":true}}
```

---

## 三、R2 公开访问配置（可选）

如果需要自定义域名访问 R2 存储的图片：

### 3.1 在 Cloudflare Dashboard 配置

1. 进入 R2 存储桶设置
2. 在 "Public access" 部分启用公开访问
3. 配置自定义域名（例如：`r2.yourdomain.com`）

### 3.2 更新 wrangler.toml

```toml
[vars]
R2_PUBLIC_URL = 'https://r2.yourdomain.com'
```

重新部署：

```bash
pnpm wrangler deploy
```

---

## 四、Vercel 部署

### 4.1 在 Vercel 创建项目

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 导入 GitHub 仓库
3. Framework Preset 选择 `Next.js`

### 4.2 配置环境变量

在 Vercel 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://cattopic-worker.xxx.workers.dev` | Worker API 地址 |

### 4.3 部署

点击 "Deploy" 按钮，等待部署完成。

---

## 五、本地开发

### 5.1 启动 Worker（本地）

```bash
cd worker
pnpm dev
# 运行在 http://localhost:8787
```

### 5.2 启动前端（本地）

```bash
pnpm dev
# 运行在 http://localhost:3000
```

### 5.3 本地环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

---

## 六、API 参考

### 认证方式

受保护的 API 需要在请求头中添加：

```
Authorization: Bearer <your-api-key>
```

### API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/random` | ❌ | 随机获取图片 |
| GET | `/r2/*` | ❌ | 访问图片文件 |
| POST | `/api/validate-api-key` | ✅ | 验证 API Key |
| POST | `/api/upload/single` | ✅ | 上传图片 |
| GET | `/api/images` | ✅ | 获取图片列表 |
| GET | `/api/images/:id` | ✅ | 获取图片详情 |
| PUT | `/api/images/:id` | ✅ | 更新图片信息 |
| DELETE | `/api/images/:id` | ✅ | 删除图片 |
| GET | `/api/tags` | ✅ | 获取标签列表 |
| POST | `/api/tags` | ✅ | 创建标签 |
| PUT | `/api/tags/:name` | ✅ | 重命名标签 |
| DELETE | `/api/tags/:name` | ✅ | 删除标签及关联图片 |
| POST | `/api/tags/batch` | ✅ | 批量标签操作 |

详细 API 文档请参考 [API.md](./docs/API.md)。

---

## 七、常见问题

### Q1: 401 Unauthorized 错误

检查 API Key 是否已添加到数据库：

```bash
pnpm wrangler d1 execute CattoPic-D1 --remote --command "SELECT * FROM api_keys;"
```

### Q2: 如何添加新的 API Key

```bash
pnpm wrangler d1 execute CattoPic-D1 --remote --command "
INSERT INTO api_keys (key, created_at) VALUES ('new-api-key', datetime('now'));
"
```

### Q3: 如何删除 API Key

```bash
pnpm wrangler d1 execute CattoPic-D1 --remote --command "
DELETE FROM api_keys WHERE key = 'old-api-key';
"
```

### Q4: 如何查看所有资源 ID

```bash
# 查看 D1 数据库
pnpm wrangler d1 list

# 查看 KV 命名空间
pnpm wrangler kv namespace list

# 查看 R2 存储桶
pnpm wrangler r2 bucket list

# 查看队列
pnpm wrangler queues list
```

### Q5: 图片上传后无法访问

1. 检查 `R2_PUBLIC_URL` 是否配置正确
2. 确认 R2 存储桶已启用公开访问
3. 检查自定义域名 DNS 是否已生效

---

## 八、更新部署

### Worker 更新

```bash
cd worker
pnpm wrangler deploy
```

### 前端更新

推送代码到 GitHub，Vercel 会自动部署。

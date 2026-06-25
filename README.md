# new-api-docs-v1

A Next.js documentation site for New API.

## Development

Run the development server:

```bash
bun install

bun dev
```

Open http://localhost:3000 with your browser to see the result.

## Build

Build the application for production:

```bash
bun run build

# 拉取代码后首次部署
bun install
bun run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup

# 后续更新
git pull && bun install && bun run build && pm2 restart new-api-docs
```

## 国内服务器 Git 加速（推荐）

在百度智能云、阿里云、腾讯云等国内服务器上，直连 GitHub 速度慢或失败率高，建议使用以下加速方案。

### Clone（首次拉取）

使用 GitHub 加速镜像代替直连：

```bash
# 方案一：ghfast.top（推荐）
git clone https://ghfast.top/https://github.com/zhazhanitian/new-api-docs-v1.git

# 方案二：ghproxy.net
git clone https://ghproxy.net/https://github.com/zhazhanitian/new-api-docs-v1.git
```

### Pull（后续更新）

`git pull` 直连 GitHub 有时也会超时，可以临时为当前仓库配置代理：

```bash
# 为当前仓库设置加速代理
git config http.https://github.com.proxy https://ghfast.top

# 之后正常 pull 即可
git pull

# 如需恢复直连，取消代理设置
git config --unset http.https://github.com.proxy
```

或者直接替换远程地址为镜像地址：

```bash
git remote set-url origin https://ghfast.top/https://github.com/zhazhanitian/new-api-docs-v1.git
git pull
```

### Push（推送代码）

`git push` 是上行流量，国内服务器推送到 GitHub 通常**不需要加速**，直接推送即可：

```bash
git push origin main
```

如果 push 也失败，推荐改用 **SSH 协议**（上行稳定性更好）：

```bash
# 将远程地址切换为 SSH
git remote set-url origin git@github.com:zhazhanitian/new-api-docs-v1.git

# 之后正常 push
git push origin main
```

> 注意：使用 SSH 前需要先将服务器的公钥（`~/.ssh/id_rsa.pub`）添加到 GitHub → Settings → SSH Keys。

## Project Structure

| Path                      | Description                  |
| ------------------------- | ---------------------------- |
| `app/(home)`              | Landing page and home pages  |
| `app/[lang]/docs`         | Documentation pages (i18n)   |
| `app/api/search/route.ts` | Search API endpoint          |
| `content/docs/`           | Documentation content (MDX)  |
| `lib/source.ts`           | Content source configuration |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API

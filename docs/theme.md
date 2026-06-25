# MAPI 品牌主题规范

本文档记录 MAPI 接口文档平台（new-api-docs-v1）的品牌视觉规范，供后续 v2 官网及其他平台定制时参考。

---

## 品牌色板

| 用途 | 色值 | 说明 |
|------|------|------|
| **主色（Brand）** | `#165DFF` | 按钮、链接、高亮、激活状态 |
| **主色 Hover** | `#0E42D2` | 主色悬停深色 |
| **辅助蓝** | `#4080FF` | 渐变辅助色、次级强调 |
| **浅蓝** | `#94BFFF` | 边框高亮、浅色标记 |
| **背景** | `#F2F3F5` | 页面背景（浅灰） |
| **卡片面** | `#FFFFFF` | 卡片、面板背景 |
| **次级面** | `#F7F8FA` | 表头、输入框背景 |
| **边框** | `#E5E6EB` | 常规边框 |
| **强边框** | `#C9CDD4` | 强调边框 |
| **正文** | `#1D2129` | 主要文字 |
| **次要文字** | `#4E5969` | 描述、说明文字 |
| **三级文字** | `#86909C` | 占位符、禁用 |
| **成功** | `#00B42A` | 成功状态 |
| **警告** | `#FF7D00` | 警告状态 |
| **危险** | `#F53F3F` | 错误/危险状态 |

---

## 暗色模式色板

| 用途 | 色值 |
|------|------|
| **主色** | `#4080FF`（亮化以保持对比度） |
| **主色 Hover** | `#165DFF` |

---

## 字体

```css
/* 正文 / UI */
font-family: 'Segoe UI Variable Text', 'Segoe UI', 'PingFang SC',
  'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei',
  'Helvetica Neue', Arial, sans-serif;

/* 标题 */
font-family: 'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI',
  'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei',
  'Helvetica Neue', Arial, sans-serif;

/* 数字 / 金额 */
font-family: 'Bahnschrift', 'DIN Alternate', 'Arial Narrow',
  'Segoe UI Variable Display', 'Segoe UI', 'PingFang SC', sans-serif;

/* 代码 */
font-family: 'SFMono-Regular', 'Roboto Mono', Consolas,
  'Liberation Mono', Menlo, Monaco, monospace;
```

---

## Logo 资源

| 文件 | 用途 | 路径 |
|------|------|------|
| `favicon.png` | 浏览器 Tab 图标（蓝色马头） | `public/favicon.png` |
| `favicon.ico` | 兼容旧版浏览器图标 | `public/favicon.ico` |
| `mapi-logo.png` | 导航栏 Logo（马头 + MAPI 文字，深色版） | `public/assets/mapi-logo.png` |

> v1 原始文件位置：`/mapiV1/MAPI-delivery/public/` 和 `src/assets/images/`

---

## 圆角规范

| 级别 | 值 |
|------|----|
| 小（按钮、输入框） | `8px` |
| 中（卡片） | `12px` |
| 大（模态框、面板） | `16px` |

---

## 阴影规范

```css
/* 卡片常规 */
box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);

/* 卡片悬停 */
box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);

/* 主色光晕 */
box-shadow: 0 8px 20px rgba(22, 93, 255, 0.08);

/* 主色光晕（悬停） */
box-shadow: 0 12px 28px rgba(22, 93, 255, 0.12);
```

---

## 文档平台（new-api-docs-v1）定制入口

| 文件 | 作用 |
|------|------|
| `src/app/global.css` | 全局主题色变量（`--color-brand`、`--color-fd-primary` 等） |
| `src/lib/layout.shared.tsx` | 导航栏 Logo、名称、点击链接 |
| `src/app/layout.tsx` | Root metadata、favicon |
| `src/app/[lang]/layout.tsx` | 各语言页面标题和描述 |
| `src/components/footer.tsx` | 页脚备案信息 |

---

## 关键链接

| 平台 | 地址 |
|------|------|
| 聚合平台主页 | https://api.mapi.zone/ |
| 接口文档 | https://docs.mapi.zone |
| v1 官网 | https://mapi.planisp.com/ |

# LocLock Frontend

> 基于地理位置的访问控制系统 - 前端管理平台

## 📝 项目简介

LocLock 前端是一个现代化的 Web 管理平台，为 LocLock 访问控制系统提供直观的可视化管理界面。支持短链接管理、数据分析、用户权限控制等功能。

## ✨ 核心功能

### 🔐 用户管理
- 用户登录与认证
- 双因素认证 (2FA)
- 个人资料管理
- 管理员权限控制

### 🔗 短链接管理
- 创建/编辑/删除短链接
- 自定义短链接代码
- 链接标题设置
- 地理位置选择器（地图可视化）
- 访问范围设置
- 过期时间和访问次数限制
- 联系微信配置
- 回收站功能
- 二维码生成与下载

### 📊 数据分析
- **时间维度统计**: 支持小时/天/周/月粒度的访问趋势分析
- **设备统计**: 设备类型、浏览器、操作系统分布
- **地理热力图**: 访问者位置分布可视化
- **访问成功率**: 通过/拒绝访问数据分析

### 👥 系统管理 (超级管理员)
- 用户管理
- IP 黑名单管理
- 全局统计数据
- 链接封禁功能

### 🗺️ 地图功能
- 高德地图集成
- 坐标系转换 (WGS-84 ↔ GCJ-02)
- 可视化地理围栏
- 拖拽选择中心点
- 半径调整

## 🛠️ 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6
- **UI 组件库**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **图表**: ECharts 5
- **地图**: Leaflet + leaflet.heat
- **HTTP 客户端**: Axios
- **二维码**: qrcode
- **包管理**: npm

## 📦 项目结构

```
frontend/
├── src/
│   ├── api/                    # API 接口
│   │   ├── axios.js           # Axios 配置
│   │   └── index.js           # API 方法
│   ├── components/            # 组件
│   │   ├── AccessHeatmap.vue  # 访问热力图
│   │   ├── DeviceStats.vue    # 设备统计
│   │   ├── MapPicker.vue      # 地图选择器
│   │   └── TimeStats.vue      # 时间统计
│   ├── router/                # 路由配置
│   │   └── index.js
│   ├── stores/                # Pinia 状态管理
│   │   └── user.js
│   ├── views/                 # 页面视图
│   │   ├── public/           # 公共访问页面
│   │   │   ├── Checking.vue  # 位置验证页
│   │   │   └── AccessDenied.vue # 访问拒绝页
│   │   ├── AdminManage.vue   # 管理员管理
│   │   ├── Dashboard.vue     # 仪表盘
│   │   ├── IpBlacklist.vue   # IP黑名单
│   │   ├── Layout.vue        # 布局组件
│   │   ├── LinkManage.vue    # 链接管理
│   │   ├── Login.vue         # 登录页
│   │   └── Profile.vue       # 个人中心
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
├── index.html                # HTML 模板
├── package.json              # 依赖配置
├── vite.config.js            # Vite 配置
└── .env.production           # 生产环境变量
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/1318083885/loclock_frontend.git
cd loclock_frontend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

创建 `.env.production` 文件（生产环境）:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

开发环境使用 `vite.config.js` 中的 proxy 配置。

4. **启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:5173`

5. **构建生产版本**
```bash
npm run build
```

生成的文件在 `dist/` 目录。

## ⚙️ 配置说明

### 开发环境配置

编辑 `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // 后端开发服务器
        changeOrigin: true
      }
    }
  }
})
```

### 生产环境配置

#### 方案一: 环境变量配置（推荐）

创建 `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

前端会直接请求此 URL。

#### 方案二: Nginx 反向代理

如果前后端部署在同一域名下，可以通过 Nginx 配置代理：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # 前端静态文件
    root /path/to/dist;
    index index.html;
    
    # Vue Router History 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理到后端
    location /api {
        proxy_pass http://backend-server:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🎨 主要功能界面

### 登录页面
- 用户名/密码登录
- 支持 2FA 验证码输入

### 仪表盘
- 总链接数、总访问量统计
- 快速操作入口

### 链接管理
- 链接列表（支持搜索、分页）
- 创建/编辑对话框
  - 短链接代码
  - 链接标题
  - 目标 URL
  - 位置名称（自动补全历史）
  - 地图选择中心点
  - 范围半径（滑块调整）
  - 联系微信
  - 过期时间
  - 访问次数限制
- 操作按钮
  - 数据分析
  - 复制链接
  - 生成二维码
  - 编辑
  - 删除/封禁
- 回收站功能

### 数据分析
- 时间趋势图表
- 设备类型饼图
- 地理位置热力图

### IP 黑名单
- IP 列表管理
- 添加/移除黑名单
- 备注说明

### 个人中心
- 修改密码
- 2FA 设置
  - 扫描二维码
  - 输入验证码启用
  - 禁用 2FA

## 🔒 访客访问流程

### 位置验证页 (`/s/{short_code}`)
1. 自动获取用户地理位置
2. 显示链接标题（如果设置）
3. 向后端发送位置验证请求
4. 成功则跳转目标 URL
5. 失败则跳转到拒绝页面

### 访问拒绝页 (`/denied/{short_code}`)
- 显示距离目标位置的距离
- 显示允许访问的范围
- 显示管理员微信（如果设置）
- 一键复制微信号

## 📱 响应式设计

- 支持桌面端（1920px+）
- 支持平板端（768px - 1920px）
- 基础移动端支持（建议使用桌面端管理）

## 🎯 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 部署

### 静态文件部署

1. 构建项目
```bash
npm run build
```

2. 将 `dist/` 目录上传到 Web 服务器

3. 配置 Nginx（参考上方配置）

### 宝塔面板部署

1. 创建网站，指向 `dist` 目录
2. 设置伪静态规则（Vue Router History 模式）:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Vercel/Netlify 部署

直接连接 GitHub 仓库，配置：
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

添加环境变量: `VITE_API_BASE_URL`

## 🔧 开发指南

### 添加新页面

1. 在 `src/views/` 创建 Vue 组件
2. 在 `src/router/index.js` 添加路由
3. 在侧边栏菜单中添加入口（如需要）

### 添加新 API

在 `src/api/index.js` 添加方法:
```javascript
export const myAPI = {
    getData() {
        return request.get('/my-endpoint')
    }
}
```

### 状态管理

使用 Pinia store (`src/stores/`):
```javascript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
console.log(userStore.username)
```

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请通过 GitHub Issues 联系我们。

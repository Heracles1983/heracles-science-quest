# HERACLES LAB · 健身秘典

六部位传统健美训练互动课程：胸、背、肩、腿、手臂、核心，全部开放。共 24 关、60 道带解析情境题、24 个动作与 6 张可交互解剖图。保留原奇幻卡牌冒险。

## 本地运行

```sh
python -m http.server 4173 --directory dist
```

打开 http://localhost:4173/ 。网站无构建、包管理器或服务端依赖。全部图片、字体回退、JavaScript、CSS 与题库均为本地资源；外部文献仅为可选阅读链接。

## 课程与功能

每个部位均有解剖探索、动作实验、强度控制、训练编排四关。图中肌肉可以点击和放大，深层结构通过明确标注的窗口展示；动作图有起止位置与路径。每关附完整可展开的中文知识讲解、情境题和即时解释。

编排按部位分别检查动作数、工作组数、动作模式、RIR 和休息。例如背部要求水平拉与垂直拉，下肢要求蹲与髋铰链，手臂包含屈肘和伸肘，核心包含抗伸展与抗旋转。数量范围仅为单堂教学案例，不是每周处方。

支持六章独立进度、全课程错题复习、60 条学习笔记、6 枚徽章、24 题综合挑战、3 天/4 天每周编排思路与文本下载。Service Worker 在首次完整加载后缓存本地资源，支持离线复习。离线能力需 HTTPS 或 localhost，首次资源尚未缓存时无法保证可用。

## 进度兼容

新进度保存到浏览器 localStorage `fitcraft-academy-v2`；首次升级自动迁移同源 `fitcraft-chest-v1`。支持六章 JSON 完整导入导出，也兼容旧版 `heracles-chest` 备份。原版 `classic.html` 继续使用 `fitcraft-v1`，与课程进度独立。

不同域名、浏览器或设备不能自动共享 localStorage，请从“我的学习笔记”导出后在目标站点导入。导入完整备份会恢复备份中的六章状态；导入旧胸部备份仅替换胸部，保留其他章节。

## 文件

- `dist/index.html`、`academy.js`、`academy.css`：多章节交互与界面。
- `dist/courses/*.js`：六章结构、正文、题库、编排规则。
- `dist/chest-data.js`：兼容保留的胸部基础数据。
- `dist/assets/*-anatomy.svg`、`exercise-*.svg`：本地原创解剖和动作示意。
- `dist/classic.html`、`game.js`、`questions.js`、`style.css`：原卡牌游戏。
- `dist/sw.js`、`manifest.webmanifest`：按部署子路径隔离的离线缓存与安装信息。

## 部署

现有 GitHub Pages 地址：https://heracles1983.github.io/heracles-science-quest/fitcraft/ 。将 `dist/` 内容放到该仓库的 `fitcraft/`，保留根项目。具体操作见 DEPLOYMENT.md。

同一套文件可部署到国内或香港的静态主机。GitHub Pages 的大陆可达性和速度不能保证，网站自身不依赖国外 CDN 或 API；大陆网络体验需要在实际目标网络验收。

## 验证

Chromium 实际交互覆盖六章 24 关和 60 题、错误答案反馈、跨课程复习、编排门槛、60 条笔记与 6 枚徽章、100% 刷新保持、导入导出、24 题综合挑战、旧进度迁移、损坏测验恢复、存储不可用时学习、GitHub 子目录相对路径、离线资源和原卡牌游戏。

手机六章及 320–1024 像素宽度检查无横向溢出。JavaScript 语法、SVG XML、本地资源引用与默认编排规则已验证。页面运行不请求外部服务。

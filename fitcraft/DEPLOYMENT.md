# 完整版一次部署说明

## 现有 GitHub 仓库

- 仓库：https://github.com/Heracles1983/heracles-science-quest
- 网页：https://heracles1983.github.io/heracles-science-quest/fitcraft/
- 项目放在 `fitcraft/`；仓库根 `index.html` 是另一款游戏，应保留。

发布包中 `fitcraft/` 已包含全部网页、六章题库、30 张解剖/动作 SVG、原卡牌素材、完整计划设计章节和离线缓存。把整个 `fitcraft/` 文件夹合并到现有仓库同名目录，新增/覆盖对应文件，不需要 npm、构建或接口密钥。不要只上传首页。

仓库 main 分支受保护，需要通过分支与 PR 提交；合并后现有 Pages 构建会自动部署，无需另装工作流。首次更新可能需要等待几分钟。发布包附带的 `examples/github-pages.yml` 仅供独立新仓库使用，现有仓库不需要它。

## 新仓库或其他静态主机

可以把 `fitcraft/` 内的内容作为网站根目录，首页是 `index.html`。也可以保留 `fitcraft/` 子目录路径，所有运行时路径均为相对路径。

全站为静态文件，可上传到对象存储静态网站、Nginx、宝塔或其他静态托管。设置正确的 SVG/JavaScript/CSS MIME 类型并启用 HTTPS；无需数据库、环境变量或后端。

GitHub Pages 与大陆网络的可达性并无保证。若需要稳定覆盖大陆访客，建议按实际条件采用国内合规静态托管或面向大陆线路较好的香港主机，并在目标运营商网络测试。大陆节点的域名备案要求以服务商为准。

## 升级后的检查

1. 首页能切换胸、背、肩、腿、手臂、核心；每章有四关、四个动作与十道题。
2. 六部位后出现第七章：进阶模拟、五套经典计划、自编七天计划和结课挑战。
3. 解剖图和动作图显示，旧游戏可从“冒险牌桌”进入。
4. 首次在线完整载入后，可断网刷新复习；首次离线访问不保证可用。
5. 同源旧胸部进度自动迁移。换域名前，从学习笔记导出备份，再到新地址导入。
6. 后续更新代码时同步更新 `sw.js` 中的 CACHE 版本；它的缓存范围仅覆盖本项目子目录。

## 本地预览

在包含 `fitcraft/` 的目录运行：

```sh
python -m http.server 8080
```

浏览器打开 http://localhost:8080/fitcraft/ 。不要直接双击 HTML 作为正式验证，因为 file:// 下的资源交互与离线缓存会受到浏览器限制。

## 计划版本的备份

“我的学习笔记 → 导出全部学习备份”包含六部位、动作选择、计划毕业章状态。计划编排页还可导出独立 TXT / JSON；页脚“保存 / 备份”导出的计划学习文件可在编排页“导入计划”恢复。不同站点之间的进度不自动同步。

请完整上传新增的 course-enrichment.js、selection-lab.js、planner-data.js、planner-engine.js、planner.js 和 planner.css，保持脚本在 HTML 中的加载顺序。Service Worker 缓存版本已经更新为 planning-1。

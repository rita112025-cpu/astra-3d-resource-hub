# Astra 3D Resource Hub

> AI 3D、Blender、CAD、BIM、Three.js 與工程 Prompt 資源導航

一頁式靜態網站，整理 GPT-6 Astra 相關 Prompt、Blender 建模、Three.js / WebGPU 3D、CAD / 建築 / BIM、Unreal / Unity、AI Agent 操作 3D 軟體等資源，並提供可直接複製的工程版 Prompt。

**線上預覽**： `https://rita112025-cpu.github.io/astra-3d-resource-hub/`

請將 `rita112025-cpu` 替換為你的 GitHub 用戶名。

## Purpose

- 不是內容網站，而是「個人 3D AI 資源導航與 Prompt 索引」
- 快速搜尋、分類、標籤篩選
- 每張卡片可直接開 GitHub / Demo / Prompt
- 純前端、無後端、無資料庫、可直接部署 GitHub Pages
- 未來新增資料只需修改一個 JSON

## Features

- 一頁式版型：Header / Hero 搜尋 / 快速分類 / 工程用途 / 標籤 / 資源卡片 / 精選區 / Prompt Library / 來源區 / Footer
- 即時搜尋：title / description / category / useCase / tags / source / notes
- 分類篩選：主要分類 + 工程用途可同時篩選（AND）
- 標籤系統：自動統計熱門標籤，點擊可篩選（支援多選 AND）
- 排序：精選優先 / 名稱 A-Z / 最新加入
- 收藏：localStorage ☆/★，只看收藏
- URL Filter：`?category=Blender&tag=Architecture&q=...` 分享後保留
- Dark Mode：跟隨 `prefers-color-scheme`，可手動切換，存 localStorage
- Prompt Library：內建 3 個工程 Prompt，可展開與一鍵複製
- RWD：桌機 3 欄 / 平板 2 欄 / 手機 1 欄
- 無 build，GitHub Pages 直接可跑

> **注意**：本專案使用 `fetch('./data/resources.json')` 載入資料。
> 若直接雙擊 `index.html` 以 `file://` 開啟，瀏覽器可能因安全限制擋掉 JSON 載入。
> 本機開發建議使用 HTTP Server，不應保證雙擊可正常載入。GitHub Pages 本身為 HTTP/HTTPS 環境，無此問題。

## Project Structure

```
astra-3d-resource-hub/
├─ index.html
├─ style.css
├─ app.js
├─ data/
│  └─ resources.json
├─ assets/
│  └─ icons/
├─ README.md
├─ .gitignore
└─ LICENSE
```

## How to Add Resources

Open `data/resources.json`，新增一筆：

```json
{
  "id": "unique-id-001",
  "title": "Your Resource Title",
  "category": "Blender",
  "useCase": "平面圖轉 3D",
  "description": "簡短說明，工程導向",
  "tags": ["Blender", "Architecture", "Editable"],
  "source": "Awesome Astra Prompts",
  "github": "",
  "demo": "",
  "prompt": "",
  "sourceCode": "",
  "reference": "",
  "featured": false,
  "added": "2026-09-11",
  "notes": "備註"
}
```

必填：`id`, `title`, `category`, `description`
選填：其餘皆可留空字串 `""`，**禁止捏造網址**

## Local Development

不需要 `npm install`。

```bash
# 推薦使用 HTTP Server 避免 file:// CORS 問題
python -m http.server 8000
# 然後開啟 http://localhost:8000
```

## GitHub Pages Deployment

1. 建立 repo：`astra-3d-resource-hub`
2. 推送所有檔案到 `main` 分支（根目錄包含 `index.html`）
3. 到 GitHub：Settings → Pages → Source：`Deploy from branch` → Branch：`main` / `/ (root)`
4. 等待部署，完成後網址為：`https://rita112025-cpu.github.io/astra-3d-resource-hub/`

## Repo Settings 建議

**Short Description:**
AI 3D、Blender、CAD、BIM、Three.js 與工程 Prompt 資源導航 / Curated Astra / Blender / CAD / BIM / Three.js workflow & prompt index.

**Topics:**
astra, blender, cad, bim, revit, threejs, webgpu, unreal-engine, unity, ai-agent, mcp, prompt-engineering, floor-plan, architecture, glb

## Data Schema

```ts
type Resource = {
  id: string
  title: string
  category: string
  useCase?: string
  description: string
  tags?: string[]
  source?: string
  github?: string
  demo?: string
  prompt?: string
  sourceCode?: string
  reference?: string
  featured?: boolean
  added?: string // YYYY-MM-DD
  notes?: string
}
```

## Prompt Library 內建

1. CAD / Floor Plan → Blender Engineering Workflow
2. Blender Model Validation
3. Astra Repo Case Study Analyzer

## License

MIT – 見 `LICENSE`。

// Astra 3D Resource Hub - Vanilla JS
const DATA_URL = './data/resources.json';
const CATEGORIES = ["全部","Astra","Blender","CAD","BIM / Revit","Three.js","WebGPU","Unreal Engine","Unity","3D Printing","AI Agent","Prompt","Tutorial","GitHub Repo"];
const USECASES = ["全部","平面圖轉 3D","建築建模","室內建模","機電 / MEP","參數化建模","自動化建模","模型驗證","Web 3D","遊戲場景","3D 列印","模型轉換","Agent 操作","Prompt Engineering"];
const PROMPT_CATEGORIES = ["全部","建築","CAD","Blender","BIM","Three.js","模型驗證","Agent"];

const BUILTIN_PROMPTS = [
  {
    id: "builtin-cad-blender-eng",
    name: "CAD / Floor Plan → Blender Engineering Workflow",
    category: "建築",
    useCase: "工程建模",
    content: `你正在協助我把建築平面圖轉成可編輯的 Blender 建築模型。

INPUT
我會提供：
- CAD 平面圖
- PDF
- 圖片
圖面單位優先依原始圖面判斷。
若無法確認尺寸，不可自行猜測。

OBJECTIVE
建立可繼續修改與驗證的 Blender 模型，
而不是只產生視覺效果。

MODEL STRUCTURE
將模型依以下分類：
Walls
Columns
Doors
Windows
Floors
Stairs
每種構件必須分開。
不得把整棟建築合併成單一 Mesh。

NAMING
所有物件必須有可辨識名稱。
例如：
Wall_A01
Wall_A02
Column_C01
Door_D01
Window_W01

EDITABILITY
模型必須保持可編輯。
不要過早 Apply Modifier。
重複構件應優先使用 Instance。

GEOMETRY
第一階段只建立：
外牆
內牆
柱
門
窗
樓板
樓梯
不要先做：
材質
燈光
裝飾
家具
景觀

VALIDATION
建立模型後檢查：
外框尺寸
牆厚
柱位置
門位置
窗位置
房間尺寸
重疊 Geometry
Disconnected Geometry

UNKNOWN DATA
如果尺寸或圖面資訊不足：
不得自行猜測。
建立：
TODO_UNVERIFIED
清單。

OUTPUT
產出：
.blend
Blender Python script
model_validation.md
TODO_UNVERIFIED.md`
  },
  {
    id: "builtin-blender-validation",
    name: "Blender Model Validation",
    category: "模型驗證",
    useCase: "驗證",
    content: `請檢查目前 Blender 模型。
不要修改模型。
先執行驗證。
檢查：
1. Object naming
2. Duplicate objects
3. Unapplied transforms
4. Non-manifold geometry
5. Overlapping geometry
6. Disconnected geometry
7. Incorrect scale
8. Unexpected mesh merging
9. Collection structure
10. Editable modifiers
11. Instance usage
12. Missing objects

輸出：
VALIDATION REPORT
分成：
PASS
WARNING
FAIL
UNVERIFIED

每項問題必須包含：
Object
Issue
Evidence
Risk
Suggested Fix

不得在沒有確認的情況下直接修改。`
  },
  {
    id: "builtin-astra-analyzer",
    name: "Astra Repo Case Study Analyzer",
    category: "Agent",
    useCase: "分析",
    content: `請分析這個 Astra 3D 案例。
不要只摘要 Prompt。
請拆解成：
1. Input
2. Objective
3. Tool
4. Workflow
5. Output
6. Validation
7. Automation
8. Editable requirements
9. Reusable techniques
10. Engineering applicability

最後整理：
可直接沿用的 Prompt 結構
不適合工程使用的部分
需要補強的驗證機制
可以改造成哪些 CAD / BIM / Blender 工作流

如果原始案例沒有足夠資訊，
標記：
UNVERIFIED
不得自行補造。`
  }
];

let resources = [];
let filtered = [];
let state = {
  q: "",
  category: "全部",
  useCase: "全部",
  tags: new Set(),
  sort: "featured",
  favOnly: false,
  promptCategory: "全部",
  tagsExpanded: false
};
let favSet = new Set();
let allTags = [];

const els = {};
function $(id){ return document.getElementById(id); }

function initEls(){
  els.searchInput = $('searchInput');
  els.resultCount = $('resultCount');
  els.categoryFilters = $('categoryFilters');
  els.useCaseFilters = $('useCaseFilters');
  els.tagFilters = $('tagFilters');
  els.resourceGrid = $('resourceGrid');
  els.featuredGrid = $('featuredGrid');
  els.emptyState = $('emptyState');
  els.errorState = $('errorState');
  els.errorMsg = $('errorMsg');
  els.sortSelect = $('sortSelect');
  els.favBtn = $('favoritesOnlyBtn');
  els.clearBtn = $('clearFiltersBtn');
  els.clearBtn2 = $('clearFiltersBtn2');
  els.emptyClearBtn = $('emptyClearBtn');
  els.toggleTagsBtn = $('toggleTagsBtn');
  els.promptGrid = $('promptGrid');
  els.promptCatFilters = $('promptCategoryFilters');
  els.themeToggle = $('themeToggle');
  els.toast = $('toast');
}

function loadFavorites(){
  try{
    const raw = localStorage.getItem('astra-3d-favorites');
    if(raw){ favSet = new Set(JSON.parse(raw)); }
  }catch{}
}
function saveFavorites(){
  localStorage.setItem('astra-3d-favorites', JSON.stringify([...favSet]));
}

function loadTheme(){
  const saved = localStorage.getItem('astra-theme');
  if(saved){ document.documentElement.setAttribute('data-theme', saved); }
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme');
  const isDark = cur === 'dark' || (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('astra-theme', next);
}

function parseURL(){
  const params = new URLSearchParams(location.search);
  if(params.get('q')) state.q = params.get('q');
  if(params.get('category')) state.category = params.get('category');
  if(params.get('useCase')) state.useCase = params.get('useCase');
  if(params.get('sort')) state.sort = params.get('sort');
  if(params.get('fav') === '1') state.favOnly = true;
  const tagParam = params.getAll('tag');
  if(tagParam.length){ state.tags = new Set(tagParam); }
  // support ?tag=a,b
  const tagSingle = params.get('tag');
  if(tagSingle && tagSingle.includes(',')){
    tagSingle.split(',').forEach(t=> state.tags.add(t.trim()));
  }
}

function syncURL(){
  const params = new URLSearchParams();
  if(state.q) params.set('q', state.q);
  if(state.category !== '全部') params.set('category', state.category);
  if(state.useCase !== '全部') params.set('useCase', state.useCase);
  if(state.sort !== 'featured') params.set('sort', state.sort);
  if(state.favOnly) params.set('fav','1');
  state.tags.forEach(t=> params.append('tag', t));
  const qs = params.toString();
  const newUrl = qs ? `?${qs}` : location.pathname;
  history.replaceState(null, '', newUrl);
}

function matchesCategory(resCat, filterCat){
  if(filterCat === '全部') return true;
  if(resCat === filterCat) return true;
  // fuzzy for BIM / Revit vs BIM
  if(filterCat === 'BIM / Revit' && resCat === 'BIM') return true;
  if(filterCat === 'BIM' && resCat === 'BIM / Revit') return true;
  if(filterCat === 'Unreal Engine' && resCat === 'Unreal') return true;
  if(filterCat === 'Unreal' && resCat === 'Unreal Engine') return true;
  return false;
}
function matchesUseCase(resUC, filterUC){
  if(filterUC === '全部') return true;
  if(!resUC) return false;
  return resUC === filterUC;
}

function getSearchableText(r){
  return [r.title, r.description, r.category, r.useCase, (r.tags||[]).join(' '), r.source, r.notes].join(' ').toLowerCase();
}

function filterAndSort(){
  const q = state.q.trim().toLowerCase();
  filtered = resources.filter(r=>{
    if(q){
      const hay = getSearchableText(r);
      if(!hay.includes(q)) return false;
    }
    if(!matchesCategory(r.category, state.category)) return false;
    if(!matchesUseCase(r.useCase, state.useCase)) return false;
    if(state.tags.size){
      const rTags = new Set((r.tags||[]).map(t=>t.toLowerCase()));
      for(const sel of state.tags){
        if(!rTags.has(sel.toLowerCase())) return false;
      }
    }
    if(state.favOnly && !favSet.has(r.id)) return false;
    return true;
  });

  // sort
  if(state.sort === 'featured'){
    filtered.sort((a,b)=>{
      if(a.featured !== b.featured) return a.featured ? -1 : 1;
      const da = a.added || ''; const db = b.added || '';
      return db.localeCompare(da);
    });
  }else if(state.sort === 'name'){
    filtered.sort((a,b)=> a.title.localeCompare(b.title, 'zh-Hant'));
  }else if(state.sort === 'newest'){
    filtered.sort((a,b)=> (b.added||'').localeCompare(a.added||''));
  }

  renderResources();
  renderResultCount();
  syncURL();
}

function renderResultCount(){
  if(!els.resultCount) return;
  els.resultCount.textContent = `目前顯示 ${filtered.length} / ${resources.length} 個資源`;
}

function renderChips(){
  // categories
  els.categoryFilters.innerHTML = '';
  CATEGORIES.forEach(cat=>{
    const btn = document.createElement('button');
    btn.className = 'chip' + (state.category===cat ? ' active' : '');
    btn.textContent = cat;
    btn.setAttribute('aria-pressed', state.category===cat ? 'true':'false');
    btn.addEventListener('click', ()=>{
      state.category = cat;
      renderChips();
      filterAndSort();
    });
    els.categoryFilters.appendChild(btn);
  });
  // usecase
  els.useCaseFilters.innerHTML = '';
  USECASES.forEach(uc=>{
    const btn = document.createElement('button');
    btn.className = 'chip' + (state.useCase===uc ? ' active' : '');
    btn.textContent = uc;
    btn.setAttribute('aria-pressed', state.useCase===uc ? 'true':'false');
    btn.addEventListener('click', ()=>{
      state.useCase = uc;
      renderChips();
      filterAndSort();
    });
    els.useCaseFilters.appendChild(btn);
  });
  // tags
  const tagCounts = {};
  resources.forEach(r=> (r.tags||[]).forEach(t=>{
    const key = t;
    tagCounts[key] = (tagCounts[key]||0)+1;
  }));
  allTags = Object.entries(tagCounts).sort((a,b)=> b[1]-a[1]).map(([name,count])=>({name,count}));
  els.tagFilters.innerHTML = '';
  allTags.forEach(({name,count})=>{
    const btn = document.createElement('button');
    btn.className = 'chip tag' + (state.tags.has(name) ? ' active' : '');
    btn.textContent = `${name} (${count})`;
    btn.title = name;
    btn.addEventListener('click', ()=>{
      if(state.tags.has(name)) state.tags.delete(name);
      else state.tags.add(name);
      renderChips();
      filterAndSort();
    });
    els.tagFilters.appendChild(btn);
  });
  els.tagFilters.classList.toggle('collapsed', !state.tagsExpanded);
  els.toggleTagsBtn.textContent = state.tagsExpanded ? '收合' : '顯示全部';
}

function createCard(r){
  const card = document.createElement('article');
  card.className = 'card';
  const isFav = favSet.has(r.id);
  const title = document.createElement('div');
  title.className = 'card-top';
  title.innerHTML = `<h3 class="card-title">${escapeHtml(r.title)}</h3><button class="fav-btn ${isFav ? 'active':''}" aria-label="收藏 ${escapeHtml(r.title)}">${isFav ? '★' : '☆'}</button>`;
  const favBtn = title.querySelector('.fav-btn');
  favBtn.addEventListener('click', ()=>{
    if(favSet.has(r.id)) favSet.delete(r.id);
    else favSet.add(r.id);
    saveFavorites();
    renderResources();
    renderFeatured();
    renderResultCount();
  });

  const badges = document.createElement('div');
  badges.className = 'badges';
  badges.innerHTML = `<span class="badge cat">${escapeHtml(r.category)}</span>${r.useCase ? `<span class="badge">${escapeHtml(r.useCase)}</span>` : ''}${r.featured ? `<span class="badge">精選</span>` : ''}`;

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = r.description;

  const tagsRow = document.createElement('div');
  tagsRow.className = 'tags-row';
  (r.tags||[]).forEach(t=>{
    const span = document.createElement('button');
    span.className = 'tag';
    span.textContent = t;
    span.addEventListener('click', ()=>{
      state.tags.add(t);
      renderChips();
      filterAndSort();
      document.getElementById('resources-section').scrollIntoView({behavior:'smooth'});
    });
    tagsRow.appendChild(span);
  });

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `${r.source ? `<span>來源：${escapeHtml(r.source)}</span>` : ''}${r.added ? `<span>加入：${escapeHtml(r.added)}</span>` : ''}${r.notes ? `<span>${escapeHtml(r.notes)}</span>` : ''}`;

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  function addLink(label, url){
    if(!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'btn secondary small';
    a.textContent = label;
    actions.appendChild(a);
  }
  addLink('GitHub', r.github);
  addLink('Live Demo', r.demo);
  // prompt handling
  if(r.prompt){
    if(r.prompt.startsWith('http')){
      addLink('Prompt', r.prompt);
    }else{
      const b = document.createElement('button');
      b.className = 'btn secondary small';
      b.textContent = '複製 Prompt';
      b.addEventListener('click', ()=> copyText(r.prompt));
      actions.appendChild(b);
    }
  }
  addLink('Source Code', r.sourceCode);
  addLink('Reference', r.reference);

  card.appendChild(title);
  card.appendChild(badges);
  card.appendChild(desc);
  card.appendChild(tagsRow);
  card.appendChild(meta);
  if(actions.children.length) card.appendChild(actions);
  return card;
}

function renderResources(){
  els.resourceGrid.innerHTML = '';
  if(filtered.length===0){
    els.emptyState.hidden = false;
  }else{
    els.emptyState.hidden = true;
    filtered.forEach(r=> els.resourceGrid.appendChild(createCard(r)));
  }
}
function renderFeatured(){
  if(!els.featuredGrid) return;
  els.featuredGrid.innerHTML = '';
  const featured = resources.filter(r=> r.featured);
  // if filtering, also filter featured by same query? spec says 精選區只顯示 featured true, but we can show all featured regardless of filter, or filtered? Keep all featured for discovery.
  featured.forEach(r=> els.featuredGrid.appendChild(createCard(r)));
}

function renderPromptLibrary(){
  const cats = PROMPT_CATEGORIES;
  els.promptCatFilters.innerHTML = '';
  cats.forEach(cat=>{
    const btn = document.createElement('button');
    btn.className = 'chip' + (state.promptCategory===cat ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', ()=>{
      state.promptCategory = cat;
      renderPromptLibrary();
    });
    els.promptCatFilters.appendChild(btn);
  });
  els.promptGrid.innerHTML = '';
  let list = BUILTIN_PROMPTS;
  if(state.promptCategory !== '全部'){
    list = list.filter(p=> p.category === state.promptCategory);
  }
  list.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'prompt-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px">
        <h3>${escapeHtml(p.name)}</h3>
        <button class="btn secondary small expand-btn">展開</button>
      </div>
      <div class="prompt-meta">
        <span class="badge cat">${escapeHtml(p.category)}</span>
        <span class="badge">${escapeHtml(p.useCase)}</span>
      </div>
      <pre class="prompt-content">${escapeHtml(p.content)}</pre>
      <div class="prompt-actions">
        <button class="btn small copy-btn">複製 Prompt</button>
      </div>
    `;
    const expandBtn = card.querySelector('.expand-btn');
    const content = card.querySelector('.prompt-content');
    expandBtn.addEventListener('click', ()=>{
      card.classList.toggle('expanded');
      expandBtn.textContent = card.classList.contains('expanded') ? '收合' : '展開';
    });
    card.querySelector('.copy-btn').addEventListener('click', ()=> copyText(p.content));
    els.promptGrid.appendChild(card);
  });
}

function copyText(text){
  navigator.clipboard.writeText(text).then(()=>{
    showToast('已複製到剪貼簿');
  }).catch(()=>{
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('已複製');
  });
}
let toastTimer;
function showToast(msg){
  els.toast.textContent = msg;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> els.toast.hidden = true, 2000);
}
function escapeHtml(s){
  if(!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadData(){
  try{
    const res = await fetch(DATA_URL, {cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // validate minimal fields
    resources = data.filter(item=> item && item.id && item.title && item.category && item.description);
    if(resources.length===0) throw new Error('無有效資料');
  }catch(e){
    els.errorState.hidden = false;
    els.errorMsg.textContent = e.message;
    console.error(e);
    els.resultCount.textContent = '載入失敗';
    return;
  }
  renderChips();
  // init controls from URL
  if(state.q) els.searchInput.value = state.q;
  if(state.sort) els.sortSelect.value = state.sort;
  if(state.favOnly){
    els.favBtn.textContent = '★ 只看收藏';
    els.favBtn.setAttribute('aria-pressed','true');
  }
  filterAndSort();
  renderFeatured();
  renderPromptLibrary();
}

function bindEvents(){
  els.searchInput.addEventListener('input', (e)=>{
    state.q = e.target.value;
    filterAndSort();
  });
  els.sortSelect.addEventListener('change', (e)=>{
    state.sort = e.target.value;
    filterAndSort();
  });
  els.favBtn.addEventListener('click', ()=>{
    state.favOnly = !state.favOnly;
    els.favBtn.setAttribute('aria-pressed', state.favOnly ? 'true':'false');
    els.favBtn.textContent = state.favOnly ? '★ 只看收藏' : '☆ 只看收藏';
    filterAndSort();
  });
  function clearAll(){
    state.q = '';
    state.category = '全部';
    state.useCase = '全部';
    state.tags.clear();
    state.favOnly = false;
    state.sort = 'featured';
    els.searchInput.value = '';
    els.sortSelect.value = 'featured';
    els.favBtn.textContent = '☆ 只看收藏';
    els.favBtn.setAttribute('aria-pressed','false');
    renderChips();
    filterAndSort();
  }
  els.clearBtn.addEventListener('click', clearAll);
  els.clearBtn2.addEventListener('click', clearAll);
  els.emptyClearBtn.addEventListener('click', clearAll);
  els.toggleTagsBtn.addEventListener('click', ()=>{
    state.tagsExpanded = !state.tagsExpanded;
    renderChips();
  });
  els.themeToggle.addEventListener('click', toggleTheme);
}

function init(){
  initEls();
  loadFavorites();
  loadTheme();
  parseURL();
  bindEvents();
  loadData();
}
init();

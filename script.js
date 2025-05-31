/* ──────────────────────────────────────────────────────────────
   Komnottra ‑ Admin / Public Front‑End
   script.js  (v2 — EDIT MODE ADDED)
   ──────────────────────────────────────────────────────────────
   ✦  Features
   •  View + category filter (public)
   •  Admin tab for create / edit / delete
   •  GIF overlay on publish / update
   •  Category create / delete / dropdown refresh
   •  Backup / restore handled in inline <script> of index.html
   •  NEW: editingArticleId global, PUT /articles/:id support, Edit buttons
─────────────────────────────────────────────────────────────────*/

/***** 1 · Global configuration *****/
if (typeof API_BASE === 'undefined') {
  API_BASE = 'https://komnottra-backend.onrender.com';
}

/***** 2 · DOM selectors *****/
const writeTab       = document.getElementById('writeTab');
const viewTab        = document.getElementById('viewTab');
const writeSection   = document.getElementById('writeSection');
const viewSection    = document.getElementById('viewSection');
const form           = document.getElementById('articleForm');
const articlesList   = document.getElementById('articlesList');
const adminArticles  = document.getElementById('adminArticles');
const categoryNav    = document.getElementById('categoryNav');
const titleInput     = document.getElementById('title');
const contentInput   = document.getElementById('content');
const imageInput     = document.getElementById('imageUpload');
const categoryInput  = document.getElementById('categorySelect');
const logo           = document.querySelector('.logo');

/***** 3 · GIF overlay setup *****/
const gifOverlay = (()=>{
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.5);z-index:1000;`;
  const loading = document.createElement('img'); loading.src='loading.gif'; loading.style.width='100px';
  const success = document.createElement('img'); success.src='success.gif'; success.style.width='100px'; success.style.display='none';
  overlay.append(loading, success); document.body.appendChild(overlay);
  return { overlay, loading, success };
})();

/***** 4 · State *****/
let editingArticleId      = null;                               // null → create,  number → edit mode
let isAdmin               = localStorage.getItem('isAdmin')==='true';
const adminUsername       = 'admin';
const adminPassword       = '123';
let articleData           = [];
let filteredArticles      = [];
let currentCategoryFilter = null;

/***** 5 · Fetch helpers *****/
async function fetchArticles(){
  try{ const r=await fetch(`${API_BASE}/articles`); articleData = await r.json(); return articleData; }
  catch(e){console.error('fetchArticles',e); return [];} }

async function fetchCategories(){
  try{ const r=await fetch(`${API_BASE}/categories`); return await r.json(); }
  catch(e){console.error('fetchCategories',e); return [];} }

async function deleteArticleFromBackend(id){
  try{ const r=await fetch(`${API_BASE}/articles/${id}`,{method:'DELETE'}); return await r.json(); }
  catch(e){console.error('deleteArticle',e);} }

/***** 6 · Category dropdown + nav *****/
async function refreshCategoryDropdowns(){
  const cats = await fetchCategories();
  if (categoryInput)       categoryInput.innerHTML       = `<option value="" disabled selected>Select Category (Optional)</option>`;
  if (deleteCategorySelect) deleteCategorySelect.innerHTML = `<option disabled selected>Select Category to Delete</option>`;
  cats.forEach(c=>{
    categoryInput?.appendChild(new Option(c,c));
    deleteCategorySelect?.appendChild(new Option(c,c));
  });
  displayCategoryNav(cats);
}

function displayCategoryNav(cats){
  if (!categoryNav) return; categoryNav.innerHTML='';
  const allBtn = document.createElement('button'); allBtn.textContent='ព័ត៌មានចម្រុះ'; allBtn.className='category-btn';
  if (!currentCategoryFilter) allBtn.classList.add('active');
  allBtn.onclick=()=>{currentCategoryFilter=null; displayArticles(); updateCategoryNavActive();};
  categoryNav.appendChild(allBtn);
  cats.forEach(c=>{
    const b=document.createElement('button'); b.textContent=c; b.className='category-btn';
    if (c===currentCategoryFilter) b.classList.add('active');
    b.onclick=()=>{currentCategoryFilter=c; displayArticles(); updateCategoryNavActive();};
    categoryNav.appendChild(b);
  });
}
function updateCategoryNavActive(){
  categoryNav?.querySelectorAll('button').forEach(b=>{
    const act = (b.textContent===currentCategoryFilter)||(!currentCategoryFilter&&b.textContent==='ព័ត៌មានចម្រុះ');
    b.classList.toggle('active',act);
  });
}

/***** 7 · Admin → Edit helpers *****/
window.editArticle = id => {
  if (!isAdmin) return;
  const art = articleData.find(a=>a.id===id);
  if (!art) return alert('Article not found');
  titleInput.value   = art.title;
  contentInput.value = art.content;
  if (categoryInput) {
    const v = Array.isArray(art.category)?art.category[0]:art.category;
    categoryInput.value = v||'';
  }
  imageInput.value = '';
  editingArticleId = id;
  form.querySelector('button[type="submit"]').textContent='Update';
  writeTab.click();
};

window.deleteArticle = async id => {
  if (!isAdmin) return;
  if (!confirm('Are you sure?')) return;
  await deleteArticleFromBackend(id);
  await fetchArticles(); displayArticles(); displayAdminArticles();
};

/***** 8 · Display lists *****/
function displayAdminArticles(){
  if (!adminArticles) return;
  adminArticles.innerHTML='';
  articleData.forEach(a=>{
    const row=document.createElement('div');
    row.innerHTML = `<hr><strong>${a.title}</strong>
      <button class="edit-btn"   onclick="editArticle(${a.id})">Edit</button>
      <button class="delete-btn" onclick="deleteArticle(${a.id})">Delete</button>`;
    adminArticles.appendChild(row);
  });
}

function displayArticles(){
  if (!articlesList) return;
  articlesList.innerHTML='';
  filteredArticles = currentCategoryFilter ? articleData.filter(a=>a.category===currentCategoryFilter) : [...articleData];
  if (!filteredArticles.length) { articlesList.innerHTML='<p>No articles available.</p>'; return; }
  filteredArticles.forEach(a=>{
    const base = API_BASE;
    const img  = a.imageUrl ? (a.imageUrl.startsWith('http')?a.imageUrl:base+a.imageUrl) : null;
    const card = document.createElement('div'); card.className='article-preview';
    card.innerHTML = `${img?`<img src="${img}" alt="Article image">`:''}<div class="article-title">${a.title}</div>`;
    card.onclick=()=>{window.location.href=`article.html?slug=${a.slug}`;};
    articlesList.appendChild(card);
  });
  updateCategoryNavActive();
}

/***** 9 · Form submit (create or update) *****/
if (form){
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    if (!titleInput.value.trim()||!contentInput.value.trim()) return alert('Title & Content required');

    gifOverlay.loading.style.display='block';
    gifOverlay.success.style.display='none';
    gifOverlay.overlay.style.display='flex';

    const fd = new FormData(form);
    const url  = editingArticleId ? `${API_BASE}/articles/${editingArticleId}` : `${API_BASE}/articles`;
    const verb = editingArticleId ? 'PUT' : 'POST';
    try{
      const res = await fetch(url,{method:verb,body:fd});
      if (!res.ok) throw new Error((await res.json()).message||'Save failed');
      gifOverlay.loading.style.display='none'; gifOverlay.success.style.display='block';
      setTimeout(async()=>{
        gifOverlay.overlay.style.display='none';
        form.reset(); editingArticleId=null; form.querySelector('button[type="submit"]').textContent='Publish';
        await fetchArticles(); displayAdminArticles(); viewTab.click();
      },1200);
    }catch(err){ gifOverlay.overlay.style.display='none'; alert(err.message||'Save error'); }
  });
}

/***** 10 · Initial load & tab logic (unchanged except for admin list refresh) *****/
window.onload = async ()=>{
  await refreshCategoryDropdowns();
  await fetchArticles(); displayArticles(); if (isAdmin) displayAdminArticles();
  if (location.hash==='#write') writeTab.click(); else viewTab.click();
};

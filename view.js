/* ------------------------------------------------------------------
   Global configuration
------------------------------------------------------------------ */
if (typeof API_BASE === "undefined") {
  API_BASE = "https://komnottra-backend.onrender.com"; // Fallback backend URL
}

/* ------------------------------------------------------------------
   Element selectors
------------------------------------------------------------------ */
const viewTab = document.getElementById("viewTab");
const viewSection = document.getElementById("viewSection");
const articlesList = document.getElementById("articlesList");
const categoryNav = document.getElementById("categoryNav");
const logo = document.querySelector(".logo");

/* ------------------------------------------------------------------
   State
------------------------------------------------------------------ */
let articleData = [];
let filteredArticles = [];
let currentCategoryFilter = null;

/* ------------------------------------------------------------------
   Helpers: fetches
------------------------------------------------------------------ */
async function fetchArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`);
    articleData = await res.json();
    articleData.forEach((a, i) => { if (!a.id) a.id = i + 1; });
    return articleData;
  } catch (err) {
    console.error("Failed to fetch articles", err);
    return [];
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch categories", err);
    return [];
  }
}

/* ------------------------------------------------------------------
   Category helpers (nav + buttons)
------------------------------------------------------------------ */
async function refreshCategoryNav() {
  const categories = await fetchCategories();
  displayCategoryNav(categories);
}

function displayCategoryNav(categories) {
  if (!categoryNav) return;
  categoryNav.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "ព័ត៌មានចម្រុះ";
  allBtn.classList.add("category-btn");
  if (!currentCategoryFilter) allBtn.classList.add("active");
  allBtn.onclick = () => { currentCategoryFilter = null; displayArticles(); updateCategoryNavActive(); };
  categoryNav.appendChild(allBtn);

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.classList.add("category-btn");
    if (cat === currentCategoryFilter) btn.classList.add("active");
    btn.onclick = () => { currentCategoryFilter = cat; displayArticles(); updateCategoryNavActive(); };
    categoryNav.appendChild(btn);
  });
}

function updateCategoryNavActive() {
  if (!categoryNav) return;
  categoryNav.querySelectorAll("button").forEach(btn => {
    const active = (btn.textContent === currentCategoryFilter) ||
                   (btn.textContent === "ព័ត៌មានចម្រុះ" && !currentCategoryFilter);
    btn.classList.toggle("active", active);
  });
}

/* ------------------------------------------------------------------
   Display articles
------------------------------------------------------------------ */
async function displayArticles() {
  if (!articlesList) return;
  articlesList.innerHTML = "";

  await fetchArticles();

  filteredArticles = currentCategoryFilter
    ? articleData.filter(a => a.category === currentCategoryFilter)
    : [...articleData];

  if (!filteredArticles.length) {
    articlesList.innerHTML = "<p>No articles available.</p>";
    return;
  }

  filteredArticles.forEach(article => {
    const div = document.createElement("div");
    div.className = "article-preview";
    div.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <div class="article-title">${article.title}</div>
      ${article.category ? `<div class="article-category">${article.category}</div>` : ""}
    `;
    div.onclick = () => (window.location.href = `article.html?id=${article.id}`);
    articlesList.appendChild(div);
  });

  updateCategoryNavActive();
}

/* ------------------------------------------------------------------
   Logo hover / click
------------------------------------------------------------------ */
if (logo) {
  logo.addEventListener("mouseenter", () => {
    logo.src = logo.getAttribute("data-animated");
  });
  logo.addEventListener("mouseleave", () => {
    logo.src = logo.getAttribute("data-static");
  });
  logo.addEventListener("click", () => {
    if (viewTab) viewTab.click(); // Navigate to view tab on logo click
  });
}

/* ------------------------------------------------------------------
   Tab / menu logic
------------------------------------------------------------------ */
const isViewPage = /view\.html$/.test(location.pathname) || location.pathname === "/view.html";

if (viewTab && viewSection) {
  viewTab.addEventListener("click", async () => {
    if (!isViewPage) {
      location.href = "view.html#view";
      return;
    }
    viewTab.classList.add("active");
    viewSection.classList.add("active");
    currentCategoryFilter = null;
    await displayArticles();
  });
}

/* ------------------------------------------------------------------
   On load
------------------------------------------------------------------ */
window.onload = async () => {
  await refreshCategoryNav();

  if (location.hash === "#view") {
    if (viewTab) viewTab.click();
  } else {
    if (viewTab) viewTab.click();
  }
};
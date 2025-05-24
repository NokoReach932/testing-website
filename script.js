/* ------------------------------------------------------------------
   Global configuration
------------------------------------------------------------------ */
if (typeof API_BASE === "undefined") {
  API_BASE = "https://komnottra-backend.onrender.com"; // Fallback backend URL
}

/* ------------------------------------------------------------------
   Element selectors
------------------------------------------------------------------ */
const writeTab            = document.getElementById("writeTab");
const viewTab             = document.getElementById("viewTab");     // “Home” in side-menu
const writeSection        = document.getElementById("writeSection");
const viewSection         = document.getElementById("viewSection");
const form                = document.getElementById("articleForm");
const articlesList        = document.getElementById("articlesList");
const adminArticles       = document.getElementById("adminArticles");
const categoryNav         = document.getElementById("categoryNav");

const createCategoryBtn   = document.getElementById("createCategoryBtn");
const deleteCategoryBtn   = document.getElementById("deleteCategoryBtn");
const newCategoryInput    = document.getElementById("newCategory");
const deleteCategorySelect= document.getElementById("deleteCategorySelect");
const categorySelect      = document.getElementById("categorySelect");
const logo                = document.querySelector(".logo");

// Added: Create a GIF overlay element inside the form or dynamically
let gifOverlay = document.createElement("div");
gifOverlay.style.position = "fixed";
gifOverlay.style.top = "0";
gifOverlay.style.left = "0";
gifOverlay.style.width = "100%";
gifOverlay.style.height = "100%";
gifOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
gifOverlay.style.display = "flex";
gifOverlay.style.justifyContent = "center";
gifOverlay.style.alignItems = "center";
gifOverlay.style.zIndex = "1000";
gifOverlay.style.display = "none";

const loadingImg = document.createElement("img");
loadingImg.src = "loading.gif";  // Ensure you have this file in your assets
loadingImg.alt = "Loading...";
loadingImg.style.width = "100px";
loadingImg.style.height = "100px";

const successImg = document.createElement("img");
successImg.src = "success.gif";  // Ensure you have this file in your assets
successImg.alt = "Success!";
successImg.style.width = "100px";
successImg.style.height = "100px";

gifOverlay.appendChild(loadingImg);
document.body.appendChild(gifOverlay);

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
    if (viewTab) viewTab.click();     // same behaviour as “Home”
  });
}

/* ------------------------------------------------------------------
   State
------------------------------------------------------------------ */
// Restore isAdmin state from localStorage on page load
let isAdmin = localStorage.getItem("isAdmin") === "true";
const adminUsername       = "admin";
const adminPassword       = "123";

let articleData           = [];
let filteredArticles      = [];
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

async function saveArticleToBackend(article) {
  try {
    const res = await fetch(`${API_BASE}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to save article", err);
  }
}

async function deleteArticleFromBackend(id) {
  try {
    const res = await fetch(`${API_BASE}/articles/${id}`, { method: "DELETE" });
    return await res.json();
  } catch (err) {
    console.error("Failed to delete article", err);
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
   Category helpers (nav + dropdowns)
------------------------------------------------------------------ */
async function refreshCategoryDropdowns() {
  const categories = await fetchCategories();

  if (categorySelect)       categorySelect.innerHTML       = `<option value="" disabled selected>Select Category (Optional)</option>`;
  if (deleteCategorySelect) deleteCategorySelect.innerHTML = `<option disabled selected>Select Category to Delete</option>`;

  categories.forEach(cat => {
    if (categorySelect) {
      const o1 = new Option(cat, cat);
      categorySelect.appendChild(o1);
    }
    if (deleteCategorySelect) {
      const o2 = new Option(cat, cat);
      deleteCategorySelect.appendChild(o2);
    }
  });

  if (categoryNav) displayCategoryNav(categories);
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
   Admin category create / delete (with null-checks)
------------------------------------------------------------------ */
if (createCategoryBtn) {
  createCategoryBtn.onclick = async () => {
    if (!newCategoryInput) return;
    const newCat = newCategoryInput.value.trim();
    if (!newCat) { alert("Please enter a category name."); return; }

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ category: newCat }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Failed to create category");
      } else {
        alert("Category created!");
        newCategoryInput.value = "";
        await refreshCategoryDropdowns();
      }
    } catch (err) {
      console.error(err);
      alert("Error creating category");
    }
  };
}

if (deleteCategoryBtn) {
  deleteCategoryBtn.onclick = async () => {
    if (!deleteCategorySelect) return;
    const selected = deleteCategorySelect.value;
    if (!selected) { alert("Please select a category."); return; }
    if (!confirm(`Delete category "${selected}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(selected)}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Failed to delete");
      } else {
        alert("Category deleted.");
        await refreshCategoryDropdowns();
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting category");
    }
  };
}

/* ------------------------------------------------------------------
   Article list / admin list
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

function displayAdminArticles() {
  if (!adminArticles) return;
  adminArticles.innerHTML = "";
  articleData.forEach(a => {
    const d = document.createElement("div");
    d.innerHTML = `<hr><strong>${a.title}</strong>
                   <button class="delete-btn" onclick="deleteArticle(${a.id})">Delete</button>`;
    adminArticles.appendChild(d);
  });
}

window.deleteArticle = async id => {
  if (!isAdmin) return;
  if (!confirm("Are you sure?")) return;
  await deleteArticleFromBackend(id);
  alert("Deleted.");
  await fetchArticles();
  await displayArticles();
  displayAdminArticles();
};

/* ------------------------------------------------------------------
   Helper utilities
------------------------------------------------------------------ */
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------
   Tab / menu logic
------------------------------------------------------------------ */
const isIndexPage = /index\.html$/.test(location.pathname) || location.pathname === "/" || location.pathname === "";

if (viewTab && writeTab && viewSection && writeSection) {
  /* Home (viewTab) — new logic: redirect to index if not already there */
  viewTab.addEventListener("click", async () => {
    if (!isIndexPage) {
      location.href = "index.html#view";
      return;
    }
    viewTab.classList.add("active");
    writeTab.classList.remove("active");
    viewSection.classList.add("active");
    writeSection.classList.remove("active");
    history.pushState({ section: "view" }, "View Articles", "#view");
    currentCategoryFilter = null;
    await displayArticles();
  });

  /* Admin Write — prompt login first on ANY page, then redirect or switch tab */
  writeTab.addEventListener("click", async () => {
    if (!isAdmin) {
      const u = prompt("Enter admin username:");
      const p = prompt("Enter admin password:");
      if (u === adminUsername && p === adminPassword) {
        isAdmin = true;
        localStorage.setItem("isAdmin", "true");   // Persist login state
        alert("Welcome, Admin!");
      } else {
        alert("Incorrect credentials.");
        return; // Stop here if login failed
      }
    }

    if (!isIndexPage) {
      // After successful login, persist state and redirect to index page #write
      localStorage.setItem("isAdmin", "true");
      location.href = "index.html#write";
      return;
    }

    // Already on index page, just switch tabs
    writeTab.classList.add("active");
    viewTab.classList.remove("active");
    writeSection.classList.add("active");
    viewSection.classList.remove("active");
    history.pushState({ section: "write" }, "Write Article", "#write");
    currentCategoryFilter = null;
    await fetchArticles();
    displayAdminArticles();
  });
}

/* ------------------------------------------------------------------
   Article submission with GIF overlay
------------------------------------------------------------------ */
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const title   = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const file    = document.getElementById("imageUpload").files[0];
    if (!title || !content) { alert("Title and content are required."); return; }

    // Show loading GIF overlay
    successImg.style.display = "none";
    loadingImg.style.display = "block";
    gifOverlay.style.display = "flex";

    const image = file ? await convertImageToBase64(file) : "";
    const category = categorySelect ? categorySelect.value : "";

    const newArticle = {
      title, content, image, category,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveArticleToBackend(newArticle);
      // Show success GIF after save
      loadingImg.style.display = "none";
      successImg.style.display = "block";

      // Wait 1.5 seconds to show success GIF, then reset form and hide overlay
      setTimeout(() => {
        gifOverlay.style.display = "none";
        form.reset();
        fetchArticles().then(() => {
          displayAdminArticles();
          if (writeTab) writeTab.click();
        });
      }, 1500);
    } catch (err) {
      alert("Failed to save article. Please try again.");
      gifOverlay.style.display = "none";
    }
  });
}

/* ------------------------------------------------------------------
   On load
------------------------------------------------------------------ */
window.addEventListener("DOMContentLoaded", async () => {
  await refreshCategoryDropdowns();
  await fetchArticles();

  const isWriteView = location.hash === "#write";

  if (isWriteView) {
    if (!isAdmin) {
      const u = prompt("Enter admin username:");
      const p = prompt("Enter admin password:");
      if (u === adminUsername && p === adminPassword) {
        isAdmin = true;
        localStorage.setItem("isAdmin", "true");
        alert("Welcome, Admin!");
      } else {
        alert("Incorrect credentials.");
        location.hash = "#view";
        writeSection?.classList.remove("active");
        viewSection?.classList.add("active");
        displayArticles();
        return;
      }
    }

    // Directly activate admin view
    writeSection?.classList.add("active");
    viewSection?.classList.remove("active");
    displayAdminArticles();
  } else {
    // Default to view
    viewSection?.classList.add("active");
    writeSection?.classList.remove("active");
    displayArticles();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await refreshCategoryDropdowns();   // Loads category buttons
  await displayArticles();            // Displays articles initially
});

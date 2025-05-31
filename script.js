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

const cancelEditBtn       = document.getElementById("cancelEditBtn"); // New: cancel edit button

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

let editingArticleId = null; // New: track article editing mode

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
    const baseUrl = API_BASE || "https://komnottra-backend.onrender.com";

    // Use article.imageUrl, prepend baseUrl if relative path
    const fullImageUrl = article.imageUrl
      ? (article.imageUrl.startsWith("http") ? article.imageUrl : baseUrl + article.imageUrl)
      : null;

    const div = document.createElement("div");
    div.className = "article-preview";
    div.innerHTML = `
      ${fullImageUrl ? `<img src="${fullImageUrl}" alt="Article Image">` : ""}
      <div class="article-title">${article.title}</div>
      ${article.category ? `<div class="article-category">${
  Array.isArray(article.category) ? [...new Set(article.category)].join(", ") : article.category
}</div>` : ""}

    `;
    div.onclick = () => (window.location.href = `article.html?slug=${article.slug}`);
    articlesList.appendChild(div);
  });

  updateCategoryNavActive();
}

function displayAdminArticles() {
  if (!adminArticles) return;
  adminArticles.innerHTML = "";
  articleData.forEach(a => {
    const d = document.createElement("div");
    d.innerHTML = `
      <hr>
      <strong>${a.title}</strong>
      <button class="edit-btn" onclick="startEditingArticle(${a.id})">Edit</button>  <!-- New edit button -->
      <button class="delete-btn" onclick="deleteArticle(${a.id})">Delete</button>
    `;
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

// === New: Hide admin tab by default, show if URL contains ?admin=1
if (writeTab) {
  writeTab.style.display = "none";
}
if (window.location.search.includes("admin=1")) {
  if (writeTab) {
    writeTab.style.display = "block";
  }
}

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
    history.pushState({ section: "view" }, "Home", "#view");
    await displayArticles();
  });

  /* Write (admin) */
  writeTab.addEventListener("click", async () => {
    writeTab.classList.add("active");
    viewTab.classList.remove("active");
    writeSection.classList.add("active");
    viewSection.classList.remove("active");
    history.pushState({ section: "write" }, "Write Article", "#write");
    await fetchArticles();
    displayAdminArticles();
    if (cancelEditBtn) cancelEditBtn.style.display = "none"; // Reset cancel button visibility
  });

  window.addEventListener("popstate", (event) => {
    const state = event.state;
    if (state?.section === "write") {
      writeTab.click();
    } else {
      viewTab.click();
    }
  });
}

/* ------------------------------------------------------------------
   Start editing article: loads article data into form for editing
------------------------------------------------------------------ */
window.startEditingArticle = async (id) => {
  const article = articleData.find(a => a.id === id);
  if (!article) {
    alert("Article not found.");
    return;
  }

  editingArticleId = id;

  document.getElementById("title").value = article.title || "";
  document.getElementById("content").value = article.content || "";
  if (categorySelect) categorySelect.value = article.category || "";

  // Reset image file input so user can upload new image if wanted
  const imageInput = document.getElementById("imageUpload");
  if (imageInput) imageInput.value = "";

  // Show cancel edit button
  if (cancelEditBtn) cancelEditBtn.style.display = "inline-block";

  // Switch to Write tab and update UI accordingly
  if (writeTab && viewTab && writeSection && viewSection) {
    writeTab.classList.add("active");
    viewTab.classList.remove("active");
    writeSection.classList.add("active");
    viewSection.classList.remove("active");
    history.pushState({ section: "write" }, "Edit Article", "#write");
  }
};

/* ------------------------------------------------------------------
   Form submit handler: creates or updates article
------------------------------------------------------------------ */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const file = document.getElementById("imageUpload").files[0];
  const category = categorySelect ? categorySelect.value : null;

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  successImg.style.display = "none";
  loadingImg.style.display = "block";
  gifOverlay.style.display = "flex";

  try {
    let response;
    if (editingArticleId !== null) {
      // Edit existing article
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (category) formData.append("category", category);
      if (file) formData.append("image", file);

      response = await fetch(`${API_BASE}/articles/${editingArticleId}`, {
        method: "PUT",
        body: formData,
      });
    } else {
      // New article
      const formData = new FormData(form);
      response = await fetch(`${API_BASE}/articles`, {
        method: "POST",
        body: formData,
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || "Failed to save article");
      gifOverlay.style.display = "none";
      return;
    }

    loadingImg.style.display = "none";
    successImg.style.display = "block";

    setTimeout(async () => {
      gifOverlay.style.display = "none";
      form.reset();
      editingArticleId = null;
      if (cancelEditBtn) cancelEditBtn.style.display = "none";

      await fetchArticles();
      displayAdminArticles();
      if (writeTab) writeTab.click();
    }, 1500);

  } catch (err) {
    alert("Failed to save article. Please try again.");
    gifOverlay.style.display = "none";
  }
});

/* ------------------------------------------------------------------
   Cancel edit button handler
------------------------------------------------------------------ */
if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    editingArticleId = null;
    form.reset();
    cancelEditBtn.style.display = "none";
  });
}

/* ------------------------------------------------------------------
   On page load
------------------------------------------------------------------ */
(async () => {
  await refreshCategoryDropdowns();
  await fetchArticles();
  await displayArticles();
})();

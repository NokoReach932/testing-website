const API_BASE = "https://komnottra-backend.onrender.com";

const writeTab             = document.getElementById("writeTab");
const viewTab              = document.getElementById("viewTab");
const writeSection         = document.getElementById("writeSection");
const viewSection          = document.getElementById("viewSection");
const form                 = document.getElementById("articleForm");
const articlesList         = document.getElementById("articlesList");
const adminArticles        = document.getElementById("adminArticles");
const categoryNav          = document.getElementById("categoryNav");
const createCategoryBtn    = document.getElementById("createCategoryBtn");
const deleteCategoryBtn    = document.getElementById("deleteCategoryBtn");
const newCategoryInput     = document.getElementById("newCategory");
const deleteCategorySelect = document.getElementById("deleteCategorySelect");
const categorySelect       = document.getElementById("categorySelect");

let isAdmin = localStorage.getItem("isAdmin") === "true";
const adminUsername = "admin";
const adminPassword = "123";

let articleData = [];
let currentCategoryFilter = null;

async function fetchArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`);
    articleData = await res.json();
    articleData.forEach((a, i) => { if (!a.id) a.id = i + 1; });
    return articleData;
  } catch {
    return [];
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    return await res.json();
  } catch {
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
    console.error(err);
  }
}

async function deleteArticleFromBackend(id) {
  try {
    const res = await fetch(`${API_BASE}/articles/${id}`, { method: "DELETE" });
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}

async function refreshCategoryDropdowns() {
  const categories = await fetchCategories();

  if (categorySelect) {
    categorySelect.innerHTML = `<option value="" disabled selected>Select Category (Optional)</option>`;
    categories.forEach(cat => categorySelect.appendChild(new Option(cat, cat)));
  }
  if (deleteCategorySelect) {
    deleteCategorySelect.innerHTML = `<option disabled selected>Select Category to Delete</option>`;
    categories.forEach(cat => deleteCategorySelect.appendChild(new Option(cat, cat)));
  }

  if (categoryNav) {
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
}

function updateCategoryNavActive() {
  if (!categoryNav) return;
  categoryNav.querySelectorAll("button").forEach(btn => {
    const active = (btn.textContent === currentCategoryFilter) ||
                   (btn.textContent === "ព័ត៌មានចម្រុះ" && !currentCategoryFilter);
    btn.classList.toggle("active", active);
  });
}

async function displayArticles() {
  if (!articlesList) return;
  articlesList.innerHTML = "";
  await fetchArticles();

  const filtered = currentCategoryFilter
    ? articleData.filter(a => a.category === currentCategoryFilter)
    : articleData;

  if (!filtered.length) {
    articlesList.innerHTML = "<p>No articles available.</p>";
    return;
  }

  filtered.forEach(article => {
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
    d.innerHTML = `<hr><strong>${a.title}</strong> <button onclick="deleteArticle(${a.id})">Delete</button>`;
    adminArticles.appendChild(d);
  });
}

window.deleteArticle = async id => {
  if (!isAdmin) return;
  if (!confirm("Are you sure?")) return;
  await deleteArticleFromBackend(id);
  alert("Deleted.");
  await fetchArticles();
  displayAdminArticles();
};

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* --- Page-specific logic --- */

if (viewSection && articlesList && categoryNav && viewTab) {
  // index.html (View page)

  window.onload = async () => {
    await refreshCategoryDropdowns();
    await displayArticles();
  };

  viewTab.addEventListener("click", async () => {
    currentCategoryFilter = null;
    await displayArticles();
  });

  writeTab?.addEventListener("click", () => {
    location.href = "write.html";
  });
}

if (writeSection && form && createCategoryBtn && deleteCategoryBtn && categorySelect) {
  // write.html (Write/Admin page)

  window.onload = async () => {
    await refreshCategoryDropdowns();
    if (!isAdmin) {
      const u = prompt("Enter admin username:");
      const p = prompt("Enter admin password:");
      if (u === adminUsername && p === adminPassword) {
        isAdmin = true;
        localStorage.setItem("isAdmin", "true");
        alert("Welcome, Admin!");
      } else {
        alert("Incorrect credentials. Redirecting to home.");
        location.href = "index.html";
        return;
      }
    }

    await fetchArticles();
    displayAdminArticles();
  };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const file = document.getElementById("imageUpload").files[0];
    if (!title || !content) {
      alert("Title and content are required.");
      return;
    }

    let image = "";
    if (file) {
      image = await convertImageToBase64(file);
    }

    const category = categorySelect.value || "";

    const newArticle = {
      title,
      content,
      image,
      category,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveArticleToBackend(newArticle);
      alert("Article saved!");
      form.reset();
      await fetchArticles();
      displayAdminArticles();
    } catch {
      alert("Failed to save article.");
    }
  });

  createCategoryBtn.onclick = async () => {
    const newCat = newCategoryInput.value.trim();
    if (!newCat) {
      alert("Please enter a category name.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCat }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Failed to create category");
      } else {
        alert("Category created!");
        newCategoryInput.value = "";
        await refreshCategoryDropdowns();
      }
    } catch {
      alert("Error creating category");
    }
  };

  deleteCategoryBtn.onclick = async () => {
    const selected = deleteCategorySelect.value;
    if (!selected) {
      alert("Please select a category.");
      return;
    }
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
    } catch {
      alert("Error deleting category");
    }
  };

  viewTab?.addEventListener("click", () => {
    location.href = "index.html";
  });
}

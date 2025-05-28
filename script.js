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
const viewTab             = document.getElementById("viewTab");
const writeSection        = document.getElementById("writeSection");
const viewSection         = document.getElementById("viewSection");
const articlesList        = document.getElementById("articlesList");
const adminArticles       = document.getElementById("adminArticles");
const categoryNav         = document.getElementById("categoryNav");
const form                = document.getElementById('articleForm');

const createCategoryBtn   = document.getElementById("createCategoryBtn");
const deleteCategoryBtn   = document.getElementById("deleteCategoryBtn");
const newCategoryInput    = document.getElementById("newCategory");
const deleteCategorySelect= document.getElementById("deleteCategorySelect");
const categorySelect      = document.getElementById("categorySelect");
const logo                = document.querySelector(".logo");

const menuToggle          = document.getElementById('menuToggle');
const sideMenu            = document.getElementById('sideMenu');
const overlay             = document.getElementById('overlay');

const backupBtn           = document.getElementById('backupBtn');
const restoreBtn          = document.getElementById('restoreBtn');
const restoreInput        = document.getElementById('restoreInput');
const backupRestoreStatus = document.getElementById('backupRestoreStatus');

const loadingGif          = document.getElementById('loadingGif');
const successGif          = document.getElementById('successGif');
const gifContainer        = document.getElementById('gifContainer');

/* ------------------------------------------------------------------
   Logo hover / click
------------------------------------------------------------------ */
if (logo) {
  logo.addEventListener("mouseleave", () => {
    logo.src = logo.getAttribute("data-static");
  });
  logo.addEventListener("click", () => {
    if (viewTab) viewTab.click();
  });
}

/* ------------------------------------------------------------------
   State
------------------------------------------------------------------ */
let isAdmin = localStorage.getItem("isAdmin") === "true";
const adminUsername       = "admin";
const adminPassword       = "123";

let articleData           = [];
let filteredArticles      = [];
let currentCategoryFilter = null;

/* ------------------------------------------------------------------
   Menu toggle and overlay
------------------------------------------------------------------ */
if (menuToggle && sideMenu && overlay) {
  menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    overlay.classList.remove('active');
  });

  document.querySelectorAll('#sideMenu button').forEach(button => {
    button.addEventListener('click', () => {
      sideMenu.classList.remove('open');
      overlay.classList.remove('active');
    });
  });
}

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
      if (!res.ok) throw new Error("Failed to create category");
      newCategoryInput.value = "";
      await refreshCategoryDropdowns();
      alert(`Category "${newCat}" created.`);
    } catch (err) {
      alert("Error creating category: " + err.message);
    }
  };
}

if (deleteCategoryBtn && deleteCategorySelect) {
  deleteCategoryBtn.onclick = async () => {
    const catToDelete = deleteCategorySelect.value;
    if (!catToDelete) { alert("Please select a category to delete."); return; }
    if (!confirm(`Are you sure you want to delete category "${catToDelete}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(catToDelete)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      await refreshCategoryDropdowns();
      alert(`Category "${catToDelete}" deleted.`);
    } catch (err) {
      alert("Error deleting category: " + err.message);
    }
  };
}

/* ------------------------------------------------------------------
   Article display
------------------------------------------------------------------ */
function displayArticles() {
  if (!articlesList) return;

  // Filter articles by category if applicable
  filteredArticles = currentCategoryFilter
    ? articleData.filter(a => a.category === currentCategoryFilter)
    : articleData;

  // Clear list
  articlesList.innerHTML = "";

  if (filteredArticles.length === 0) {
    articlesList.innerHTML = "<p>No articles found.</p>";
    return;
  }

  // Sort newest first
  filteredArticles.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  filteredArticles.forEach(article => {
    const div = document.createElement("div");
    div.className = "article";

    let imgHTML = "";
    if (article.imageUrl) {
      imgHTML = `<img src="${article.imageUrl}" alt="Article image" class="article-image" />`;
    }

    div.innerHTML = `
      <h2>${article.title}</h2>
      <p><em>${article.createdAt ? new Date(article.createdAt).toLocaleString() : ''}</em></p>
      ${imgHTML}
      <p>${article.content}</p>
      <p><strong>Category:</strong> ${article.category || 'None'}</p>
    `;

    articlesList.appendChild(div);
  });
}

/* ------------------------------------------------------------------
   Admin: Display admin articles with edit/delete
------------------------------------------------------------------ */
function displayAdminArticles() {
  if (!adminArticles) return;
  adminArticles.innerHTML = "";

  if (!isAdmin) {
    adminArticles.innerHTML = "<p>Please log in as admin to manage articles.</p>";
    return;
  }

  // Sort articles newest first
  const sorted = [...articleData].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  sorted.forEach(article => {
    const div = document.createElement("div");
    div.className = "admin-article";

    div.innerHTML = `
      <h3>${article.title}</h3>
      <p><em>${article.createdAt ? new Date(article.createdAt).toLocaleString() : ''}</em></p>
      <p>${article.content}</p>
      <p><strong>Category:</strong> ${article.category || 'None'}</p>
      <button class="deleteArticleBtn" data-id="${article.id}">Delete</button>
    `;

    adminArticles.appendChild(div);
  });

  // Add event listeners for delete buttons
  adminArticles.querySelectorAll(".deleteArticleBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      if (confirm("Delete this article?")) {
        try {
          await deleteArticleFromBackend(id);
          await loadAndDisplayArticles();
          alert("Article deleted.");
        } catch (err) {
          alert("Error deleting article: " + err.message);
        }
      }
    });
  });
}

/* ------------------------------------------------------------------
   Load articles and refresh views
------------------------------------------------------------------ */
async function loadAndDisplayArticles() {
  articleData = await fetchArticles();
  displayArticles();
  displayAdminArticles();
  await refreshCategoryDropdowns();
  updateCategoryNavActive();
}

/* ------------------------------------------------------------------
   Article Form submission with GIF loading and success
------------------------------------------------------------------ */
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    gifContainer.style.display = 'flex';
    loadingGif.style.display = 'block';
    successGif.style.display = 'none';

    try {
      // If image upload is used, send as FormData (multipart)
      const response = await fetch(`${API_BASE}/articles`, {
        method: 'POST',
        body: formData,  // browser sets content-type automatically
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Optional delay

      loadingGif.style.display = 'none';
      successGif.style.display = 'block';

      setTimeout(() => {
        gifContainer.style.display = 'none';
      }, 2000);

      form.reset();

      await loadAndDisplayArticles();
    } catch (error) {
      alert("Error publishing article: " + error.message);
      gifContainer.style.display = 'none';
    }
  });
}

/* ------------------------------------------------------------------
   Backup and restore buttons
------------------------------------------------------------------ */
if (backupBtn && restoreBtn && restoreInput && backupRestoreStatus) {
  backupBtn.addEventListener('click', () => {
    backupRestoreStatus.style.color = 'black';
    backupRestoreStatus.textContent = 'Preparing backup...';
    fetch(`${API_BASE}/admin/backup`)
      .then(res => {
        if (!res.ok) throw new Error('Backup failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        backupRestoreStatus.style.color = 'green';
        backupRestoreStatus.textContent = 'Backup downloaded successfully.';
      })
      .catch(err => {
        backupRestoreStatus.style.color = 'red';
        backupRestoreStatus.textContent = 'Backup error: ' + err.message;
      });
  });

  restoreBtn.addEventListener('click', () => {
    restoreInput.click();
  });

  restoreInput.addEventListener('change', () => {
    const file = restoreInput.files[0];
    if (!file) return;

    backupRestoreStatus.style.color = 'black';
    backupRestoreStatus.textContent = 'Uploading backup...';

    const formData = new FormData();
    formData.append('backup', file);

    fetch(`${API_BASE}/admin/restore`, {
      method: 'POST',
      body: formData,
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        backupRestoreStatus.style.color = 'green';
        backupRestoreStatus.textContent = 'Restore: ' + data.message;
      } else {
        backupRestoreStatus.style.color = 'green';
        backupRestoreStatus.textContent = 'Restore completed successfully.';
      }
    })
    .catch(err => {
      backupRestoreStatus.style.color = 'red';
      backupRestoreStatus.textContent = 'Restore error: ' + err.message;
    });
  });
}

/* ------------------------------------------------------------------
   Tab switching
------------------------------------------------------------------ */
if (writeTab && viewTab && writeSection && viewSection) {
  writeTab.addEventListener("click", () => {
    writeSection.classList.add("active");
    viewSection.classList.remove("active");
  });

  viewTab.addEventListener("click", () => {
    viewSection.classList.add("active");
    writeSection.classList.remove("active");
  });
}

/* ------------------------------------------------------------------
   Initialize page on load
------------------------------------------------------------------ */
window.addEventListener("load", async () => {
  await loadAndDisplayArticles();
});

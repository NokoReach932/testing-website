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
const writeSection        = document.getElementById("writeSection");
const form                = document.getElementById("articleForm");
const adminArticles       = document.getElementById("adminArticles");
const createCategoryBtn   = document.getElementById("createCategoryBtn");
const deleteCategoryBtn   = document.getElementById("deleteCategoryBtn");
const newCategoryInput    = document.getElementById("newCategory");
const deleteCategorySelect= document.getElementById("deleteCategorySelect");
const categorySelect      = document.getElementById("categorySelect");
const logo                = document.querySelector(".logo");

/* ------------------------------------------------------------------
   State
------------------------------------------------------------------ */
let isAdmin = localStorage.getItem("isAdmin") === "true";
const adminUsername = "admin";
const adminPassword = "123";

let articleData = [];
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
   Category helpers (dropdowns)
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
}

/* ------------------------------------------------------------------
   Admin category create / delete
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
   Admin article list and delete
------------------------------------------------------------------ */
async function displayAdminArticles() {
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
   Article submission with GIF overlay
------------------------------------------------------------------ */
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
loadingImg.src = "loading.gif";
loadingImg.alt = "Loading...";
loadingImg.style.width = "100px";
loadingImg.style.height = "100px";

const successImg = document.createElement("img");
successImg.src = "success.gif";
successImg.alt = "Success!";
successImg.style.width = "100px";
successImg.style.height = "100px";

gifOverlay.appendChild(loadingImg);
document.body.appendChild(gifOverlay);

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const title   = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const file    = document.getElementById("imageUpload").files[0];
    if (!title || !content) { alert("Title and content are required."); return; }

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
      loadingImg.style.display = "none";
      successImg.style.display = "block";

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
   Tab logic and admin login
------------------------------------------------------------------ */
const isWritePage = /write\.html$/.test(location.pathname) || location.pathname === "/write.html";

if (writeTab && writeSection) {
  writeTab.addEventListener("click", async () => {
    if (!isAdmin) {
      const u = prompt("Enter admin username:");
      const p = prompt("Enter admin password:");
      if (u === adminUsername && p === adminPassword) {
        isAdmin = true;
        localStorage.setItem("isAdmin", "true");
        alert("Welcome, Admin!");
      } else {
        alert("Incorrect credentials.");
        return;
      }
    }

    if (!isWritePage) {
      localStorage.setItem("isAdmin", "true");
      location.href = "write.html#write";
      return;
    }

    writeTab.classList.add("active");
    writeSection.classList.add("active");
    currentCategoryFilter = null;
    await fetchArticles();
    displayAdminArticles();
  });
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
    if (writeTab) writeTab.click();
  });
}

/* ------------------------------------------------------------------
   On load
------------------------------------------------------------------ */
window.onload = async () => {
  await refreshCategoryDropdowns();

  if (location.hash === "#write") {
    if (writeTab) writeTab.click();
  }
};
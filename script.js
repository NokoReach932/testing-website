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
  const rawCategories = await fetchCategories();
  const categories = [...new Set(rawCategories)];  // Remove duplicates

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
    ? articleData.filter(article => {
        let categories = [];

        if (article.category) {
          if (Array.isArray(article.category)) {
            categories = [...new Set(article.category.map(c => c.trim()))];
          } else if (typeof article.category === "string") {
            categories = article.category.split(",").map(c => c.trim());
          }
        }

        return categories.includes(currentCategoryFilter);
      })
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

    // Clean and deduplicate categories
    let cleanCategory = "";
    if (article.category && typeof article.category === "string") {
      const categories = article.category.split(",").map(c => c.trim());
      const uniqueCategories = [...new Set(categories)];
      cleanCategory = uniqueCategories.join(", ");
    } else if (Array.isArray(article.category)) {
      // If category is an array, deduplicate and join
      const uniqueCategories = [...new Set(article.category.map(c => c.trim()))];
      cleanCategory = uniqueCategories.join(", ");
    } else if (article.category) {
      // If category is something else (like a single value), convert to string
      cleanCategory = String(article.category);
    }

    const categoryHtml = cleanCategory ? `<div class="article-category">ប្រភេទព័ត៌មាន: ${cleanCategory}</div>` : "";

    const div = document.createElement("div");
    div.className = "article-preview";
    div.innerHTML = `
      ${fullImageUrl ? `<img src="${fullImageUrl}" alt="Article Image">` : ""}
      <div class="article-title">${article.title}</div>
      ${categoryHtml}
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
   Article submit handler (with gif overlay and category fix)
------------------------------------------------------------------ */
if (form) {
  form.onsubmit = async e => {
    e.preventDefault();

    // Show loading GIF overlay
    loadingImg.style.display = "block";
    if (gifOverlay) {
      gifOverlay.style.display = "flex";
      successImg.style.display = "none";
      if (!gifOverlay.contains(loadingImg)) gifOverlay.appendChild(loadingImg);
      if (gifOverlay.contains(successImg)) gifOverlay.removeChild(successImg);
    }

    // Construct form data
    const formData = new FormData(form);

    // Fix category: send as JSON stringified array
    if (categorySelect && categorySelect.value) {
      formData.set("category", JSON.stringify([categorySelect.value]));
    }

    // Handle image conversion (optional, depends on your backend)
    if (form.image && form.image.files.length > 0) {
      const base64 = await convertImageToBase64(form.image.files[0]);
      formData.set("imageBase64", base64);
    }

    try {
      // Convert FormData to JSON to send properly
      const obj = {};
      formData.forEach((value, key) => {
        obj[key] = value;
      });

      // Send to backend
      const res = await fetch(`${API_BASE}/articles`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(obj),
      });

      if (!res.ok) {
        alert("Failed to submit article.");
        throw new Error("Submission failed");
      }

      // Show success GIF overlay for 3 seconds then hide
      if (gifOverlay) {
        loadingImg.style.display = "none";
        if (!gifOverlay.contains(successImg)) gifOverlay.appendChild(successImg);
        successImg.style.display = "block";
      }

      await new Promise(r => setTimeout(r, 3000));
      if (gifOverlay) gifOverlay.style.display = "none";

      alert("Article submitted successfully!");

      // Reset form and reload articles
      form.reset();
      await fetchArticles();
      await displayArticles();
      displayAdminArticles();

    } catch (err) {
      console.error(err);
      alert("Error submitting article.");
      if (gifOverlay) gifOverlay.style.display = "none";
    }
  };
}

/* ------------------------------------------------------------------
   Admin login/logout
------------------------------------------------------------------ */
if (writeTab) {
  writeTab.onclick = () => {
    if (!isAdmin) {
      const username = prompt("Enter admin username:");
      if (username !== adminUsername) {
        alert("Wrong username");
        return;
      }
      const password = prompt("Enter admin password:");
      if (password !== adminPassword) {
        alert("Wrong password");
        return;
      }
      isAdmin = true;
      localStorage.setItem("isAdmin", "true");
      alert("Welcome admin!");
      showAdminFeatures();
    } else {
      if (confirm("Logout admin?")) {
        isAdmin = false;
        localStorage.setItem("isAdmin", "false");
        hideAdminFeatures();
      }
    }
  };
}

/* ------------------------------------------------------------------
   Show / hide admin features
------------------------------------------------------------------ */
function showAdminFeatures() {
  if (writeSection) writeSection.style.display = "block";
  if (viewSection) viewSection.style.display = "block";
  if (adminArticles) adminArticles.style.display = "block";
  if (categoryNav) categoryNav.style.display = "block";
  if (form) form.style.display = "block";
  refreshCategoryDropdowns();
  displayArticles();
  displayAdminArticles();
}

function hideAdminFeatures() {
  if (writeSection) writeSection.style.display = "none";
  if (adminArticles) adminArticles.style.display = "none";
  if (categoryNav) categoryNav.style.display = "none";
  if (form) form.style.display = "none";
  displayArticles();
}

/* ------------------------------------------------------------------
   Initialize page on load
------------------------------------------------------------------ */
window.onload = () => {
  refreshCategoryDropdowns();
  displayArticles();

  if (isAdmin) {
    showAdminFeatures();
  } else {
    hideAdminFeatures();
  }
};

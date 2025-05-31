/* ------------------------------------------------------------------
   Global configuration
------------------------------------------------------------------ */
if (typeof API_BASE === "undefined") {
  API_BASE = "https://komnottra-backend.onrender.com"; // Fallback backend URL
}

/* ------------------------------------------------------------------
   Element selectors for both pages
------------------------------------------------------------------ */
const logo = document.querySelector(".logo");

/* ------------------------------------------------------------------
   Page detection
------------------------------------------------------------------ */
const isIndexPage = /index\.html$/.test(location.pathname) || location.pathname === "/" || location.pathname === "";
const isAdminPage = /admin\.html$/.test(location.pathname);

/* ------------------------------------------------------------------
   Common logo behavior (on both pages)
------------------------------------------------------------------ */
if (logo) {
  logo.addEventListener("mouseleave", () => {
    logo.src = logo.getAttribute("data-static");
  });
  logo.addEventListener("click", () => {
    if (isIndexPage) {
      location.href = "index.html#view";
    } else {
      location.href = "index.html"; // Or wherever you want logo to redirect
    }
  });
}

/* ------------------------------------------------------------------
   INDEX.HTML specific logic (tabs, articles, categories)
------------------------------------------------------------------ */
if (isIndexPage) {
  // Selectors specific to index.html page
  const writeTab            = document.getElementById("writeTab");
  const viewTab             = document.getElementById("viewTab");
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

  /* -- Admin login state -- */
  let isAdmin = localStorage.getItem("isAdmin") === "true";
  const adminUsername       = "admin";
  const adminPassword       = "123";

  /* -- Rest of your index.html functions & event handlers -- */
  // ... All your existing fetchArticles(), displayArticles(), 
  // adminArticles display, category functions, tab event listeners, etc.

  // For example, your tab event listeners wrapped here:
  if (viewTab && writeTab && viewSection && writeSection) {
    viewTab.addEventListener("click", async () => {
      // same as before
    });

    writeTab.addEventListener("click", async () => {
      // same as before
    });
  }

  // Form submit handler
  if (form) {
    form.addEventListener("submit", async e => {
      // same as before
    });
  }

  // window.onload logic for index page only
  window.onload = async () => {
    await refreshCategoryDropdowns();

    if (location.hash === "#write") {
      if (writeTab) writeTab.click();
    } else {
      if (viewTab) viewTab.click();
    }
  };
}

/* ------------------------------------------------------------------
   ADMIN.HTML specific logic
------------------------------------------------------------------ */
if (isAdminPage) {
  // Selectors specific to admin.html page
  const adminArticles       = document.getElementById("adminArticles");
  const createCategoryBtn   = document.getElementById("createCategoryBtn");
  const deleteCategoryBtn   = document.getElementById("deleteCategoryBtn");
  const newCategoryInput    = document.getElementById("newCategory");
  const deleteCategorySelect= document.getElementById("deleteCategorySelect");
  const categorySelect      = document.getElementById("categorySelect");

  let isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!isAdmin) {
    alert("You must be logged in as admin to access this page.");
    location.href = "index.html"; // redirect if not admin
  }

  // Functions for fetching articles and categories (can reuse from above or define here)
  async function fetchArticles() {
    try {
      const res = await fetch(`${API_BASE}/articles`);
      const data = await res.json();
      return data;
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

  // Display articles in admin panel
  async function displayAdminArticles() {
    if (!adminArticles) return;
    const articles = await fetchArticles();
    adminArticles.innerHTML = "";

    articles.forEach(a => {
      const d = document.createElement("div");
      d.innerHTML = `<hr><strong>${a.title}</strong>
                     <button class="delete-btn" onclick="deleteArticle(${a.id})">Delete</button>`;
      adminArticles.appendChild(d);
    });
  }

  // Delete article handler
  window.deleteArticle = async id => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      alert("Deleted.");
      await displayAdminArticles();
    } catch (err) {
      alert("Error deleting article.");
    }
  };

  // Category management buttons logic here (similar to your original script)
  if (createCategoryBtn) {
    createCategoryBtn.onclick = async () => {
      // similar create category logic
    };
  }

  if (deleteCategoryBtn) {
    deleteCategoryBtn.onclick = async () => {
      // similar delete category logic
    };
  }

  // On admin page load
  window.onload = () => {
    displayAdminArticles();
    refreshCategoryDropdowns();
  };
}

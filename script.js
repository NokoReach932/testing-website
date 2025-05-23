const API_BASE = "https://komnottra-backend.onrender.com"; // Backend URL

// Elements
const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const form = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const adminArticles = document.getElementById("adminArticles");
const categoryNav = document.getElementById("categoryNav");

const createCategoryBtn = document.getElementById("createCategoryBtn");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const newCategoryInput = document.getElementById("newCategory");
const deleteCategorySelect = document.getElementById("deleteCategorySelect");
const categorySelect = document.getElementById("categorySelect");

const logo = document.querySelector(".logo");
const logoImg = document.querySelector(".logo");

const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

// Admin login info & state
const adminUsername = "admin";
const adminPassword = "123";
let isAdmin = false;

let articleData = [];
let filteredArticles = [];
let currentCategoryFilter = null;

// Logo hover animation
logoImg.addEventListener("mouseenter", () => {
  logoImg.src = logoImg.getAttribute("data-animated");
});

logoImg.addEventListener("mouseleave", () => {
  logoImg.src = logoImg.getAttribute("data-static");
});

// Fetch articles from backend
async function fetchArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`);
    articleData = await res.json();
    // Assign IDs if missing
    articleData.forEach((article, idx) => {
      if (!article.id) article.id = idx + 1;
    });
    return articleData;
  } catch (err) {
    console.error("Failed to fetch articles", err);
    return [];
  }
}

// Save article to backend
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

// Delete article from backend
async function deleteArticleFromBackend(id) {
  try {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to delete article", err);
  }
}

// Fetch categories
async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch categories", err);
    return [];
  }
}

// Refresh category dropdowns
async function refreshCategoryDropdowns() {
  const categories = await fetchCategories();

  categorySelect.innerHTML = `<option value="" disabled selected>Select Category (Optional)</option>`;
  deleteCategorySelect.innerHTML = `<option disabled selected>Select Category to Delete</option>`;

  categories.forEach(cat => {
    const option1 = document.createElement("option");
    option1.value = cat;
    option1.textContent = cat;
    categorySelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = cat;
    option2.textContent = cat;
    deleteCategorySelect.appendChild(option2);
  });

  displayCategoryNav(categories);
}

// Display categories as navigation buttons
function displayCategoryNav(categories) {
  categoryNav.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "ព័ត៌មានចម្រុះ"; // Show all (Mixed news)
  allBtn.classList.add("category-btn");
  if (!currentCategoryFilter) allBtn.classList.add("active");
  allBtn.addEventListener("click", () => {
    currentCategoryFilter = null;
    displayArticles();
    updateCategoryNavActive();
  });
  categoryNav.appendChild(allBtn);

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.classList.add("category-btn");
    if (cat === currentCategoryFilter) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentCategoryFilter = cat;
      displayArticles();
      updateCategoryNavActive();
    });
    categoryNav.appendChild(btn);
  });
}

// Update active state for category nav buttons
function updateCategoryNavActive() {
  const buttons = categoryNav.querySelectorAll("button");
  buttons.forEach(btn => {
    if (
      btn.textContent === currentCategoryFilter ||
      (!currentCategoryFilter && btn.textContent === "ព័ត៌មានចម្រុះ")
    ) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Create new category
createCategoryBtn.addEventListener("click", async () => {
  const newCategory = newCategoryInput.value.trim();
  if (!newCategory) {
    alert("Please enter a category name.");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCategory }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Failed to create category");
    } else {
      alert("Category created!");
      newCategoryInput.value = "";
      await refreshCategoryDropdowns();
    }
  } catch (err) {
    console.error("Error creating category", err);
    alert("Error creating category");
  }
});

// Delete selected category
deleteCategoryBtn.addEventListener("click", async () => {
  const selected = deleteCategorySelect.value;
  if (!selected) {
    alert("Please select a category to delete.");
    return;
  }
  if (!confirm(`Delete category "${selected}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(selected)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Failed to delete category");
    } else {
      alert("Category deleted.");
      await refreshCategoryDropdowns();
    }
  } catch (err) {
    console.error("Error deleting category", err);
    alert("Error deleting category");
  }
});

// Display articles filtered by currentCategoryFilter
async function displayArticles() {
  articlesList.innerHTML = "";
  await fetchArticles();

  filteredArticles = currentCategoryFilter
    ? articleData.filter(a => a.category === currentCategoryFilter)
    : [...articleData];

  if (filteredArticles.length === 0) {
    articlesList.innerHTML = "<p>No articles available.</p>";
    return;
  }

  filteredArticles.forEach(article => {
    const div = document.createElement("div");
    div.classList.add("article-preview");
    div.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <div class="article-title">${article.title}</div>
      ${article.category ? `<div class="article-category">${article.category}</div>` : ""}
    `;

    div.addEventListener("click", () => {
      window.location.href = `article.html?id=${article.id}`;
    });

    articlesList.appendChild(div);
  });

  updateCategoryNavActive();
}

// Display articles for admin (with delete button)
function displayAdminArticles() {
  adminArticles.innerHTML = "";
  articleData.forEach(article => {
    const div = document.createElement("div");
    div.innerHTML = `
      <hr>
      <strong>${article.title}</strong>
      <button class="delete-btn" onclick="deleteArticle(${article.id})">Delete</button>
    `;
    adminArticles.appendChild(div);
  });
}

// Delete article (exposed globally)
window.deleteArticle = async function (id) {
  if (!isAdmin) return;
  if (!confirm("Are you sure you want to delete this article?")) return;

  await deleteArticleFromBackend(id);
  alert("Article deleted successfully.");
  await fetchArticles();
  await displayArticles();
  displayAdminArticles();
};

// Convert uploaded image to base64 string
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Tabs switching logic
viewTab.addEventListener("click", async () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  history.pushState({ section: "view" }, "View Articles", "#view");
  currentCategoryFilter = null;
  await displayArticles();
});

writeTab.addEventListener("click", async () => {
  if (!isAdmin) {
    const inputUser = prompt("Enter admin username:");
    const inputPass = prompt("Enter admin password:");
    if (inputUser === adminUsername && inputPass === adminPassword) {
      isAdmin = true;
      alert("Welcome, Admin!");
    } else {
      alert("Incorrect credentials.");
      return;
    }
  }

  writeTab.classList.add("active");
  viewTab.classList.remove("active");
  writeSection.classList.add("active");
  viewSection.classList.remove("active");
  history.pushState({ section: "write" }, "Write Article", "#write");
  await fetchArticles();
  displayAdminArticles();

  // Close side menu and overlay
  if (sideMenu.classList.contains("open")) {
    sideMenu.classList.remove("open");
    overlay.classList.remove("active");
  }
});

// Clicking logo switches to view tab
logo.addEventListener("click", () => {
  viewTab.click();
});

// Form submission to save article
form.addEventListener("submit", async e => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];
  const category = categorySelect.value;

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  let imageDataURL = "";
  if (imageFile) {
    imageDataURL = await convertImageToBase64(imageFile);
  }

  const newArticle = {
    title,
    content,
    image: imageDataURL,
    category,
    createdAt: new Date().toISOString(),
  };

  await saveArticleToBackend(newArticle);

  alert("Article saved!");
  form.reset();
  await fetchArticles();
  displayAdminArticles();
  writeTab.click();
});

// Menu toggle
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
  overlay.classList.toggle("active");
});

overlay.addEventListener("click", () => {
  sideMenu.classList.remove("open");
  overlay.classList.remove("active");
});

// On page load
window.onload = async () => {
  await refreshCategoryDropdowns();
  viewTab.click();
};

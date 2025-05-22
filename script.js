const API_BASE = "https://komnottra-backend.onrender.com"; // Backend URL

const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const form = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const adminArticles = document.getElementById("adminArticles");
const categoryNav = document.getElementById("categoryNav");

const createCategoryBtn = document.getElementById("createCategoryBtn");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const newCategoryInput = document.getElementById("newCategory");
const deleteCategorySelect = document.getElementById("deleteCategorySelect");
const categorySelect = document.getElementById("categorySelect");
const logo = document.querySelector(".logo");

let isAdmin = false;
const adminUsername = "admin";
const adminPassword = "123";
let articleData = [];
let filteredArticles = []; // store currently displayed filtered articles
let currentCategoryFilter = null;

async function fetchArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`);
    articleData = await res.json();
    // Assign IDs if missing (optional, if your backend doesn't provide IDs)
    articleData.forEach((article, idx) => {
      if (!article.id) article.id = idx + 1;
    });
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
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: "DELETE",
    });
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

function displayCategoryNav(categories) {
  categoryNav.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "Show All";
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

function updateCategoryNavActive() {
  const buttons = categoryNav.querySelectorAll("button");
  buttons.forEach(btn => {
    if (btn.textContent === currentCategoryFilter || (btn.textContent === "Show All" && !currentCategoryFilter)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

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

async function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  await fetchArticles();

  filteredArticles = currentCategoryFilter
    ? articleData.filter(a => a.category === currentCategoryFilter)
    : [...articleData];

  if (filteredArticles.length === 0) {
    articlesList.innerHTML = "<p>No articles available.</p>";
    return;
  }

  filteredArticles.forEach((article) => {
    const div = document.createElement("div");
    div.classList.add("article-preview");
    div.style.cursor = "pointer";
    div.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <div class="article-title">${article.title}</div>
      ${article.category ? `<div class="article-category">${article.category}</div>` : ""}
    `;
    div.addEventListener("click", () => viewFullArticle(article.id));
    articlesList.appendChild(div);
  });

  updateCategoryNavActive();
}

window.viewFullArticle = function (articleId) {
  const article = articleData.find(a => a.id === articleId);
  if (!article) {
    fullArticle.innerHTML = "<p>Article not found.</p>";
    return;
  }

  fullArticle.innerHTML = `
    <div class="article-full">
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <h2>${article.title}</h2>
      <p><strong>Published:</strong> ${formatDate(article.date)}</p>
      ${article.category ? `<p><strong>Category:</strong> ${article.category}</p>
      ${article.content
  .split('\n')
  .filter(line => line.trim() !== "")
  .map(line => `<p>${line.trim()}</p>`)
  .join('')}` : ""}
    </div>
  `;

  // Hide articles list to focus on full article
  articlesList.innerHTML = "";

  // Back button event listener
  document.getElementById("backToListBtn").addEventListener("click", () => {
    fullArticle.innerHTML = "";
    displayArticles();
  });
};

function displayAdminArticles() {
  adminArticles.innerHTML = "";
  articleData.forEach((article) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <hr>
      <strong>${article.title}</strong>
      <button class="delete-btn" onclick="deleteArticle(${article.id})">Delete</button>
    `;
    adminArticles.appendChild(div);
  });
}

window.deleteArticle = async function (id) {
  if (!isAdmin) return;
  if (!confirm("Are you sure you want to delete this article?")) return;

  await deleteArticleFromBackend(id);
  alert("Article deleted successfully.");
  await fetchArticles();
  await displayArticles();
  displayAdminArticles();
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { hour: "numeric", minute: "numeric", hour12: true };
  const datePart = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  const timePart = date.toLocaleTimeString([], options);
  return `${datePart} ${timePart}`;
}

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
});

logo.addEventListener("click", async () => {
  viewTab.click();
});

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];

  let imageDataURL = null;
  if (imageFile) {
    imageDataURL = await convertImageToBase64(imageFile);
  }

  const newArticle = {
    title,
    content,
    date: new Date().toISOString(),
    image: imageDataURL,
    category: categorySelect.value,
  };

  await saveArticleToBackend(newArticle);
  alert("Article published successfully!");
  form.reset();
  await refreshCategoryDropdowns();
  currentCategoryFilter = null;
  await displayArticles();
  viewTab.click();
});

window.addEventListener("popstate", (event) => {
  if (event.state?.section === "write") {
    writeTab.click();
  } else {
    viewTab.click();
  }
});

window.onload = async () => {
  if (window.location.hash === "#write") {
    writeTab.click();
  } else {
    viewTab.click();
  }
  await refreshCategoryDropdowns();
};

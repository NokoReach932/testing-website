// === Elements & Globals ===
const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const form = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const adminArticles = document.getElementById("adminArticles");

const categorySelect = document.getElementById("categorySelect");
const createCategoryBtn = document.getElementById("createCategoryBtn");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const newCategoryInput = document.getElementById("newCategory");
const deleteCategorySelect = document.getElementById("deleteCategorySelect");
const categoryNav = document.getElementById("categoryNav");

let isAdmin = false;
let categories = [];
const adminAccounts = {
  // Sample admin credentials for testing purposes
  'admin': 'password123' // Replace with actual admin credentials or a secure method
};

// Backend API URL (Replace with your Render API URL)
const API_URL = "https://komnottra-backend.onrender.com";

// === Helper Functions ===
async function fetchArticles() {
  const response = await fetch(`${API_URL}/articles`);
  if (!response.ok) throw new Error("Failed to fetch articles");
  return await response.json();
}

async function saveArticleToBackend(article) {
  const response = await fetch(`${API_URL}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article),
  });
  if (!response.ok) throw new Error("Failed to save article");
  return await response.json();
}

async function deleteArticleFromBackend(id) {
  const response = await fetch(`${API_URL}/articles/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error("Failed to delete article");
  return await response.json();
}

async function fetchCategories() {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) throw new Error("Failed to fetch categories");
  return await response.json();
}

async function saveCategoryToBackend(category) {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });
  if (!response.ok) throw new Error("Failed to save category");
  return await response.json();
}

async function deleteCategoryFromBackend(category) {
  const response = await fetch(`${API_URL}/categories/${category}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error("Failed to delete category");
  return await response.json();
}

// === Category UI Management ===
async function updateCategorySelect() {
  categories = await fetchCategories();
  categorySelect.innerHTML = '<option value="" disabled selected>Select Category (Optional)</option>';
  deleteCategorySelect.innerHTML = '<option disabled selected>Select Category to Delete</option>';
  categoryNav.innerHTML = ''; // Clear existing category nav buttons

  categories.forEach(category => {
    [categorySelect, deleteCategorySelect].forEach(select => {
      const opt = document.createElement("option");
      opt.value = category;
      opt.textContent = category;
      select.appendChild(opt);
    });

    const categoryButton = document.createElement("button");
    categoryButton.className = "category-button";
    categoryButton.textContent = category;
    categoryButton.setAttribute("data-category", category);
    categoryNav.appendChild(categoryButton);

    categoryButton.addEventListener("click", function () {
      filterArticlesByCategory(category);
    });
  });
}

// === Handle Category Filtering ===
async function filterArticlesByCategory(category) {
  const articles = await fetchArticles();
  const filteredArticles = articles.filter(article => article.category === category);
  fullArticle.innerHTML = ""; // Ensure full article view is cleared
  displayFilteredArticles(filteredArticles);
}

function displayFilteredArticles(articles) {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  const categoryDiv = document.createElement("div");
  categoryDiv.className = "category";

  articles.forEach(article => {
    const div = document.createElement("div");
    div.className = "article-preview card";
    div.setAttribute("data-index", article.id);

    if (article.image) {
      const img = document.createElement("img");
      img.src = article.image;
      img.alt = "Article Image";
      div.appendChild(img);
    }

    const titleDiv = document.createElement("div");
    titleDiv.className = "article-title";
    titleDiv.textContent = article.title;
    div.appendChild(titleDiv);

    categoryDiv.appendChild(div);
  });

  articlesList.appendChild(categoryDiv);
}

// === Create/Delete Category ===
createCategoryBtn.addEventListener("click", async () => {
  const newCategory = newCategoryInput.value.trim();
  if (newCategory && !categories.includes(newCategory)) {
    try {
      await saveCategoryToBackend(newCategory);
      alert("Category created successfully!");
      newCategoryInput.value = "";
      updateCategorySelect();
    } catch (error) {
      alert("Error creating category: " + error.message);
    }
  } else if (!newCategory) {
    alert("Category name is required.");
  } else {
    alert("Duplicate category name.");
  }
});

deleteCategoryBtn.addEventListener("click", async () => {
  const selectedCategory = deleteCategorySelect.value;
  if (!selectedCategory) {
    alert("Please select a category to delete.");
    return;
  }

  if (!confirm(`Are you sure you want to delete the category "${selectedCategory}"?`)) return;

  try {
    await deleteCategoryFromBackend(selectedCategory);
    alert("Category deleted successfully.");
    updateCategorySelect();
  } catch (error) {
    alert("Error deleting category: " + error.message);
  }
});

// === Tab Switching ===
viewTab.addEventListener("click", () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  history.pushState({ section: 'view' }, 'View Articles', '#view');
  displayArticles();
});

writeTab.addEventListener("click", () => {
  if (!isAdmin) {
    const inputUser = prompt("Enter admin username:");
    const inputPass = prompt("Enter admin password:");
    const normalizedUser = inputUser.trim().toLowerCase();

    if (adminAccounts[normalizedUser] && adminAccounts[normalizedUser] === inputPass) {
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
  history.pushState({ section: 'write' }, 'Write Article', '#write');
  displayAdminArticles();
});

// === Handle Article Submission ===
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const category = categorySelect.value || "";
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];

  const createAndSave = async (base64Image) => {
    const newArticle = {
      title,
      content,
      category,
      date: new Date().toISOString(),
      image: base64Image || null
    };

    try {
      await saveArticleToBackend(newArticle);
      alert("Article published successfully!");
      form.reset();
      viewTab.click();
    } catch (error) {
      alert("Error saving article: " + error.message);
    }
  };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);
        createAndSave(base64Image);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(imageFile);
  } else {
    createAndSave(null);
  }
});

// === Display Functions ===
async function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";
  const articles = await fetchArticles();

  const categorizedArticles = categories.map(category => ({
    category,
    articles: articles.filter(article => article.category === category)
  }));

  categorizedArticles.forEach(group => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category";

    group.articles.forEach(article => {
      const div = document.createElement("div");
      div.className = "article-preview card";
      div.setAttribute("data-index", article.id);

      if (article.image) {
        const img = document.createElement("img");
        img.src = article.image;
        img.alt = "Article Image";
        div.appendChild(img);
      }

      const titleDiv = document.createElement("div");
      titleDiv.className = "article-title";
      titleDiv.textContent = article.title;
      div.appendChild(titleDiv);

      categoryDiv.appendChild(div);
    });

    articlesList.appendChild(categoryDiv);
  });
}

async function displayAdminArticles() {
  adminArticles.innerHTML = "";
  const articles = await fetchArticles();

  articles.forEach((article) => {
    const div = document.createElement("div");
    div.innerHTML =
      `<hr>
      <strong>${article.title}</strong>
      <button class="delete-btn" data-delete-id="${article.id}">Delete</button>`;
    adminArticles.appendChild(div);
  });
}

adminArticles.addEventListener("click", async function (event) {
  const btn = event.target.closest("button[data-delete-id]");
  if (!btn || !isAdmin) return;

  const id = btn.getAttribute("data-delete-id");

  if (!confirm("Are you sure you want to delete this article?")) return;

  try {
    await deleteArticleFromBackend(id);
    alert("Article deleted successfully.");
    displayArticles();
    displayAdminArticles();
  } catch (error) {
    alert("Error deleting article: " + error.message);
  }
});

window.onload = async () => {
  await updateCategorySelect();
  if (window.location.hash === '#write') {
    writeTab.click();
  } else {
    viewTab.click();
  }
};

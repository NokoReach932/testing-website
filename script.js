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
const fontSelect = document.getElementById("fontSelect"); // New font select element
const fontUploadInput = document.getElementById("fontUpload"); // New font upload input
const uploadFontBtn = document.getElementById("uploadFontBtn"); // New font upload button
const logo = document.querySelector(".logo");

let isAdmin = false;
const adminUsername = "admin";
const adminPassword = "123";
let articleData = [];
let filteredArticles = []; // store currently displayed filtered articles
let currentCategoryFilter = null;
let fontList = []; // store fonts fetched from backend

// Fetch articles from backend
async function fetchArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`);
    articleData = await res.json();
    // Assign IDs if missing (optional)
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

// Fetch categories from backend
async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch categories", err);
    return [];
  }
}

// Fetch fonts from backend
async function fetchFonts() {
  try {
    const res = await fetch(`${API_BASE}/fonts`);
    fontList = await res.json();
    updateFontDropdown();
  } catch (err) {
    console.error("Failed to fetch fonts", err);
    fontList = [];
    updateFontDropdown();
  }
}

// Update font dropdown options in the article form
function updateFontDropdown() {
  fontSelect.innerHTML = `<option value="" selected>Default Font</option>`;
  fontList.forEach(font => {
    const option = document.createElement("option");
    option.value = font.url; // Assuming backend returns an object with font URL
    option.textContent = font.name; // and font name
    fontSelect.appendChild(option);
  });
}

// Refresh category dropdowns and navigation buttons
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

// Display category navigation buttons
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

// Update active state on category nav buttons
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

// Create category event
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

// Delete category event
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

// Display articles filtered by category
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

// View full article display
window.viewFullArticle = function (articleId) {
  const article = articleData.find(a => a.id === articleId);
  if (!article) {
    fullArticle.innerHTML = "<p>Article not found.</p>";
    return;
  }

  // Compose article content with paragraphs
  const articleContent = article.content
    .split('\n')
    .filter(line => line.trim() !== "")
    .map(line => `<p>${line.trim()}</p>`)
    .join('');

  // Show the article with selected font style applied
  fullArticle.innerHTML = `
    <div class="article-full" style="font-family: ${article.fontFamily || 'inherit'};">
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <h2>${article.title}</h2>
      <p><strong>Published:</strong> ${formatDate(article.date)}</p>
      ${article.category ? `<p><strong>Category:</strong> ${article.category}</p>` : ""}
      ${articleContent}
      <button id="backToListBtn">Back to List</button>
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

// Display admin articles with delete option
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

// Delete article event
window.deleteArticle = async function (id) {
  if (!isAdmin) return;
  if (!confirm("Are you sure you want to delete this article?")) return;

  await deleteArticleFromBackend(id);
  alert("Article deleted successfully.");
  await fetchArticles();
  await displayArticles();
  displayAdminArticles();
};

// Format date string nicely
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { hour: "numeric", minute: "numeric", hour12: true };
  const datePart = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  const timePart = date.toLocaleTimeString([], options);
  return `${datePart} ${timePart}`;
}

// Convert image file to base64 string
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert font file to base64 string
function convertFontToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Tab switching logic
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

// Article form submit handler
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const title = this.title.value.trim();
  const content = this.content.value.trim();
  const category = categorySelect.value || null;
  const fontUrl = fontSelect.value || null;

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  // Handle image upload and convert to base64
  let imageBase64 = "";
  if (this.image.files.length > 0) {
    imageBase64 = await convertImageToBase64(this.image.files[0]);
  }

  // Compose article object
  const newArticle = {
    id: Date.now(), // simple unique id
    title,
    content,
    category,
    image: imageBase64,
    date: new Date().toISOString(),
    fontFamily: fontUrl ? `url(${fontUrl})` : null, // store font URL
  };

  await saveArticleToBackend(newArticle);
  alert("Article published!");
  this.reset();
  await fetchArticles();
  displayArticles();
  displayAdminArticles();
});

// Upload font file handler
uploadFontBtn.addEventListener("click", async () => {
  const files = fontUploadInput.files;
  if (!files || files.length === 0) {
    alert("Please select a font file to upload.");
    return;
  }
  const fontFile = files[0];

  // Convert font file to base64 (if your backend expects that)
  const base64Font = await convertFontToBase64(fontFile);

  // Send font to backend
  try {
    const res = await fetch(`${API_BASE}/fonts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fontFile.name,
        data: base64Font,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Failed to upload font");
      return;
    }

    alert("Font uploaded successfully!");
    fontUploadInput.value = "";
    await fetchFonts();
  } catch (err) {
    console.error("Failed to upload font", err);
    alert("Failed to upload font");
  }
});

// Initialize page - load fonts, categories and articles
async function init() {
  await fetchFonts();
  await refreshCategoryDropdowns();
  await fetchArticles();
  await displayArticles();
  // Start on view tab
  viewTab.click();
}
init();

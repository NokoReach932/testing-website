const articleForm = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const viewTab = document.getElementById("viewTab");
const writeTab = document.getElementById("writeTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const fontSelect = document.getElementById("fontSelect");
const categorySelect = document.getElementById("categorySelect");
const deleteCategorySelect = document.getElementById("deleteCategorySelect");
const categoryNav = document.getElementById("categoryNav");

const backendUrl = "https://komnottra-backend.onrender.com"; // Replace with your backend URL

// Load available fonts
async function loadFonts() {
  const res = await fetch(`${backendUrl}/fonts`);
  const fonts = await res.json();

  fontSelect.innerHTML = `<option value="">Default</option>`;
  fonts.forEach(font => {
    const option = document.createElement("option");
    option.value = font.url;
    option.textContent = font.name;
    fontSelect.appendChild(option);
  });
}

// Load available categories into dropdowns
async function refreshCategoryDropdowns() {
  const res = await fetch(`${backendUrl}/categories`);
  const categories = await res.json();

  categorySelect.innerHTML = `<option value="">Select Category</option>`;
  deleteCategorySelect.innerHTML = `<option value="">Select Category</option>`;

  categories.forEach(category => {
    const option1 = document.createElement("option");
    option1.value = category;
    option1.textContent = category;
    categorySelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = category;
    option2.textContent = category;
    deleteCategorySelect.appendChild(option2);
  });
}

// Load articles
async function fetchArticles() {
  const res = await fetch(`${backendUrl}/articles`);
  return await res.json();
}

// Display all articles
async function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  const articles = await fetchArticles();
  if (articles.length === 0) {
    articlesList.innerHTML = "<p>No articles available.</p>";
    return;
  }

  articles.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="article-preview" onclick="viewFullArticle(${index})">
        ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
        <div class="article-title">${article.title}</div>
        ${article.category ? `<div class="article-category">${article.category}</div>` : ""}
      </div>
    `;
    articlesList.appendChild(div);
  });

  window.allArticles = articles; // Store globally for viewing
}

// Display filtered articles by category
async function displayArticlesByCategory(category) {
  const articles = await fetchArticles();
  const filtered = articles.filter(article => article.category === category);
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  if (filtered.length === 0) {
    articlesList.innerHTML = `<p>No articles in "${category}".</p>`;
    return;
  }

  filtered.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="article-preview" onclick="viewFullArticle(${index})">
        ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
        <div class="article-title">${article.title}</div>
        ${article.category ? `<div class="article-category">${article.category}</div>` : ""}
      </div>
    `;
    articlesList.appendChild(div);
  });

  window.allArticles = filtered; // Update global list for view
}

// Display full article
function viewFullArticle(index) {
  const article = window.allArticles[index];
  fullArticle.innerHTML = `
    ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
    <h2>${article.title}</h2>
    ${article.category ? `<div class="article-category">${article.category}</div>` : ""}
    <p style="font-family: ${article.font ? `'${article.font}'` : "inherit"}">${article.content}</p>
  `;
}

// Populate category filter buttons
async function populateCategoryButtons() {
  const res = await fetch(`${backendUrl}/categories`);
  const categories = await res.json();

  categoryNav.innerHTML = ""; // Clear existing buttons

  // All button
  const allBtn = document.createElement("button");
  allBtn.textContent = "All";
  allBtn.className = "category-btn";
  allBtn.onclick = displayArticles;
  categoryNav.appendChild(allBtn);

  // Category buttons
  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.className = "category-btn";
    btn.onclick = () => displayArticlesByCategory(category);
    categoryNav.appendChild(btn);
  });
}

// Submit article
articleForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = articleForm.title.value;
  const content = articleForm.content.value;
  const font = fontSelect.value;
  const category = categorySelect.value;
  const imageFile = articleForm.image.files[0];

  let imageUrl = "";
  if (imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const imgRes = await fetch(`${backendUrl}/upload-image`, {
      method: "POST",
      body: formData,
    });

    const imgData = await imgRes.json();
    imageUrl = imgData.url;
  }

  const res = await fetch(`${backendUrl}/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, font, category, image: imageUrl }),
  });

  if (res.ok) {
    articleForm.reset();
    fontSelect.value = "";
    displayArticles();
    populateCategoryButtons();
  }
});

// Upload custom font
document.getElementById("fontUploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fontFile = document.getElementById("fontFile").files[0];
  const fontName = document.getElementById("fontName").value;

  if (!fontFile || !fontName) return;

  const formData = new FormData();
  formData.append("font", fontFile);
  formData.append("name", fontName);

  await fetch(`${backendUrl}/upload-font`, {
    method: "POST",
    body: formData,
  });

  document.getElementById("fontUploadForm").reset();
  loadFonts();
});

// Add category
document.getElementById("addCategoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newCategory = document.getElementById("newCategory").value;

  await fetch(`${backendUrl}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: newCategory }),
  });

  e.target.reset();
  refreshCategoryDropdowns();
  populateCategoryButtons();
});

// Delete category
document.getElementById("deleteCategoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const category = deleteCategorySelect.value;

  await fetch(`${backendUrl}/categories/${category}`, {
    method: "DELETE",
  });

  refreshCategoryDropdowns();
  populateCategoryButtons();
});

// Tab switching
viewTab.addEventListener("click", () => {
  viewSection.style.display = "block";
  writeSection.style.display = "none";
  location.hash = "#view";
  displayArticles();
});

writeTab.addEventListener("click", () => {
  viewSection.style.display = "none";
  writeSection.style.display = "block";
  location.hash = "#write";
});

// Initialize
window.onload = async () => {
  if (window.location.hash === "#write") {
    writeTab.click();
  } else {
    viewTab.click();
  }

  await loadFonts();
  await refreshCategoryDropdowns();
  await populateCategoryButtons();
};

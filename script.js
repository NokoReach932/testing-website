// script.js

// Get DOM elements by correct updated IDs
const form = document.getElementById("articleForm");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const imageInput = document.getElementById("imageUpload");
const categorySelect = document.getElementById("categorySelect");
const newCategoryInput = document.getElementById("newCategory");
const createCategoryBtn = document.getElementById("createCategoryBtn");
const deleteCategorySelect = document.getElementById("deleteCategorySelect");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const viewSection = document.getElementById("viewSection");
const writeSection = document.getElementById("writeSection");
const categoryNav = document.getElementById("categoryNav");

let articleData = [];

// Fetch categories from backend
async function fetchCategories() {
  const res = await fetch("https://komnottra-backend.onrender.com/categories");
  return await res.json();
}

// Add new category
async function addCategory(name) {
  const res = await fetch("https://komnottra-backend.onrender.com/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return await res.json();
}

// Delete a category by name
async function deleteCategory(name) {
  await fetch(`https://komnottra-backend.onrender.com/categories/${name}`, {
    method: "DELETE",
  });
}

// Refresh category selects/dropdowns
async function refreshCategoryDropdowns() {
  const categories = await fetchCategories();

  // Refresh categorySelect options in article form
  categorySelect.innerHTML =
    '<option value="" disabled selected>Select Category (Optional)</option>';
  // Refresh deleteCategorySelect options
  deleteCategorySelect.innerHTML =
    '<option disabled selected>Select Category to Delete</option>';

  categories.forEach((category) => {
    // Option for categorySelect (article form)
    const option1 = document.createElement("option");
    option1.value = category;
    option1.textContent = category;
    categorySelect.appendChild(option1);

    // Option for deleteCategorySelect
    const option2 = document.createElement("option");
    option2.value = category;
    option2.textContent = category;
    deleteCategorySelect.appendChild(option2);
  });
}

// Display category buttons above article list (for filtering)
async function displayCategoryButtons() {
  categoryNav.innerHTML = "";
  const categories = await fetchCategories();

  // "All" button to reset filters
  const allBtn = document.createElement("button");
  allBtn.className = "category-button";
  allBtn.textContent = "All";
  allBtn.onclick = () => displayArticles();
  categoryNav.appendChild(allBtn);

  categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.className = "category-button";
    btn.textContent = category;
    btn.onclick = () => filterArticlesByCategory(category);
    categoryNav.appendChild(btn);
  });
}

// Submit article to backend
async function submitArticle(article) {
  const res = await fetch("https://komnottra-backend.onrender.com/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  });
  const savedArticle = await res.json();
  articleData.unshift(savedArticle);
  form.reset();
  displayArticles();
}

// Form submit event with image file reading
form.onsubmit = (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categorySelect.value;
  const imageFile = imageInput.files[0];

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  if (imageFile) {
    const reader = new FileReader();
    reader.onloadend = () => {
      submitArticle({
        title,
        content,
        image: reader.result,
        category,
      });
    };
    reader.readAsDataURL(imageFile);
  } else {
    submitArticle({
      title,
      content,
      image: "",
      category,
    });
  }
};

// Display all articles in the view section
function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  articleData.forEach((article, index) => {
    const div = document.createElement("div");
    div.className = "article-preview";
    div.onclick = () => viewFullArticle(index);
    div.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <div class="article-title">${article.title}</div>
      ${
        article.category
          ? `<div class="article-category">${article.category}</div>`
          : ""
      }
    `;
    articlesList.appendChild(div);
  });
}

// Filter articles by category
function filterArticlesByCategory(selectedCategory) {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  const filtered = articleData.filter(
    (article) => article.category === selectedCategory
  );

  if (filtered.length === 0) {
    articlesList.innerHTML = `<p>No articles found for category "${selectedCategory}".</p>`;
    return;
  }

  filtered.forEach((article) => {
    const div = document.createElement("div");
    div.className = "article-preview";
    div.onclick = () => viewFullArticle(articleData.indexOf(article));
    div.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <div class="article-title">${article.title}</div>
      <div class="article-category">${article.category}</div>
    `;
    articlesList.appendChild(div);
  });
}

// View full article details
function viewFullArticle(index) {
  const article = articleData[index];
  if (!article) return;

  fullArticle.innerHTML = `
    <h2>${article.title}</h2>
    ${article.image ? `<img src="${article.image}" alt="Article Image" class="full-image">` : ""}
    <p>${article.content.replace(/\n/g, "<br>")}</p>
    <p><strong>Category:</strong> ${article.category || "None"}</p>
  `;

  // Scroll to full article view
  fullArticle.scrollIntoView({ behavior: "smooth" });
}

// Fetch articles from backend on load
async function fetchArticles() {
  const res = await fetch("https://komnottra-backend.onrender.com/articles");
  articleData = await res.json();
  displayArticles();
}

// Admin category management event handlers
createCategoryBtn.onclick = async () => {
  const newCat = newCategoryInput.value.trim();
  if (!newCat) {
    alert("Please enter a category name.");
    return;
  }
  await addCategory(newCat);
  newCategoryInput.value = "";
  await refreshCategoryDropdowns();
  await displayCategoryButtons();
};

deleteCategoryBtn.onclick = async () => {
  const catToDelete = deleteCategorySelect.value;
  if (!catToDelete) {
    alert("Please select a category to delete.");
    return;
  }
  await deleteCategory(catToDelete);
  await refreshCategoryDropdowns();
  await displayCategoryButtons();
};

// Tab switching logic
writeTab.onclick = () => {
  writeSection.classList.add("active");
  viewSection.classList.remove("active");
  writeTab.classList.add("active");
  viewTab.classList.remove("active");
  window.location.hash = "#write";
};

viewTab.onclick = () => {
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  window.location.hash = "#view";
};

// On page load
(async () => {
  await refreshCategoryDropdowns();
  await displayCategoryButtons();
  await fetchArticles();

  // Open tab based on URL hash
  if (window.location.hash === "#write") {
    writeTab.click();
  } else {
    viewTab.click();
  }
})();

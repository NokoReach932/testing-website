const form = document.getElementById("articleForm");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const imageInput = document.getElementById("image");
const categorySelect = document.getElementById("category");
const categoryDropdown = document.getElementById("categoryDropdown");
const categoryModal = document.getElementById("categoryModal");
const newCategoryInput = document.getElementById("newCategory");
const categoryList = document.getElementById("categoryList");
const articlesList = document.getElementById("articles");
const fullArticle = document.getElementById("fullArticle");
const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const articleSection = document.getElementById("articleSection");
const categoryNav = document.getElementById("categoryNav");

let articleData = [];

async function fetchCategories() {
  const res = await fetch("https://komnottra-backend.onrender.com/categories");
  return await res.json();
}

async function addCategory(name) {
  const res = await fetch("https://komnottra-backend.onrender.com/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return await res.json();
}

async function deleteCategory(name) {
  await fetch(`https://komnottra-backend.onrender.com/categories/${name}`, {
    method: "DELETE",
  });
}

async function refreshCategoryDropdowns() {
  const categories = await fetchCategories();
  categorySelect.innerHTML = "<option value=''>Select Category</option>";
  categoryList.innerHTML = "";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);

    const li = document.createElement("li");
    li.textContent = category;
    li.onclick = async () => {
      await deleteCategory(category);
      await refreshCategoryDropdowns();
      await displayCategoryButtons();
    };
    categoryList.appendChild(li);
  });
}

async function displayCategoryButtons() {
  categoryNav.innerHTML = "";
  const categories = await fetchCategories();

  const allBtn = document.createElement("button");
  allBtn.className = "category-button";
  allBtn.textContent = "All";
  allBtn.onclick = displayArticles;
  categoryNav.appendChild(allBtn);

  categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.className = "category-button";
    btn.textContent = category;
    btn.onclick = () => filterArticlesByCategory(category);
    categoryNav.appendChild(btn);
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categorySelect.value;
  const imageFile = imageInput.files[0];

  if (!title || !content) {
    alert("Title and content are required.");
    return;
  }

  let imageData = "";
  if (imageFile) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      imageData = reader.result;
      await submitArticle({ title, content, image: imageData, category });
    };
    reader.readAsDataURL(imageFile);
  } else {
    await submitArticle({ title, content, image: "", category });
  }
};

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

function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  articleData.forEach((article, index) => {
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
}

function filterArticlesByCategory(selectedCategory) {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  const filtered = articleData.filter(article => article.category === selectedCategory);

  if (filtered.length === 0) {
    articlesList.innerHTML = `<p>No articles found for category "${selectedCategory}".</p>`;
    return;
  }

  filtered.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="article-preview" onclick="viewFullArticle(${articleData.indexOf(article)})">
        ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
        <div class="article-title">${article.title}</div>
        ${article.category ? `<div class="article-category">${article.category}</div>` : ""}
      </div>
    `;
    articlesList.appendChild(div);
  });
}

function viewFullArticle(index) {
  const article = articleData[index];
  fullArticle.innerHTML = `
    <h2>${article.title}</h2>
    ${article.image ? `<img src="${article.image}" alt="Full Image">` : ""}
    <p>${article.content}</p>
    ${article.category ? `<p class="article-category">Category: ${article.category}</p>` : ""}
  `;
}

categoryDropdown.onclick = () => {
  categoryModal.classList.toggle("show");
};

document.getElementById("addCategoryBtn").onclick = async () => {
  const newCategory = newCategoryInput.value.trim();
  if (newCategory) {
    await addCategory(newCategory);
    newCategoryInput.value = "";
    await refreshCategoryDropdowns();
    await displayCategoryButtons();
  }
};

writeTab.onclick = () => {
  form.classList.remove("hidden");
  articleSection.classList.add("hidden");
  writeTab.classList.add("active");
  viewTab.classList.remove("active");
  window.location.hash = "#write";
};

viewTab.onclick = () => {
  form.classList.add("hidden");
  articleSection.classList.remove("hidden");
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  window.location.hash = "#view";
};

window.onload = async () => {
  if (window.location.hash === "#write") {
    writeTab.click();
  } else {
    viewTab.click();
  }

  const res = await fetch("https://komnottra-backend.onrender.com/articles");
  articleData = await res.json();
  displayArticles();
  await refreshCategoryDropdowns();
  await displayCategoryButtons();
};

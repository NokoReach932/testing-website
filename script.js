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
  "chivorn": "chivorn123",
  "phirun": "phirun123",
  "nokoreach": "nokoreach123"
};

// === Storage Functions ===
function loadArticlesFromLocalStorage() {
  const stored = localStorage.getItem('articles');
  return stored ? JSON.parse(stored) : [];
}

function saveArticlesToLocalStorage(articles) {
  localStorage.setItem('articles', JSON.stringify(articles));
}

function loadCategoriesFromLocalStorage() {
  const stored = localStorage.getItem('categories');
  return stored ? JSON.parse(stored) : [];
}

function saveCategoriesToLocalStorage() {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// === Category UI Management ===
function updateCategorySelect() {
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
function filterArticlesByCategory(category) {
  const articles = loadArticlesFromLocalStorage();
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
    const index = loadArticlesFromLocalStorage().findIndex(a =>
      a.title === article.title &&
      a.date === article.date &&
      a.content === article.content
    );

    const div = document.createElement("div");
    div.className = "article-preview card";
    div.setAttribute("data-index", index);

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
createCategoryBtn.addEventListener("click", () => {
  const newCategory = newCategoryInput.value.trim();
  if (newCategory && !categories.includes(newCategory)) {
    categories.push(newCategory);
    saveCategoriesToLocalStorage();
    updateCategorySelect();
    alert("Category created successfully!");
    newCategoryInput.value = "";
  } else if (!newCategory) {
    alert("Category name is required.");
  } else {
    alert("Duplicate category name.");
  }
});

deleteCategoryBtn.addEventListener("click", () => {
  const selectedCategory = deleteCategorySelect.value;
  if (!selectedCategory) {
    alert("Please select a category to delete.");
    return;
  }

  if (!confirm(`Are you sure you want to delete the category "${selectedCategory}"?`)) return;

  categories = categories.filter(cat => cat !== selectedCategory);
  saveCategoriesToLocalStorage();
  updateCategorySelect();
  alert("Category deleted successfully.");
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
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const category = categorySelect.value || "";
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];
  const articles = loadArticlesFromLocalStorage();

  const createAndSave = (base64Image) => {
    const newArticle = {
      title,
      content,
      category,
      date: new Date().toISOString(),
      image: base64Image || null
    };
    articles.push(newArticle);
    saveArticlesToLocalStorage(articles);
    alert("Article published successfully!");
    form.reset();
    viewTab.click();
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
function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";
  const articles = loadArticlesFromLocalStorage();

  const categorizedArticles = categories.map(category => ({
    category,
    articles: articles.filter(article => article.category === category)
  }));

  categorizedArticles.forEach(group => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category";

    group.articles.forEach(article => {
      const index = articles.findIndex(a =>
        a.title === article.title &&
        a.date === article.date &&
        a.content === article.content
      );

      const div = document.createElement("div");
      div.className = "article-preview card";
      div.setAttribute("data-index", index);

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

articlesList.addEventListener("click", function (event) {
  const card = event.target.closest(".article-preview.card");
  if (card && card.hasAttribute("data-index")) {
    const index = parseInt(card.getAttribute("data-index"), 10);
    if (!isNaN(index)) viewFullArticle(index);
  }
});

function viewFullArticle(index) {
  const articles = loadArticlesFromLocalStorage();
  const article = articles[index];
  if (!article) return;

  fullArticle.innerHTML = "";

  const containerDiv = document.createElement("div");
  containerDiv.className = "article-container";

  const articleDiv = document.createElement("div");
  articleDiv.className = "article-full";

  if (article.image) {
    const img = document.createElement("img");
    img.src = article.image;
    img.alt = "Article Image";
    articleDiv.appendChild(img);
  }

  const title = document.createElement("h2");
  title.textContent = article.title;
  articleDiv.appendChild(title);

  const publishDate = document.createElement("p");
  publishDate.innerHTML = `<strong>Published:</strong> ${formatDate(article.date)}`;
  articleDiv.appendChild(publishDate);

  const content = document.createElement("p");
  content.innerHTML = article.content.replace(/\n/g, "<br>");
  articleDiv.appendChild(content);

  containerDiv.appendChild(articleDiv);
  fullArticle.appendChild(containerDiv);
  articlesList.innerHTML = "";
}

function displayAdminArticles() {
  adminArticles.innerHTML = "";
  const articles = loadArticlesFromLocalStorage();

  articles.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML =
      `<hr>
      <strong>${article.title}</strong>
      <button class="delete-btn" data-delete-index="${index}">Delete</button>`;
    adminArticles.appendChild(div);
  });
}

adminArticles.addEventListener("click", function (event) {
  const btn = event.target.closest("button[data-delete-index]");
  if (!btn || !isAdmin) return;

  const index = parseInt(btn.getAttribute("data-delete-index"), 10);
  if (isNaN(index)) return;

  if (!confirm("Are you sure you want to delete this article?")) return;

  const articles = loadArticlesFromLocalStorage();
  articles.splice(index, 1);
  saveArticlesToLocalStorage(articles);

  alert("Article deleted successfully.");
  displayArticles();
  displayAdminArticles();
});

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  const datePart = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  const timePart = date.toLocaleTimeString([], options);
  return `${datePart} ${timePart}`;
}

window.addEventListener('popstate', (event) => {
  if (event.state?.section === 'write') {
    writeTab.click();
  } else {
    viewTab.click();
  }
});

window.onload = () => {
  categories = loadCategoriesFromLocalStorage();
  updateCategorySelect();
  if (window.location.hash === '#write') {
    writeTab.click();
  } else {
    viewTab.click();
  }
};

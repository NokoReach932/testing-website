const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const form = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const adminArticles = document.getElementById("adminArticles");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const menuToggle = document.getElementById("menuToggle");
const categoryTitle = document.getElementById("categoryTitle");
const categorySelect = document.getElementById("categorySelect");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const newCategoryInput = document.getElementById("newCategory");

let isAdmin = false;
let currentCategory = "all";

// Admin credentials
const adminAccounts = {
  "chivorn": "chivorn123",
  "phirun": "phirun123",
  "nokoreach": "nokoreach123"
};

// --- Load/Save Articles and Categories ---
function loadArticlesFromLocalStorage() {
  const stored = localStorage.getItem('articles');
  return stored ? JSON.parse(stored) : [];
}

function saveArticlesToLocalStorage(articles) {
  localStorage.setItem('articles', JSON.stringify(articles));
}

function loadCategoriesFromLocalStorage() {
  const stored = localStorage.getItem('categories');
  return stored ? JSON.parse(stored) : ["ព័ត៌មានទូទៅ"];
}

function saveCategoriesToLocalStorage(categories) {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// --- Tab switching ---
viewTab.addEventListener("click", () => {
  switchToView();
});

function switchToView() {
  viewTab.classList.add("active");
  writeTab?.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  history.pushState({ section: 'view' }, '', '#view');
  displayArticles();
}

document.getElementById("writeTab")?.addEventListener("click", () => {
  if (!isAdmin) {
    const username = prompt("Enter admin username:");
    const password = prompt("Enter admin password:");
    const normalized = username.trim().toLowerCase();

    if (adminAccounts[normalized] && adminAccounts[normalized] === password) {
      isAdmin = true;
      alert("Welcome Admin!");
    } else {
      alert("Incorrect credentials.");
      return;
    }
  }

  writeTab.classList.add("active");
  viewTab.classList.remove("active");
  writeSection.classList.add("active");
  viewSection.classList.remove("active");
  history.pushState({ section: 'write' }, '', '#write');
  populateCategorySelect();
  displayAdminArticles();
});

// --- Mobile Menu ---
menuToggle.addEventListener('click', () => {
  sideMenu.classList.toggle('open');
  overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
  sideMenu.classList.remove('open');
  overlay.classList.remove('active');
});

// --- Article submission ---
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const category = categorySelect.value;
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];
  const articles = loadArticlesFromLocalStorage();

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);

        const newArticle = { title, content, category, date: new Date().toISOString(), image: base64Image };
        articles.push(newArticle);
        saveArticlesToLocalStorage(articles);
        alert("Article published!");
        form.reset();
        viewTab.click();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(imageFile);
  } else {
    const newArticle = { title, content, category, date: new Date().toISOString(), image: null };
    articles.push(newArticle);
    saveArticlesToLocalStorage(articles);
    alert("Article published!");
    form.reset();
    viewTab.click();
  }
});

// --- Add new category ---
addCategoryBtn.addEventListener("click", () => {
  const newCat = newCategoryInput.value.trim();
  if (!newCat) return alert("Please enter category name.");

  const categories = loadCategoriesFromLocalStorage();
  if (categories.includes(newCat)) return alert("Category already exists.");

  categories.push(newCat);
  saveCategoriesToLocalStorage(categories);
  renderSideMenu();
  populateCategorySelect();
  newCategoryInput.value = "";
});

// --- Populate category select in admin form ---
function populateCategorySelect() {
  categorySelect.innerHTML = "";
  const categories = loadCategoriesFromLocalStorage();
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// --- Display Articles ---
function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";
  const articles = loadArticlesFromLocalStorage();

  const filtered = currentCategory === "all"
    ? articles
    : articles.filter(article => article.category === currentCategory);

  if (filtered.length === 0) {
    articlesList.innerHTML = "<p>No articles available in this category.</p>";
    return;
  }

  filtered.forEach((article, index) => {
    const div = document.createElement("div");
    div.className = "article-preview";
    div.setAttribute("onclick", `viewFullArticle(${index})`);

    if (article.image) {
      const img = document.createElement("img");
      img.src = article.image;
      div.appendChild(img);
    }

    const titleDiv = document.createElement("div");
    titleDiv.className = "article-title";
    titleDiv.textContent = article.title;
    div.appendChild(titleDiv);

    articlesList.appendChild(div);
  });
}

// --- View Full Article ---
window.viewFullArticle = function (index) {
  const articles = loadArticlesFromLocalStorage();
  const article = currentCategory === "all"
    ? articles[index]
    : articles.filter(a => a.category === currentCategory)[index];

  fullArticle.innerHTML = "";
  const container = document.createElement("div");
  container.className = "article-container";

  const articleDiv = document.createElement("div");
  articleDiv.className = "article-full";

  if (article.image) {
    const img = document.createElement("img");
    img.src = article.image;
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

  container.appendChild(articleDiv);
  fullArticle.appendChild(container);
  articlesList.innerHTML = "";
};

// --- Admin View Articles ---
function displayAdminArticles() {
  adminArticles.innerHTML = "";
  const articles = loadArticlesFromLocalStorage();

  articles.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <hr>
      <strong>${article.title} (${article.category})</strong>
      <button class="delete-btn" onclick="deleteArticle(${index})">Delete</button>
    `;
    adminArticles.appendChild(div);
  });
}

// --- Delete Article ---
window.deleteArticle = function (index) {
  if (!isAdmin) return;
  if (!confirm("Delete this article?")) return;

  const articles = loadArticlesFromLocalStorage();
  articles.splice(index, 1);
  saveArticlesToLocalStorage(articles);

  alert("Article deleted.");
  displayArticles();
  displayAdminArticles();
};

// --- Format Date ---
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.toLocaleTimeString([], options)}`;
}

// --- Dynamic Side Menu ---
function renderSideMenu() {
  sideMenu.innerHTML = "";
  const defaultButton = document.createElement("button");
  defaultButton.id = "viewTab";
  defaultButton.className = "active";
  defaultButton.textContent = "ព័ត៌មានទូទៅ";
  defaultButton.setAttribute("data-category", "all");
  sideMenu.appendChild(defaultButton);

  const categories = loadCategoriesFromLocalStorage();
  categories.forEach(cat => {
    const button = document.createElement("button");
    button.textContent = cat;
    button.setAttribute("data-category", cat);
    sideMenu.appendChild(button);
  });

  sideMenu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentCategory = btn.getAttribute("data-category");
      categoryTitle.textContent = currentCategory === "all" ? "Published Articles" : currentCategory;
      sideMenu.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      switchToView();
    });
  });
}

// --- Load initially ---
window.onload = () => {
  renderSideMenu();
  populateCategorySelect();
  if (window.location.hash === '#write') {
    writeTab?.click();
  } else {
    viewTab?.click();
  }
  displayArticles();
};

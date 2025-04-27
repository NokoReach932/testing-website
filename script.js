const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const form = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const adminArticles = document.getElementById("adminArticles");

let isAdmin = false;

// Admin credentials
const adminAccounts = {
  "chivorn": "chivorn123",
  "phirun": "phirun123",
  "nokoreach": "nokoreach123"
};

// Load and Save Articles
function loadArticlesFromLocalStorage() {
  const storedArticles = localStorage.getItem('articles');
  return storedArticles ? JSON.parse(storedArticles) : [];
}

function saveArticlesToLocalStorage(articles) {
  localStorage.setItem('articles', JSON.stringify(articles));
}

// Tab switching
viewTab.addEventListener("click", () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  history.pushState(null, "", "#view");
  loadArticles();
});

writeTab.addEventListener("click", () => {
  writeTab.classList.add("active");
  viewTab.classList.remove("active");
  writeSection.classList.add("active");
  viewSection.classList.remove("active");
  history.pushState(null, "", "#write");
  loadAdminArticles();
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById("darkModeToggle");
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  document.querySelector("header").classList.toggle("dark-mode");
  document.querySelector(".side-menu").classList.toggle("dark-mode");
  document.querySelector(".container").classList.toggle("dark-mode");
  document.querySelector(".delete-btn").classList.toggle("dark-mode");
  document.querySelector(".article-preview").classList.toggle("dark-mode");
});

// Article Form Submission
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const image = document.getElementById("imageUpload").files[0];

  if (title && content) {
    const articles = loadArticlesFromLocalStorage();
    const newArticle = {
      title,
      content,
      imageUrl: image ? URL.createObjectURL(image) : null,
      id: Date.now()
    };

    articles.push(newArticle);
    saveArticlesToLocalStorage(articles);
    form.reset();
    loadArticles();
  }
});

// Load and display articles in the "View Articles" section
function loadArticles() {
  articlesList.innerHTML = "";
  const articles = loadArticlesFromLocalStorage();

  articles.forEach(article => {
    const articlePreview = document.createElement("div");
    articlePreview.classList.add("article-preview");
    articlePreview.innerHTML = `
      <img src="${article.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${article.title}">
      <div class="article-title">${article.title}</div>
    `;
    articlePreview.addEventListener("click", () => showFullArticle(article.id));
    articlesList.appendChild(articlePreview);
  });
}

// Show full article
function showFullArticle(articleId) {
  const articles = loadArticlesFromLocalStorage();
  const article = articles.find(a => a.id === articleId);
  if (article) {
    fullArticle.innerHTML = `
      <div class="article-container">
        <h2>${article.title}</h2>
        <img src="${article.imageUrl || 'https://via.placeholder.com/700x400'}" alt="${article.title}">
        <p>${article.content}</p>
      </div>
    `;
  }
}

// Load and display articles in the "Admin Write" section
function loadAdminArticles() {
  adminArticles.innerHTML = "";
  if (isAdmin) {
    const articles = loadArticlesFromLocalStorage();
    articles.forEach(article => {
      const articleItem = document.createElement("div");
      articleItem.classList.add("article-item");
      articleItem.innerHTML = `
        <p><strong>${article.title}</strong></p>
        <button class="delete-btn" onclick="deleteArticle(${article.id})">Delete</button>
      `;
      adminArticles.appendChild(articleItem);
    });
  } else {
    // If not admin, show a login prompt
    adminArticles.innerHTML = `
      <input type="text" id="adminUsername" placeholder="Username">
      <input type="password" id="adminPassword" placeholder="Password">
      <button onclick="loginAdmin()">Login</button>
    `;
  }
}

// Admin login function
function loginAdmin() {
  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;
  
  if (adminAccounts[username] === password) {
    isAdmin = true;
    loadAdminArticles();
  } else {
    alert("Invalid credentials");
  }
}

// Delete article
function deleteArticle(articleId) {
  const articles = loadArticlesFromLocalStorage();
  const filteredArticles = articles.filter(a => a.id !== articleId);
  saveArticlesToLocalStorage(filteredArticles);
  loadAdminArticles();
  loadArticles();
}

// Initial load
if (window.location.hash === "#write") {
  writeTab.classList.add("active");
  viewTab.classList.remove("active");
  writeSection.classList.add("active");
  viewSection.classList.remove("active");
  loadAdminArticles();
} else {
  loadArticles();
}

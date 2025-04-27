const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

menuToggle.addEventListener('click', () => {
  sideMenu.classList.toggle('open');
  overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
  sideMenu.classList.remove('open');
  overlay.classList.remove('active');
});

document.querySelectorAll('#sideMenu button').forEach(button => {
  button.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    overlay.classList.remove('active');
  });
});

// Dark mode toggle
darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  // Save dark mode preference to local storage
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('darkMode', 'enabled');
  } else {
    localStorage.removeItem('darkMode');
  }
});

// Load dark mode preference on page load
window.onload = () => {
  if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
  }
};

// Admin credentials
const adminAccounts = {
  "chivorn": "chivorn123",
  "phirun": "phirun123",
  "nokoreach": "nokoreach123"
};

// Tab switching
const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const form = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const adminArticles = document.getElementById("adminArticles");

let isAdmin = false;

viewTab.addEventListener("click", () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  history.pushState({ section: 'view' }, 'View Articles', '#view');
  displayArticles();
});

writeTab.addEventListener("click", () => {
  writeTab.classList.add("active");
  viewTab.classList.remove("active");
  writeSection.classList.add("active");
  viewSection.classList.remove("active");
  history.pushState({ section: 'write' }, 'Write Article', '#write');
});

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.section === "view") {
    viewTab.classList.add("active");
    writeTab.classList.remove("active");
    viewSection.classList.add("active");
    writeSection.classList.remove("active");
  } else if (event.state && event.state.section === "write") {
    writeTab.classList.add("active");
    viewTab.classList.remove("active");
    writeSection.classList.add("active");
    viewSection.classList.remove("active");
  }
});

// Add article functionality
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const image = document.getElementById("imageUpload").files[0];

  if (!title || !content) return alert("Title and content are required!");

  const article = {
    title,
    content,
    image: image ? URL.createObjectURL(image) : null,
    id: Date.now(),
  };

  // Store the article in localStorage (or database)
  let articles = JSON.parse(localStorage.getItem('articles')) || [];
  articles.push(article);
  localStorage.setItem('articles', JSON.stringify(articles));

  // Clear the form after submission
  form.reset();
  displayArticles();
});

// Display articles
function displayArticles() {
  const articles = JSON.parse(localStorage.getItem('articles')) || [];
  articlesList.innerHTML = '';

  articles.forEach((article) => {
    const articlePreview = document.createElement('div');
    articlePreview.classList.add('article-preview');
    articlePreview.innerHTML = `
      <img src="${article.image || 'https://via.placeholder.com/300x200'}" alt="${article.title}">
      <div class="article-title">${article.title}</div>
    `;
    articlePreview.addEventListener('click', () => {
      displayFullArticle(article);
    });
    articlesList.appendChild(articlePreview);
  });
}

// Display full article
function displayFullArticle(article) {
  fullArticle.innerHTML = `
    <div class="article-container">
      <h2>${article.title}</h2>
      <p>${article.content}</p>
      ${article.image ? `<img src="${article.image}" alt="${article.title}">` : ''}
    </div>
  `;
}

// Admin login functionality
function checkAdminLogin() {
  const username = prompt("Enter your username:");
  const password = prompt("Enter your password:");

  if (adminAccounts[username] === password) {
    isAdmin = true;
    alert("Login successful!");
    writeTab.classList.remove("disabled");
  } else {
    alert("Invalid credentials");
  }
}

// Load articles for the admin section
function loadAdminArticles() {
  if (isAdmin) {
    const articles = JSON.parse(localStorage.getItem('articles')) || [];
    adminArticles.innerHTML = '';
    articles.forEach((article) => {
      const articleDiv = document.createElement('div');
      articleDiv.classList.add('article-preview');
      articleDiv.innerHTML = `
        <h3>${article.title}</h3>
        <button class="delete-btn" onclick="deleteArticle(${article.id})">Delete</button>
      `;
      adminArticles.appendChild(articleDiv);
    });
  } else {
    alert("You must be an admin to view this section.");
  }
}

// Delete article
function deleteArticle(id) {
  let articles = JSON.parse(localStorage.getItem('articles')) || [];
  articles = articles.filter(article => article.id !== id);
  localStorage.setItem('articles', JSON.stringify(articles));
  displayArticles();
}

// Initial load
window.onload = () => {
  displayArticles();
  if (isAdmin) {
    loadAdminArticles();
  }
};

const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const categoryTab = document.getElementById("categoryTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const categorySection = document.getElementById("categorySection");
const form = document.getElementById("articleForm");
const categoryForm = document.getElementById("categoryForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const adminArticles = document.getElementById("adminArticles");
const categorySelect = document.getElementById("categorySelect");
const categoriesList = document.getElementById("categoriesList");

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

// Load and Save Categories
function loadCategoriesFromLocalStorage() {
  const storedCategories = localStorage.getItem('categories');
  return storedCategories ? JSON.parse(storedCategories) : [];
}

function saveCategoriesToLocalStorage(categories) {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// Tab switching
viewTab.addEventListener("click", () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  categoryTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  categorySection.classList.remove("active");
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
  categoryTab.classList.remove("active");
  writeSection.classList.add("active");
  viewSection.classList.remove("active");
  categorySection.classList.remove("active");
  history.pushState({ section: 'write' }, 'Write Article', '#write');
  displayAdminArticles();
});

categoryTab.addEventListener("click", () => {
  categoryTab.classList.add("active");
  writeTab.classList.remove("active");
  viewTab.classList.remove("active");
  categorySection.classList.add("active");
  writeSection.classList.remove("active");
  viewSection.classList.remove("active");
  history.pushState({ section: 'category' }, 'Manage Categories', '#category');
  displayCategories();
});

// Handle article submission
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];
  const category = categorySelect.value;

  const articles = loadArticlesFromLocalStorage();

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

        const newArticle = {
          title,
          content,
          date: new Date().toISOString(),
          image: base64Image,
          category
        };

        articles.push(newArticle);
        saveArticlesToLocalStorage(articles);

        alert("Article published successfully!");
        form.reset();
        viewTab.click();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(imageFile);
  } else {
    const newArticle = {
      title,
      content,
      date: new Date().toISOString(),
      image: null,
      category
    };
    articles.push(newArticle);
    saveArticlesToLocalStorage(articles);

    alert("Article published successfully!");
    form.reset();
    viewTab.click();
  }
});

// Display articles
function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  const articles = loadArticlesFromLocalStorage();

  if (articles.length === 0) {
    console.log("No articles available.");
  }

  articles.forEach((article, index) => {
    const div = document.createElement("div");
    div.className = "article-preview";
    div.setAttribute("onclick", `viewFullArticle(${index})`);

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

    articlesList.appendChild(div);
  });
}

// View full article
window.viewFullArticle = function (index) {
  const articles = loadArticlesFromLocalStorage();
  const article = articles[index];

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

  const category = document.createElement("p");
  category.innerHTML = `<strong>Category:</strong> ${article.category}`;
  articleDiv.appendChild(category);

  containerDiv.appendChild(articleDiv);
  fullArticle.appendChild(containerDiv);
  articlesList.innerHTML = "";
};

// Admin view
function displayAdminArticles() {
  adminArticles.innerHTML = "";
  const articles = loadArticlesFromLocalStorage();

  articles.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <hr>
      <strong>${article.title}</strong>
      <button class="delete-btn" onclick="deleteArticle(${index})">Delete</button>
    `;
    adminArticles.appendChild(div);
  });
}

// Delete article
window.deleteArticle = function (index) {
  if (!isAdmin) return;
  if (!confirm("Are you sure you want to delete this article?")) return;

  const articles = loadArticlesFromLocalStorage();
  articles.splice(index, 1);
  saveArticlesToLocalStorage(articles);

  alert("Article deleted successfully.");
  displayArticles();
  displayAdminArticles();
};

// Manage Categories
categoryForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const categoryName = document.getElementById("newCategory").value.trim();
  if (!categoryName) return;

  const categories = loadCategoriesFromLocalStorage();
  categories.push(categoryName);
  saveCategoriesToLocalStorage(categories);

  updateCategorySelect();
  displayCategories();
  alert("Category added!");
  categoryForm.reset();
});

// Display Categories
function displayCategories() {
  categoriesList.innerHTML = "";
  const categories = loadCategoriesFromLocalStorage();

  categories.forEach(category => {
    const div = document.createElement("div");
    div.textContent = category;
    categoriesList.appendChild(div);
  });
}

// Update Category Select Dropdown
function updateCategorySelect() {
  categorySelect.innerHTML = "<option value=''>Select Category</option>";
  const categories = loadCategoriesFromLocalStorage();

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    hour12: true 
  };
  return date.toLocaleString('en-US', options);
}

// Initial setup for categories and article view
window.onload = () => {
  updateCategorySelect();
  if (window.location.hash === "#write") {
    writeTab.click();
  } else if (window.location.hash === "#category") {
    categoryTab.click();
  } else {
    viewTab.click();
  }
};

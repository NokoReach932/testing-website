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
});

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageUpload = document.getElementById("imageUpload").files[0];

  if (title.trim() && content.trim()) {
    const article = {
      title,
      content,
      image: imageUpload ? URL.createObjectURL(imageUpload) : "",
    };

    const articles = loadArticlesFromLocalStorage();
    articles.push(article);
    saveArticlesToLocalStorage(articles);

    alert("Article published!");

    // Clear the form
    form.reset();

    // Show the published articles
    displayArticles();
  } else {
    alert("Title and content are required!");
  }
});

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

    // Create a flex container for the image and title
    const flexContainer = document.createElement("div");
    flexContainer.className = "article-flex-container";

    // Add the image
    if (article.image) {
      const img = document.createElement("img");
      img.src = article.image;
      img.alt = "Article Image";
      img.className = "article-thumbnail"; // added class for styling
      flexContainer.appendChild(img);
    }

    // Add the title
    const titleDiv = document.createElement("div");
    titleDiv.className = "article-title";
    titleDiv.textContent = article.title;
    flexContainer.appendChild(titleDiv);

    div.appendChild(flexContainer);
    articlesList.appendChild(div);
  });
}

function viewFullArticle(index) {
  const articles = loadArticlesFromLocalStorage();
  const article = articles[index];

  fullArticle.innerHTML = `
    <div class="article-container">
      <div class="article-full">
        <h2>${article.title}</h2>
        ${article.image ? `<img src="${article.image}" alt="Article Image" />` : ""}
        <p>${article.content}</p>
      </div>
    </div>
  `;
}

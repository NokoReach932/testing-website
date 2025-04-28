const viewTab = document.getElementById("viewTab");
const writeTab = document.getElementById("writeTab");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const form = document.getElementById("articleForm");

// Toggle between view and write section
viewTab.addEventListener("click", () => {
  document.getElementById("viewSection").style.display = "block";
  document.getElementById("writeSection").style.display = "none";
  displayArticles();
});

writeTab.addEventListener("click", () => {
  document.getElementById("viewSection").style.display = "none";
  document.getElementById("writeSection").style.display = "block";
});

// Load articles from localStorage
function loadArticlesFromLocalStorage() {
  const articles = localStorage.getItem("articles");
  return articles ? JSON.parse(articles) : [];
}

// Save articles to localStorage
function saveArticlesToLocalStorage(articles) {
  localStorage.setItem("articles", JSON.stringify(articles));
}

// Display all articles, grouped by category
function displayArticles() {
  articlesList.innerHTML = "";
  const articles = loadArticlesFromLocalStorage();

  if (articles.length === 0) {
    articlesList.innerHTML = "<p>No articles available.</p>";
    return;
  }

  const categories = [...new Set(articles.map(article => article.category))];  // Get unique categories

  categories.forEach(category => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category-section";
    const categoryTitle = document.createElement("h3");
    categoryTitle.textContent = category;
    categoryDiv.appendChild(categoryTitle);

    const categoryArticles = articles.filter(article => article.category === category);
    categoryArticles.forEach((article, index) => {
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

      categoryDiv.appendChild(div);
    });

    articlesList.appendChild(categoryDiv);
  });
}

// View the full article
function viewFullArticle(index) {
  const articles = loadArticlesFromLocalStorage();
  const article = articles[index];
  fullArticle.innerHTML = `
    <h3>${article.title}</h3>
    <p>${article.content}</p>
    ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
  `;
}

// Handle article form submission
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];
  const category = document.getElementById("category").value;  // Get the selected category

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
          category,  // Add category to article
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
      category,  // Add category to article
    };
    articles.push(newArticle);
    saveArticlesToLocalStorage(articles);

    alert("Article published successfully!");
    form.reset();
    viewTab.click();
  }
});

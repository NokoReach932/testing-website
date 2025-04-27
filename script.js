document.addEventListener("DOMContentLoaded", function() {
  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');
  const viewTab = document.getElementById("viewTab");
  const writeTab = document.getElementById("writeTab");
  const writeSection = document.getElementById("writeSection");
  const viewSection = document.getElementById("viewSection");
  const form = document.getElementById("articleForm");
  const articlesList = document.getElementById("articlesList");
  const fullArticle = document.getElementById("fullArticle");
  const closeArticleBtn = document.querySelector(".close-article-btn");

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
    displayAdminArticles();
  });

  // Handle article submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
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
            image: base64Image
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
        image: null
      };
      articles.push(newArticle);
      saveArticlesToLocalStorage(articles);


const writeTab = document.getElementById("writeTab");
const viewTab = document.getElementById("viewTab");
const writeSection = document.getElementById("writeSection");
const viewSection = document.getElementById("viewSection");
const form = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const fullArticle = document.getElementById("fullArticle");
const adminArticles = document.getElementById("adminArticles");

let isAdmin = false;

const adminUsername = "admin";
const adminPassword = "123";

viewTab.addEventListener("click", () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  
  // Update history state
  history.pushState({ section: 'view' }, 'View Articles', '#view');
  
  displayArticles();
});

writeTab.addEventListener("click", () => {
  if (!isAdmin) {
    const inputUser = prompt("Enter admin username:");
    const inputPass = prompt("Enter admin password:");

    if (inputUser === adminUsername && inputPass === adminPassword) {
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
  
  // Update history state
  history.pushState({ section: 'write' }, 'Write Article', '#write');
  
  displayAdminArticles();
});

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];

  const reader = new FileReader();

  reader.onload = function () {
    const newArticle = {
      title,
      content,
      image: imageFile ? reader.result : null,
      date: new Date().toISOString()
    };

    let articles = JSON.parse(localStorage.getItem("articles")) || [];
    articles.unshift(newArticle);
    localStorage.setItem("articles", JSON.stringify(articles));

    form.reset();
    displayArticles();
    displayAdminArticles();
    alert("Article published successfully!");

    // Switch back to view articles after publishing
    viewTab.click();
  };

  if (imageFile) {
    reader.readAsDataURL(imageFile);
  } else {
    reader.onload();
  }
});

function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";
  const articles = JSON.parse(localStorage.getItem("articles")) || [];

  articles.forEach((article, index) => {
    const articleDiv = document.createElement("div");
    articleDiv.innerHTML = `
      <div class="article-preview" onclick="viewFullArticle(${index})">
        <img src="${article.image}" alt="Article Image">
        <div class="article-title">${article.title}</div>
      </div>
    `;
    articlesList.appendChild(articleDiv);
  });
}

function viewFullArticle(index) {
  const articles = JSON.parse(localStorage.getItem("articles")) || [];
  const article = articles[index];
  articlesList.innerHTML = "";
  fullArticle.innerHTML = `
    <div class="article-full">
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <h2>${article.title}</h2>
      <p><strong>Published:</strong> ${formatDate(article.date)}</p>
      <p>${article.content.replace(/\n/g, "<br>")}</p>
    </div>
  `;
}

function displayAdminArticles() {
  adminArticles.innerHTML = "";
  const articles = JSON.parse(localStorage.getItem("articles")) || [];

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

function deleteArticle(index) {
  if (!isAdmin) return;
  let articles = JSON.parse(localStorage.getItem("articles")) || [];
  articles.splice(index, 1);
  localStorage.setItem("articles", JSON.stringify(articles));
  displayArticles();
  displayAdminArticles();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  const datePart = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth()+1).padStart(2, '0')}/${date.getFullYear()}`;
  const timePart = date.toLocaleTimeString([], options);
  return `${datePart} ${timePart}`;
}

window.addEventListener('popstate', (event) => {
  if (event.state) {
    if (event.state.section === 'view') {
      viewTab.classList.add("active");
      writeTab.classList.remove("active");
      viewSection.classList.add("active");
      writeSection.classList.remove("active");
      displayArticles();
    } else if (event.state.section === 'write') {
      writeTab.classList.add("active");
      viewTab.classList.remove("active");
      writeSection.classList.add("active");
      viewSection.classList.remove("active");
      displayAdminArticles();
    }
  }
});

window.onload = function () {
  if (window.location.hash === '#write') {
    writeTab.click();
  } else {
    viewTab.click();
  }

  displayArticles();
};

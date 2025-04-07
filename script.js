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

// API URL for the backend
const apiUrl = "http://localhost:5000/api/articles"; // Change this to your server's URL when deployed

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
  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  fetch(apiUrl, {
    method: "POST",
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    form.reset();
    displayArticles();
    displayAdminArticles();
    alert("Article published successfully!");
    viewTab.click();
  })
  .catch(error => console.error("Error publishing article:", error));
});

function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";
  fetch(apiUrl)
    .then(response => response.json())
    .then(articles => {
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
    })
    .catch(error => console.error("Error fetching articles:", error));
}

function viewFullArticle(index) {
  fetch(apiUrl)
    .then(response => response.json())
    .then(articles => {
      const article = articles[index];
      fullArticle.innerHTML = `
        <div class="article-full">
          ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
          <h2>${article.title}</h2>
          <p><strong>Published:</strong> ${new Date(article.date).toLocaleString()}</p>
          <p>${article.content.replace(/\n/g, "<br>")}</p>
        </div>
      `;
    })
    .catch(error => console.error("Error displaying full article:", error));
}

function displayAdminArticles() {
  adminArticles.innerHTML = "";
  fetch(apiUrl)
    .then(response => response.json())
    .then(articles => {
      articles.forEach((article, index) => {
        const div = document.createElement("div");
        div.innerHTML = `
          <hr>
          <strong>${article.title}</strong>
          <button class="delete-btn" onclick="deleteArticle(${index})">Delete</button>
        `;
        adminArticles.appendChild(div);
      });
    })
    .catch(error => console.error("Error fetching admin articles:", error));
}

function deleteArticle(index) {
  if (!isAdmin) return;
  fetch(`${apiUrl}/${index}`, {
    method: "DELETE"
  })
  .then(response => response.json())
  .then(() => {
    displayArticles();
    displayAdminArticles();
  })
  .catch(error => console.error("Error deleting article:", error));
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
};

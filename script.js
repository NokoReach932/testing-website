const API_BASE = "https://komnottra-backend.onrender.com"; // Replace with your actual Render backend URL

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
let articleData = [];

// === Load Articles from Backend ===
async function fetchArticles() {
  try {
    const res = await fetch(`${API_BASE}/articles`);
    articleData = await res.json();
    return articleData;
  } catch (err) {
    console.error("Failed to fetch articles", err);
    return [];
  }
}

// === Save Article to Backend ===
async function saveArticleToBackend(article) {
  try {
    const res = await fetch(`${API_BASE}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to save article", err);
  }
}

// === Delete Article from Backend ===
async function deleteArticleFromBackend(id) {
  try {
    const res = await fetch(`${API_BASE}/articles/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to delete article", err);
  }
}

viewTab.addEventListener("click", async () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  history.pushState({ section: 'view' }, 'View Articles', '#view');
  await displayArticles();
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
  history.pushState({ section: 'write' }, 'Write Article', '#write');
  displayAdminArticles();
});

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];

  let imageDataURL = null;
  if (imageFile) {
    imageDataURL = await convertImageToBase64(imageFile);
  }

  const newArticle = {
    title,
    content,
    date: new Date().toISOString(),
    image: imageDataURL,
  };

  await saveArticleToBackend(newArticle);
  alert("Article published successfully!");
  form.reset();
  viewTab.click();
});

async function displayArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  const articles = await fetchArticles();

  if (articles.length === 0) {
    articlesList.innerHTML = "<p>No articles available.</p>";
    return;
  }

  articles.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="article-preview" onclick="viewFullArticle(${index})">
        ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
        <div class="article-title">${article.title}</div>
      </div>
    `;
    articlesList.appendChild(div);
  });
}

window.viewFullArticle = function (index) {
  const article = articleData[index];
  fullArticle.innerHTML = `
    <div class="article-full">
      ${article.image ? `<img src="${article.image}" alt="Article Image">` : ""}
      <h2>${article.title}</h2>
      <p><strong>Published:</strong> ${formatDate(article.date)}</p>
      <p>${article.content.replace(/\n/g, "<br>")}</p>
    </div>
  `;
  articlesList.innerHTML = "";
};

function displayAdminArticles() {
  adminArticles.innerHTML = "";
  articleData.forEach((article, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <hr>
      <strong>${article.title}</strong>
      <button class="delete-btn" onclick="deleteArticle(${article.id})">Delete</button>
    `;
    adminArticles.appendChild(div);
  });
}

window.deleteArticle = async function (id) {
  if (!isAdmin) return;
  if (!confirm("Are you sure you want to delete this article?")) return;

  await deleteArticleFromBackend(id);
  alert("Article deleted successfully.");
  await displayArticles();
  displayAdminArticles();
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  const datePart = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  const timePart = date.toLocaleTimeString([], options);
  return `${datePart} ${timePart}`;
}

// === Utility to convert image to base64 ===
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.addEventListener('popstate', (event) => {
  if (event.state?.section === 'write') {
    writeTab.click();
  } else {
    viewTab.click();
  }
});

window.onload = async () => {
  if (window.location.hash === '#write') {
    writeTab.click();
  } else {
    viewTab.click();
  }
  await displayArticles();
};

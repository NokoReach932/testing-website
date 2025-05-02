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

// === Backend API URL ===
const API_URL = "https://komnottra-backend.onrender.com";

// === View/Write Tab Logic ===
viewTab.addEventListener("click", () => {
  viewTab.classList.add("active");
  writeTab.classList.remove("active");
  viewSection.classList.add("active");
  writeSection.classList.remove("active");
  history.pushState({ section: 'view' }, 'View Articles', '#view');
  fetchArticles();
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
  fetchAdminArticles();
});

// === Submit Article ===
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageInput = document.getElementById("imageUpload");
  const imageFile = imageInput.files[0];

  let base64Image = null;
  if (imageFile) {
    base64Image = await toBase64(imageFile);
  }

  const article = {
    title,
    content,
    date: new Date().toISOString(),
    image: base64Image
  };

  try {
    const res = await fetch(`${API_URL}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article)
    });

    if (res.ok) {
      alert("Article published successfully!");
      form.reset();
      viewTab.click();
    } else {
      const data = await res.json();
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    alert("Failed to publish article.");
    console.error(err);
  }
});

// === Convert File to Base64 ===
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// === Fetch and Display Articles ===
async function fetchArticles() {
  articlesList.innerHTML = "";
  fullArticle.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/articles`);
    const articles = await res.json();

    if (!articles.length) {
      articlesList.innerHTML = "<p>No articles yet.</p>";
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

    // Save to global for viewing full article
    window._allArticles = articles;

  } catch (err) {
    console.error("Failed to load articles:", err);
  }
}

// === View Full Article ===
window.viewFullArticle = function (index) {
  const article = window._allArticles?.[index];
  if (!article) return;

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

// === Admin: Display All Articles with Delete Option ===
async function fetchAdminArticles() {
  adminArticles.innerHTML = "";
  try {
    const res = await fetch(`${API_URL}/articles`);
    const articles = await res.json();

    articles.forEach((article) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <hr>
        <strong>${article.title}</strong>
        <button class="delete-btn" onclick="deleteArticle(${article.id})">Delete</button>
      `;
      adminArticles.appendChild(div);
    });

  } catch (err) {
    console.error("Failed to fetch admin articles:",

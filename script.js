document.addEventListener("DOMContentLoaded", function() {

  // Initialize data from localStorage (for categories and articles)
  let categories = JSON.parse(localStorage.getItem("categories")) || [];
  let articles = JSON.parse(localStorage.getItem("articles")) || [];

  const categoryDropdown = document.getElementById("category");
  const categoryList = document.getElementById("categoryList");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const newCategoryInput = document.getElementById("newCategory");
  const articleForm = document.getElementById("articleForm");

  // Function to update categories in the dropdown and the list
  function updateCategoryUI() {
    // Clear current categories
    categoryDropdown.innerHTML = "";
    categoryList.innerHTML = "";

    // Add default option in dropdown
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Category";
    categoryDropdown.appendChild(defaultOption);

    // Populate category dropdown and list
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryDropdown.appendChild(option);

      const listItem = document.createElement("li");
      listItem.textContent = category;
      categoryList.appendChild(listItem);
    });
  }

  // Handle adding a new category
  addCategoryBtn.addEventListener("click", function() {
    const newCategory = newCategoryInput.value.trim();
    
    if (newCategory && !categories.includes(newCategory)) {
      categories.push(newCategory);
      localStorage.setItem("categories", JSON.stringify(categories));
      newCategoryInput.value = ""; // Clear the input field
      updateCategoryUI(); // Update UI
    } else {
      alert("Category already exists or is empty.");
    }
  });

  // Handle article form submission
  articleForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const slug = document.getElementById("slug").value.trim();
    const content = document.getElementById("content").value.trim();
    const seoTitle = document.getElementById("seoTitle").value.trim();
    const seoDescription = document.getElementById("seoDescription").value.trim();
    const selectedCategory = categoryDropdown.value;

    if (!title || !slug || !content || !selectedCategory) {
      alert("Please fill all fields.");
      return;
    }

    // Create new article object
    const newArticle = {
      title,
      slug,
      content,
      seoTitle,
      seoDescription,
      category: selectedCategory,
      date: new Date().toISOString(),
    };

    // Save new article to localStorage
    articles.push(newArticle);
    localStorage.setItem("articles", JSON.stringify(articles));

    alert("Article saved successfully!");

    // Reset form and update UI
    articleForm.reset();
    updateCategoryUI();
  });

  // Initial update of category UI
  updateCategoryUI();

});

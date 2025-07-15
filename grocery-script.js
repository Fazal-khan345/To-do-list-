
const groceryItemInput = document.getElementById("groceryItem");
const groceryAmountInput = document.getElementById("amountInput");
const addGroceryBtn = document.getElementById("addGroceryBtn");
const exportGroceryBtn = document.getElementById("exportGroceryBtn");
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

let groceries = JSON.parse(localStorage.getItem("groceries") || "[]");

if (localStorage.getItem("theme") === "dark") {
  body.classList.remove("light-mode");
  body.classList.add("dark-mode");
  themeToggle.textContent = "☀️";
}

themeToggle.onclick = () => {
  if (body.classList.contains("light-mode")) {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
};

addGroceryBtn.onclick = () => {
  const item = groceryItemInput.value.trim();
  const amount = parseInt(groceryAmountInput.value.trim());

  if (!item || isNaN(amount)) {
    alert("Please enter both item and amount.");
    return;
  }

  groceries.push({ item, amount, completed: false });
  groceryItemInput.value = "";
  groceryAmountInput.value = "";
  renderGroceryList();
};

function renderGroceryList() {
  let container = document.getElementById("groceryStats");
  let total = groceries.reduce((sum, g) => sum + g.amount, 0);
  container.innerHTML = groceries.map((g, index) => {
    return `<div class="grocery-item${g.completed ? ' completed' : ''}">
      <span ondblclick="editGrocery(${index})" onclick="toggleGrocery(${index})">
        ${g.item}: ₹${g.amount}
      </span>
      <button onclick="deleteGrocery(${index})">X</button>
    </div>`;
  }).join("") + `<hr><strong>Total: ₹${total}</strong>`;
  localStorage.setItem("groceries", JSON.stringify(groceries));
}

function toggleGrocery(index) {
  groceries[index].completed = !groceries[index].completed;
  renderGroceryList();
}

function deleteGrocery(index) {
  groceries.splice(index, 1);
  renderGroceryList();
}

function editGrocery(index) {
  const container = document.querySelectorAll(".grocery-item")[index];
  const g = groceries[index];
  const inputName = document.createElement("input");
  const inputAmount = document.createElement("input");
  inputName.value = g.item;
  inputAmount.type = "number";
  inputAmount.value = g.amount;
  inputName.onkeypress = (e) => { if (e.key === "Enter") saveEdit(); };
  inputAmount.onkeypress = (e) => { if (e.key === "Enter") saveEdit(); };

  function saveEdit() {
    groceries[index].item = inputName.value.trim() || g.item;
    groceries[index].amount = parseInt(inputAmount.value) || g.amount;
    renderGroceryList();
  }

  container.innerHTML = "";
  container.appendChild(inputName);
  container.appendChild(inputAmount);
  inputName.focus();
}

exportGroceryBtn.onclick = () => {
  let groceryCSV = groceries.map(g => `"${g.item}",${g.amount},${g.completed ? 'Completed' : 'Pending'}`).join("\n");
  let blob = new Blob([`Groceries:\nItem,Amount,Status\n${groceryCSV}`], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "grocery_export.csv";
  a.click();
};

renderGroceryList();

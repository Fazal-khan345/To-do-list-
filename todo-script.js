let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const addBtn = document.getElementById("addBtn");
const voiceBtn = document.getElementById("voiceBtn");
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Initial Theme Load
if (localStorage.getItem("theme") === "dark") {
  body.classList.remove("light-mode");
  body.classList.add("dark-mode");
  themeToggle.textContent = "☀️";
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, idx) => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    const span = document.createElement("span");
    span.textContent = task.text;
    span.onclick = () => {
      tasks[idx].completed = !tasks[idx].completed;
      saveTasks();
      renderTasks();
    };
    span.ondblclick = () => editTask(idx, span);

    const delBtn = document.createElement("button");
    delBtn.textContent = "X";
    delBtn.className = "deleteBtn";
    delBtn.onclick = () => {
      tasks.splice(idx, 1);
      saveTasks();
      renderTasks();
    };

    li.appendChild(span);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });

  updateStats();
  updateGrocery();
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  document.getElementById("stats").innerHTML = `
    <p>Total: ${total} | ✅ Completed: ${completed} | 🕓 Pending: ${pending} | 📈 ${percent}%</p>
  `;
}

function updateGrocery() {
  let total = 0;
  const regex = /(?:₹|Rs\.?|INR)?\s?(\d+)(?=\b|\s|$)/gi;

  tasks.forEach(task => {
    let match;
    while ((match = regex.exec(task.text)) !== null) {
      total += parseInt(match[1]);
    }
  });

  document.getElementById("groceryStats").innerHTML = 
    `<p>🛒 Grocery Total: ₹${total}</p>`;
}

function editTask(index, spanEl) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = tasks[index].text;
  input.onblur = saveEdit;
  input.onkeypress = (e) => { if (e.key === "Enter") saveEdit(); };

  function saveEdit() {
    tasks[index].text = input.value.trim() || tasks[index].text;
    saveTasks();
    renderTasks();
  }

  spanEl.replaceWith(input);
  input.focus();
}

addBtn.onclick = () => {
  const text = taskInput.value.trim();
  if (text === "") return alert("Please enter a task!");
  tasks.push({ text, completed: false });
  saveTasks();
  renderTasks();
  taskInput.value = "";
};

taskInput.onkeypress = (e) => {
  if (e.key === "Enter") addBtn.click();
};

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

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;

  voiceBtn.disabled = false;
  voiceBtn.onclick = () => {
    voiceBtn.textContent = "🎙️";
    recognition.start();
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    taskInput.value = transcript;
    addBtn.click();
  };

  recognition.onend = () => { voiceBtn.textContent = "🎤"; };
  recognition.onerror = () => { voiceBtn.textContent = "🎤"; };
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log("✅ Service Worker Registered"))
      .catch(err => console.error("❌ SW registration failed:", err));
  });
}

renderTasks();

const groceryItemInput = document.getElementById("groceryItem");
const groceryAmountInput = document.getElementById("amountInput");
const addGroceryBtn = document.getElementById("addGroceryBtn");
const exportBtn = document.getElementById("exportBtn");

let groceries = JSON.parse(localStorage.getItem("groceries") || "[]");

addGroceryBtn.onclick = () => {
  const item = groceryItemInput.value.trim();
  const amount = parseInt(groceryAmountInput.value.trim());

  if (!item || isNaN(amount)) {
    alert("Please enter both item and amount.");
    return;
  }

  groceries.push({ item, amount });
  localStorage.setItem("groceries", JSON.stringify(groceries));
  groceryItemInput.value = "";
  groceryAmountInput.value = "";
  updateGroceryList();
};

function updateGroceryList() {
  let total = groceries.reduce((sum, g) => sum + g.amount, 0);
  let list = groceries.map(g => `🛒 ${g.item}: ₹${g.amount}`).join("<br>");
  document.getElementById("groceryStats").innerHTML = `
    <p>${list}<br><strong>Total: ₹${total}</strong></p>
  `;
}

exportBtn.onclick = () => {
  let taskCSV = tasks.map(t => `"${t.text}","${t.completed ? 'Completed' : 'Pending'}"`).join("\n");
  let groceryCSV = groceries.map(g => `"${g.item}",${g.amount}`).join("\n");
  let blob = new Blob([`Tasks:\nTask,Status\n${taskCSV}\n\nGroceries:\nItem,Amount\n${groceryCSV}`], { type: "text/csv" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "todo_grocery_export.csv";
  a.click();
};

updateGroceryList();

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

renderGroceryList();

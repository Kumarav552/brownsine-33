const loginPage = document.getElementById("loginPage");
const loginForm = document.getElementById("loginForm");
const signUpPage = document.getElementById("signUpPage");
const signUpForm = document.getElementById("signUpForm");
const savedAccountsSelect = document.getElementById("savedAccounts");

const homePage = document.getElementById("homePage");
const profilePage = document.getElementById("profilePage");
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const modal = document.getElementById("entryModal");
const selectedDateText = document.getElementById("selectedDate");
const entryList = document.getElementById("entryList");
const dailyTransactions = document.getElementById("dailyTransactions");
const transactionsTitle = document.getElementById("transactionsTitle");

const incomeInput = document.getElementById("incomeInput");
const expenseInput = document.getElementById("expenseInput");
const categoryInput = document.getElementById("categoryInput");
const noteInput = document.getElementById("noteInput");

const monthIncome = document.getElementById("monthIncome");
const monthExpense = document.getElementById("monthExpense");
const monthSavings = document.getElementById("monthSavings");
const selectedIncome = document.getElementById("selectedIncome");
const selectedExpense = document.getElementById("selectedExpense");
const selectedBalance = document.getElementById("selectedBalance");

const themeToggle = document.getElementById("themeToggle");
const headerProfilePhoto = document.getElementById("headerProfilePhoto");
const headerAvatarFallback = document.getElementById("headerAvatarFallback");
const profilePhotoPreview = document.getElementById("profilePhotoPreview");
const profilePhotoFallback = document.getElementById("profilePhotoFallback");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const navButtons = [
  document.getElementById("bottomHome"),
  document.getElementById("bottomCalendar"),
  document.getElementById("bottomReports")
];

let currentDate = new Date();
let data = JSON.parse(localStorage.getItem("RKFinanceData")) || {};
let selectedDay = formatKey(
  currentDate.getFullYear(),
  currentDate.getMonth(),
  currentDate.getDate()
);
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

function formatKey(year, month, day) {
  return `${year}-${month}-${day}`;
}

function parseKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

function saveData() {
  localStorage.setItem("roseFinanceData", JSON.stringify(data));
}

function getStoredAccounts() {
  const accounts = JSON.parse(localStorage.getItem("users")) || [];
  const legacyUser = JSON.parse(localStorage.getItem("user"));

  if (legacyUser && !accounts.some(account => account.username === legacyUser.username)) {
    accounts.push(legacyUser);
    localStorage.setItem("users", JSON.stringify(accounts));
  }

  return accounts;
}

function saveStoredAccounts(accounts) {
  localStorage.setItem("users", JSON.stringify(accounts));
}

function setCurrentUser(user) {
  currentUser = user || null;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  updateAvatarViews();
}

function refreshAccountOptions() {
  const accounts = getStoredAccounts();
  savedAccountsSelect.innerHTML = '<option value="">Use default account or type manually</option>';

  accounts.forEach(account => {
    const option = document.createElement("option");
    option.value = account.username;
    option.textContent = `${account.username} (${account.email})`;
    savedAccountsSelect.appendChild(option);
  });
}

function getInitials(name) {
  if (!name) {
    return "RK";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "RK";
}

function setPhotoState(imageElement, fallbackElement, photo, fallbackText) {
  if (photo) {
    imageElement.src = photo;
    imageElement.style.display = "block";
    fallbackElement.style.display = "none";
  } else {
    imageElement.removeAttribute("src");
    imageElement.style.display = "none";
    fallbackElement.style.display = "grid";
    fallbackElement.textContent = fallbackText;
  }
}

function updateAvatarViews() {
  const fallbackText = getInitials(currentUser?.username);
  const photo = currentUser?.photo || "";

  setPhotoState(headerProfilePhoto, headerAvatarFallback, photo, fallbackText);
  setPhotoState(profilePhotoPreview, profilePhotoFallback, photo, fallbackText);
}

function updateStoredAccount(updatedUser) {
  const accounts = getStoredAccounts();
  const existingIndex = accounts.findIndex(account => account.username === updatedUser.username);

  if (existingIndex >= 0) {
    accounts[existingIndex] = { ...accounts[existingIndex], ...updatedUser };
  } else {
    accounts.push(updatedUser);
  }

  saveStoredAccounts(accounts);
  localStorage.setItem("user", JSON.stringify(updatedUser));
  setCurrentUser(updatedUser);
  refreshAccountOptions();
}

function formatCurrency(amount) {
  return `\u20B9${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getCategoryIcon(category) {
  const icons = {
    Food: "FD",
    Travel: "TR",
    Bills: "BL",
    Shopping: "SP",
    Entertainment: "EN",
    Other: "OT"
  };

  return icons[category] || "OT";
}

function setActiveNav(activeButton) {
  navButtons.forEach(button => {
    button.classList.toggle("active", button === activeButton);
  });
}

function showHome() {
  homePage.style.display = "grid";
  profilePage.style.display = "none";
  setActiveNav(document.getElementById("bottomHome"));
}

function showProfile() {
  homePage.style.display = "none";
  profilePage.style.display = "grid";
  setActiveNav(document.getElementById("bottomCalendar"));
  loadProfile();
}

function ensureSelectedDayInCurrentMonth(year, month) {
  const selected = parseKey(selectedDay);
  if (selected.year !== year || selected.month !== month) {
    selectedDay = formatKey(year, month, 1);
  }
}

function generateCalendar() {
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  ensureSelectedDayInCurrentMonth(year, month);
  monthYear.innerText = `${currentDate.toLocaleString("default", { month: "long" })} ${year}`;

  for (let i = 0; i < firstDayIndex; i += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "empty-day";
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = formatKey(year, month, day);
    const dayDiv = document.createElement("div");
    const dayData = data[key];
    const hasExpense = (dayData?.expenses || []).length > 0;

    dayDiv.className = "day";
    dayDiv.innerText = day;

    if (hasExpense) {
      dayDiv.classList.add("has-entry");
    }

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayDiv.classList.add("today");
    }

    if (key === selectedDay) {
      dayDiv.classList.add("selected");
    }

    if (hasExpense) {
      const totalExpense = dayData.expenses.reduce((sum, entry) => sum + entry.amount, 0);
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.innerText = totalExpense > 999 ? "999+" : totalExpense;
      dayDiv.appendChild(badge);
    }

    dayDiv.onclick = () => openModal(year, month, day);
    calendar.appendChild(dayDiv);
  }

  updateSummary();
  renderSelectedDayDetails();
}

function renderSelectedDayDetails() {
  const selected = parseKey(selectedDay);
  const dateLabel = new Date(selected.year, selected.month, selected.day).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric"
    }
  );
  const dayData = data[selectedDay] || { income: 0, expenses: [] };
  const totalExpense = dayData.expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const balance = (dayData.income || 0) - totalExpense;

  transactionsTitle.innerText = `Transactions - ${dateLabel}`;
  selectedIncome.innerText = formatCurrency(dayData.income || 0);
  selectedExpense.innerText = formatCurrency(totalExpense);
  selectedBalance.innerText = formatCurrency(balance);

  dailyTransactions.innerHTML = "";

  if (dayData.expenses.length === 0) {
    dailyTransactions.innerHTML = '<div class="empty-state">No transactions for this day yet.</div>';
    return;
  }

  dayData.expenses.forEach(entry => {
    const row = document.createElement("div");
    row.className = "transaction-item";
    row.innerHTML = `
      <div class="transaction-icon">${getCategoryIcon(entry.category)}</div>
      <div class="transaction-meta">
        <strong>${entry.category}</strong>
        <span>${entry.note || "No note added"}</span>
      </div>
      <div class="transaction-amount">${formatCurrency(entry.amount)}</div>
    `;
    dailyTransactions.appendChild(row);
  });
}

function openModal(year, month, day) {
  selectedDay = formatKey(year, month, day);
  selectedDateText.innerText = `${day} ${monthYear.innerText}`;
  modal.style.display = "flex";
  loadEntries();
  generateCalendar();
}

function loadEntries() {
  entryList.innerHTML = "";
  const entries = data[selectedDay]?.expenses || [];

  entries.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "entry-item";
    div.innerHTML = `
      <div class="transaction-icon">${getCategoryIcon(entry.category)}</div>
      <div class="transaction-meta">
        <strong>${formatCurrency(entry.amount)} - ${entry.category}</strong>
        <span>${entry.note || "No note added"}</span>
      </div>
      <button onclick="deleteEntry(${index})">X</button>
    `;
    entryList.appendChild(div);
  });

  if (!entries.length) {
    entryList.innerHTML = '<div class="empty-state">Add income or expenses for this date.</div>';
  }
}

function deleteEntry(index) {
  data[selectedDay].expenses.splice(index, 1);
  saveData();
  loadEntries();
  generateCalendar();
}

window.deleteEntry = deleteEntry;

function updateSummary() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  let totalIncome = 0;
  let totalExpense = 0;

  Object.keys(data).forEach(key => {
    const [storedYear, storedMonth] = key.split("-").map(Number);
    if (storedYear === year && storedMonth === month) {
      totalIncome += data[key].income || 0;
      totalExpense += (data[key].expenses || []).reduce((sum, entry) => sum + entry.amount, 0);
    }
  });

  monthIncome.innerText = formatCurrency(totalIncome);
  monthExpense.innerText = formatCurrency(totalExpense);
  monthSavings.innerText = formatCurrency(totalIncome - totalExpense);
}

function loadProfile() {
  const user = currentUser;
  if (user) {
    document.getElementById("profileUsername").innerText = user.username;
    document.getElementById("profileEmail").innerText = user.email;
    document.getElementById("profileSince").innerText = new Date().toLocaleDateString("en-IN");
  } else {
    document.getElementById("profileUsername").innerText = "Default User";
    document.getElementById("profileEmail").innerText = "default@finance.local";
    document.getElementById("profileSince").innerText = new Date().toLocaleDateString("en-IN");
  }

  updateAvatarViews();
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const storedAccounts = getStoredAccounts();
  const matchedUser = storedAccounts.find(
    account => account.username === username && account.password === password
  );

  const defaultLogin = username === "sanjay" && password === "2005";
  const registeredLogin = Boolean(matchedUser);

  if (defaultLogin || registeredLogin) {
    setCurrentUser(defaultLogin ? {
      username: "sanjay",
      email: "default@finance.local",
      photo: ""
    } : matchedUser);
    loginPage.style.display = "none";
    showHome();
    generateCalendar();
  } else {
    alert("Invalid username or password");
  }
});

signUpForm.addEventListener("submit", event => {
  event.preventDefault();
  const username = document.getElementById("signUpUsername").value;
  const email = document.getElementById("signUpEmail").value;
  const password = document.getElementById("signUpPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (password !== confirm) {
    alert("Passwords do not match");
    return;
  }

  if (username && email && password) {
    const accounts = getStoredAccounts();
    const duplicate = accounts.some(
      account => account.username.toLowerCase() === username.toLowerCase()
    );

    if (duplicate) {
      alert("That username already exists. Please choose another one.");
      return;
    }

    const newAccount = { username, email, password, photo: "" };
    accounts.push(newAccount);
    saveStoredAccounts(accounts);
    localStorage.setItem("user", JSON.stringify(newAccount));
    refreshAccountOptions();
    alert("Sign up successful! Please login.");
    signUpPage.style.display = "none";
    loginPage.style.display = "flex";
    signUpForm.reset();
    savedAccountsSelect.value = username;
    document.getElementById("username").value = username;
    document.getElementById("password").value = "";
  } else {
    alert("Please fill all fields");
  }
});

savedAccountsSelect.addEventListener("change", event => {
  const selectedUsername = event.target.value;
  const account = getStoredAccounts().find(item => item.username === selectedUsername);

  if (!account) {
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    return;
  }

  document.getElementById("username").value = account.username;
  document.getElementById("password").value = account.password;
});

document.getElementById("signUpLink").addEventListener("click", event => {
  event.preventDefault();
  loginPage.style.display = "none";
  signUpPage.style.display = "flex";
});

document.getElementById("loginLink").addEventListener("click", event => {
  event.preventDefault();
  signUpPage.style.display = "none";
  loginPage.style.display = "flex";
});

document.getElementById("logout").addEventListener("click", () => {
  profilePage.style.display = "none";
  homePage.style.display = "grid";
  loginPage.style.display = "flex";
  modal.style.display = "none";
  setCurrentUser(null);
  loginForm.reset();
  savedAccountsSelect.value = "";
  setActiveNav(document.getElementById("bottomHome"));
});

profilePhotoInput.addEventListener("change", event => {
  const file = event.target.files[0];

  if (!file || !currentUser) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    profilePhotoInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = loadEvent => {
    const photoData = loadEvent.target.result;
    const updatedUser = { ...currentUser, photo: photoData };
    updateStoredAccount(updatedUser);
    loadProfile();
    alert("Profile photo updated.");
    profilePhotoInput.value = "";
  };
  reader.readAsDataURL(file);
});

document.getElementById("homeBtn").addEventListener("click", showHome);
document.getElementById("profileBtn").addEventListener("click", showProfile);
document.getElementById("bottomHome").addEventListener("click", showHome);
document.getElementById("bottomCalendar").addEventListener("click", showProfile);
document.getElementById("bottomReports").addEventListener("click", () => {
  showHome();
  alert("Reports view can be added next.");
});

document.getElementById("saveEntry").onclick = () => {
  const income = parseFloat(incomeInput.value) || 0;
  const expense = parseFloat(expenseInput.value) || 0;

  if (!data[selectedDay]) {
    data[selectedDay] = { income: 0, expenses: [] };
  }

  if (income > 0) {
    data[selectedDay].income = income;
  }

  if (expense > 0) {
    data[selectedDay].expenses.push({
      amount: expense,
      category: categoryInput.value,
      note: noteInput.value.trim()
    });
  }

  incomeInput.value = "";
  expenseInput.value = "";
  noteInput.value = "";

  saveData();
  loadEntries();
  generateCalendar();
};

document.getElementById("closeModal").onclick = () => {
  modal.style.display = "none";
};

document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  generateCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  generateCalendar();
};

let savedTheme = localStorage.getItem("theme") || "light";
document.body.classList.add(savedTheme);

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", mode);
};

refreshAccountOptions();
updateAvatarViews();
generateCalendar();
showHome();

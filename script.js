const STORAGE_KEYS = {
  auth: "Aishu smart-savings-auth",
  savings: "Aishu smart-savings-data",
  savingsByAccount: "smart-savings-data-by-account",
  profilesByAccount: "smart-savings-profiles-by-account"
};

const defaultSavingsData = [
  { day: "24", month: "Apr", year: 2026, note: "Saved from pocket money", amount: 500, time: "09:30 AM" },
  { day: "22", month: "Apr", year: 2026, note: "Gift money saved", amount: 300, time: "07:15 PM" },
  { day: "20", month: "Apr", year: 2026, note: "Saved from allowance", amount: 200, time: "11:45 AM" },
  { day: "18", month: "Apr", year: 2026, note: "Extra money saved", amount: 800, time: "04:20 PM" },
  { day: "15", month: "Apr", year: 2026, note: "Part-time work", amount: 1000, time: "06:30 PM" },
  { day: "10", month: "Apr", year: 2026, note: "Saved from pocket money", amount: 400, time: "08:10 AM" },
  { day: "05", month: "Apr", year: 2026, note: "Gift money saved", amount: 750, time: "07:45 PM" },
  { day: "01", month: "Apr", year: 2026, note: "Month started", amount: 2300, time: "09:00 AM" }
];

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRupees(value) {
  return `\u20B9 ${value.toLocaleString("en-IN")}`;
}

function parseAmount(value) {
  const cleanedValue = String(value).replace(/[^\d.]/g, "");
  return Number(cleanedValue);
}

function normalizeAccountKey(value) {
  return String(value || "guest@smartsave.app").trim().toLowerCase();
}

function getInitialFromEmail(email) {
  return normalizeAccountKey(email).charAt(0).toUpperCase() || "A";
}

function getDisplayName(email) {
  const [namePart] = normalizeAccountKey(email).split("@");
  return namePart
    .split(/[.\-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Saver";
}

function getCurrentMonthInfo() {
  const now = new Date();
  return {
    shortMonth: now.toLocaleString("en-IN", { month: "short" }),
    fullMonth: now.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    fullDate: now.toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  };
}

function formatMonthYear(date) {
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function formatFullDate(date) {
  return date.toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function getEntryMonthIndex(entry) {
  return MONTH_ORDER.indexOf(entry.month);
}

function normalizeEntry(entry) {
  return {
    ...entry,
    amount: parseAmount(entry.amount),
    year: Number(entry.year) || new Date().getFullYear()
  };
}

function getSavingsData() {
  const currentUser = getCurrentUser();
  const accountKey = normalizeAccountKey(currentUser?.email);
  const byAccountStored = localStorage.getItem(STORAGE_KEYS.savingsByAccount);
  const legacyStored = localStorage.getItem(STORAGE_KEYS.savings);

  try {
    const byAccount = byAccountStored ? JSON.parse(byAccountStored) : {};

    if (!byAccount[accountKey]) {
      byAccount[accountKey] = legacyStored ? JSON.parse(legacyStored) : [...defaultSavingsData];
      localStorage.setItem(STORAGE_KEYS.savingsByAccount, JSON.stringify(byAccount));
    }

    return byAccount[accountKey].map(normalizeEntry);
  } catch (_error) {
    const resetData = { [accountKey]: [...defaultSavingsData] };
    localStorage.setItem(STORAGE_KEYS.savingsByAccount, JSON.stringify(resetData));
    return [...defaultSavingsData];
  }
}

function saveSavingsData(data) {
  const currentUser = getCurrentUser();
  const accountKey = normalizeAccountKey(currentUser?.email);
  const byAccountStored = localStorage.getItem(STORAGE_KEYS.savingsByAccount);
  let byAccount = {};

  try {
    byAccount = byAccountStored ? JSON.parse(byAccountStored) : {};
  } catch (_error) {
    byAccount = {};
  }

  byAccount[accountKey] = data.map(normalizeEntry);
  localStorage.setItem(STORAGE_KEYS.savingsByAccount, JSON.stringify(byAccount));
}

function setAuthState(user) {
  localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(user));
}

function isLoggedIn() {
  const user = getCurrentUser();
  return Boolean(user?.loggedIn && user?.email);
}

function getCurrentUser() {
  const stored = localStorage.getItem(STORAGE_KEYS.auth);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed === "string") return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function clearAuthState() {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

function getProfilesByAccount() {
  const stored = localStorage.getItem(STORAGE_KEYS.profilesByAccount);
  if (!stored) return {};

  try {
    return JSON.parse(stored);
  } catch (_error) {
    return {};
  }
}

function saveProfilesByAccount(profiles) {
  localStorage.setItem(STORAGE_KEYS.profilesByAccount, JSON.stringify(profiles));
}

function getCurrentUserProfile() {
  const user = getCurrentUser();
  const accountKey = normalizeAccountKey(user?.email);
  const profiles = getProfilesByAccount();
  return profiles[accountKey] || {};
}

function saveCurrentUserProfile(profilePatch) {
  const user = getCurrentUser();
  const accountKey = normalizeAccountKey(user?.email);
  const profiles = getProfilesByAccount();
  profiles[accountKey] = {
    ...(profiles[accountKey] || {}),
    ...profilePatch
  };
  saveProfilesByAccount(profiles);
}

function applyAvatarToElement(element, profile, fallbackText) {
  if (!element) return;

  if (profile.photo) {
    element.textContent = "";
    element.style.backgroundImage = `url(${profile.photo})`;
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";
    element.classList.add("has-photo");
    return;
  }

  element.textContent = profile.avatar || fallbackText;
  element.style.backgroundImage = "";
  element.style.backgroundSize = "";
  element.style.backgroundPosition = "";
  element.classList.remove("has-photo");
}

function renderUserUI() {
  const user = getCurrentUser();
  if (!user?.email) return;

  const displayName = getDisplayName(user.email);
  const currentProfile = getCurrentUserProfile();
  const avatarValue = currentProfile.avatar || getInitialFromEmail(user.email);
  const userLabel = document.getElementById("currentUserLabel");
  const userAvatar = document.getElementById("currentUserAvatar");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAvatar = document.getElementById("profileAvatar");

  if (userLabel) userLabel.textContent = user.email;
  applyAvatarToElement(userAvatar, currentProfile, avatarValue);
  if (profileName) profileName.textContent = displayName;
  if (profileEmail) profileEmail.textContent = user.email;
  applyAvatarToElement(profileAvatar, currentProfile, avatarValue);
}

function setupProfileOptions() {
  const avatarOptions = document.querySelectorAll(".avatar-option");
  const avatarMessage = document.getElementById("avatarMessage");
  const avatarUpload = document.getElementById("avatarUpload");
  const removePhotoButton = document.getElementById("removePhotoButton");
  if (!avatarOptions.length) return;

  const currentProfile = getCurrentUserProfile();
  const currentAvatar = currentProfile.avatar || getInitialFromEmail(getCurrentUser()?.email);

  avatarOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.avatar === currentAvatar);

    option.addEventListener("click", () => {
      const avatarValue = option.dataset.avatar || "A";
      saveCurrentUserProfile({ avatar: avatarValue, photo: "" });
      renderUserUI();

      avatarOptions.forEach((item) => {
        item.classList.toggle("active", item.dataset.avatar === avatarValue);
      });

      if (avatarMessage) {
        avatarMessage.textContent = "Profile photo updated.";
        avatarMessage.classList.remove("error");
      }
    });
  });

  if (avatarUpload) {
    avatarUpload.addEventListener("change", () => {
      const selectedFile = avatarUpload.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.type.startsWith("image/")) {
        if (avatarMessage) {
          avatarMessage.textContent = "Please choose an image file.";
          avatarMessage.classList.add("error");
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        saveCurrentUserProfile({ photo: result });
        renderUserUI();
        if (avatarMessage) {
          avatarMessage.textContent = "Profile photo uploaded.";
          avatarMessage.classList.remove("error");
        }
      };
      reader.readAsDataURL(selectedFile);
    });
  }

  if (removePhotoButton) {
    removePhotoButton.addEventListener("click", () => {
      saveCurrentUserProfile({ photo: "" });
      renderUserUI();
      if (avatarUpload) avatarUpload.value = "";
      if (avatarMessage) {
        avatarMessage.textContent = "Profile photo removed.";
        avatarMessage.classList.remove("error");
      }
    });
  }
}

function updateSummaryUI(data) {
  const total = data.reduce((sum, entry) => sum + entry.amount, 0);
  const { shortMonth, fullMonth } = getCurrentMonthInfo();
  const monthlyTotal = data
    .filter((entry) => entry.month === shortMonth)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const goal = 10000;
  const progress = Math.min((monthlyTotal / goal) * 100, 100);

  const totalSavings = document.getElementById("totalSavings");
  const monthlySavings = document.getElementById("monthlySavings");
  const monthlyLabel = document.getElementById("monthlyLabel");
  const historySummary = document.getElementById("historySummary");
  const historyMonthLabel = document.getElementById("historyMonthLabel");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const entryCount = document.getElementById("entryCount");

  if (totalSavings) totalSavings.textContent = formatRupees(total);
  if (monthlySavings) monthlySavings.textContent = formatRupees(monthlyTotal);
  if (monthlyLabel) monthlyLabel.textContent = fullMonth;
  if (historySummary) historySummary.textContent = total.toLocaleString("en-IN");
  if (historyMonthLabel) historyMonthLabel.textContent = fullMonth;
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${Math.round(progress)}% of your goal reached`;
  if (entryCount) entryCount.textContent = String(data.length);
}

function renderHistory(data) {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = "";
  if (data.length === 0) {
    historyList.innerHTML = '<p class="empty-history">No savings yet. Add your first entry.</p>';
    return;
  }

  data.forEach((entry, index) => {
    const item = document.createElement("article");
    item.className = "history-item";
    const sourceIndex = Number.isInteger(entry.sourceIndex) ? entry.sourceIndex : index;
    item.innerHTML = `
      <div class="history-date">
        <strong>${entry.day}</strong>
        <span>${entry.month}</span>
      </div>
      <div class="history-meta">
        <p>${entry.note}</p>
        <small>${entry.time}</small>
      </div>
      <div class="history-actions">
        <div class="history-amount">${formatRupees(entry.amount)}</div>
        <button type="button" class="delete-entry-button" data-entry-index="${sourceIndex}" aria-label="Delete savings entry">Delete</button>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function setupHistoryActions(data, getVisibleEntries, refreshHistoryView) {
  const historyList = document.getElementById("historyList");
  const pageMessage = document.getElementById("pageMessage");
  if (!historyList) return;

  historyList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-entry-button");
    if (!deleteButton) return;

    const entryIndex = Number(deleteButton.dataset.entryIndex);
    if (!Number.isInteger(entryIndex) || entryIndex < 0 || entryIndex >= data.length) return;

    data.splice(entryIndex, 1);
    saveSavingsData(data);
    refreshHistoryView();
    updateSummaryUI(data);

    if (pageMessage) {
      pageMessage.textContent = "Savings entry deleted.";
      pageMessage.classList.remove("error");
    }
  });
}

function setupMonthlyHistory(data) {
  const monthLabel = document.getElementById("historyMonthLabel");
  const monthSummary = document.getElementById("historySummary");
  const prevButton = document.getElementById("historyPrevMonth");
  const nextButton = document.getElementById("historyNextMonth");
  if (!monthLabel || !monthSummary || !prevButton || !nextButton) return null;

  let selectedMonth = new Date();

  function getVisibleEntries() {
    const monthIndex = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    return data
      .map((entry, index) => ({ ...entry, sourceIndex: index }))
      .filter((entry) => getEntryMonthIndex(entry) === monthIndex && entry.year === year);
  }

  function refreshHistoryView() {
    const visibleEntries = getVisibleEntries();
    monthLabel.textContent = formatMonthYear(selectedMonth);
    monthSummary.textContent = visibleEntries.reduce((sum, entry) => sum + entry.amount, 0).toLocaleString("en-IN");
    renderHistory(visibleEntries);
  }

  prevButton.addEventListener("click", () => {
    selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
    refreshHistoryView();
  });

  nextButton.addEventListener("click", () => {
    selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    refreshHistoryView();
  });

  refreshHistoryView();
  return { getVisibleEntries, refreshHistoryView };
}

function protectRoute() {
  const currentPage = document.body.dataset.page;
  if (currentPage && !isLoggedIn()) {
    window.location.href = "index.html";
    return true;
  }

  return false;
}

function setupLogin() {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const loginMessage = document.getElementById("loginMessage");
  const googleLoginButton = document.getElementById("googleLoginButton");

  function completeLogin(message, emailValue, provider = "email") {
    const normalizedEmail = normalizeAccountKey(emailValue);
    if (loginMessage) {
      loginMessage.textContent = message;
      loginMessage.classList.remove("error");
    }
    setAuthState({
      loggedIn: true,
      email: normalizedEmail,
      provider
    });
    window.location.href = "home.html";
  }

  if (isLoggedIn() && loginMessage) {
    const currentUser = getCurrentUser();
    loginMessage.textContent = `You are already logged in as ${currentUser.email}. Sign in again or open Home.`;
  }

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPasswordField = passwordInput.type === "password";
      passwordInput.type = isPasswordField ? "text" : "password";
      togglePassword.textContent = isPasswordField ? "Hide" : "Show";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      completeLogin(
        "Login successful. Opening your savings app...",
        emailInput?.value || "hello@smartsave.app",
        "email"
      );
    });
  }

  if (googleLoginButton) {
    googleLoginButton.addEventListener("click", () => {
      completeLogin(
        "Google sign-in successful. Opening your savings app...",
        emailInput?.value || "google.user@smartsave.app",
        "google"
      );
    });
  }
}

function setupLogout() {
  const logoutButton = document.getElementById("logoutButton");
  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {
    clearAuthState();
    window.location.href = "index.html";
  });
}

function setupAddForm(data) {
  const savingsForm = document.getElementById("savingsForm");
  if (!savingsForm) return;

  const amountInput = document.getElementById("amountInput");
  const noteInput = document.getElementById("noteInput");
  const selectedDate = document.getElementById("selectedDate");
  const saveButton = document.getElementById("saveButton");
  const amountChips = document.querySelectorAll(".amount-chip");
  const formMessage = document.getElementById("formMessage");
  const calendarDays = document.getElementById("calendarDays");
  const calendarMonthLabel = document.getElementById("calendarMonthLabel");
  const prevMonthButton = document.getElementById("prevMonthButton");
  const nextMonthButton = document.getElementById("nextMonthButton");
  const { fullDate } = getCurrentMonthInfo();
  let activeDate = new Date();
  let calendarDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);

  selectedDate.value = fullDate;
  selectedDate.dataset.iso = activeDate.toISOString();
  noteInput.value = "";

  amountChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      amountInput.value = chip.dataset.amount || "0";
      amountInput.focus();
    });
  });

  function renderCalendar() {
    if (!calendarDays || !calendarMonthLabel) return;

    calendarMonthLabel.textContent = formatMonthYear(calendarDate);
    calendarDays.innerHTML = "";

    const firstDayIndex = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
    const prevMonthDays = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 0).getDate();

    for (let i = 0; i < firstDayIndex; i += 1) {
      const dayCell = document.createElement("button");
      dayCell.type = "button";
      dayCell.className = "calendar-day muted";
      dayCell.textContent = String(prevMonthDays - firstDayIndex + i + 1);
      calendarDays.appendChild(dayCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayCell = document.createElement("button");
      dayCell.type = "button";
      dayCell.className = "calendar-day";
      dayCell.textContent = String(day);

      const candidateDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      if (
        candidateDate.getDate() === activeDate.getDate() &&
        candidateDate.getMonth() === activeDate.getMonth() &&
        candidateDate.getFullYear() === activeDate.getFullYear()
      ) {
        dayCell.classList.add("selected-day");
      }

      dayCell.addEventListener("click", () => {
        activeDate = candidateDate;
        selectedDate.value = formatFullDate(candidateDate);
        selectedDate.dataset.iso = candidateDate.toISOString();
        renderCalendar();
      });

      calendarDays.appendChild(dayCell);
    }

    while (calendarDays.children.length < 35) {
      const dayCell = document.createElement("button");
      dayCell.type = "button";
      dayCell.className = "calendar-day muted";
      dayCell.textContent = String(calendarDays.children.length - (firstDayIndex + daysInMonth) + 1);
      calendarDays.appendChild(dayCell);
    }
  }

  if (prevMonthButton) {
    prevMonthButton.addEventListener("click", () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
      renderCalendar();
    });
  }

  if (nextMonthButton) {
    nextMonthButton.addEventListener("click", () => {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  renderCalendar();

  function submitSavings(event) {
    event.preventDefault();

    if (formMessage) {
      formMessage.textContent = "";
      formMessage.classList.remove("error");
    }

    const amountValue = parseAmount(amountInput.value);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      if (formMessage) {
        formMessage.textContent = "Enter a valid savings amount like 100 or 200.";
        formMessage.classList.add("error");
      }
      amountInput.focus();
      return;
    }

    const noteValue = noteInput.value.trim() || "New savings added";
    const isoDate = selectedDate.dataset.iso || new Date().toISOString();
    const savedDate = new Date(isoDate);
    const day = String(savedDate.getDate());
    const month = savedDate.toLocaleString("en-IN", { month: "short" });

    data.unshift({
      day,
      month,
      year: savedDate.getFullYear(),
      note: noteValue,
      amount: amountValue,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    });

    saveSavingsData(data);
    sessionStorage.setItem("smart-savings-message", "Savings added successfully.");
    window.location.href = "history.html";
  }

  savingsForm.addEventListener("submit", submitSavings);

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      if (typeof savingsForm.requestSubmit === "function") {
        savingsForm.requestSubmit();
      } else {
        savingsForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    });
  }
}

function initDashboard() {
  if (protectRoute()) return;
  setupLogout();
  renderUserUI();
  setupProfileOptions();

  const data = getSavingsData();
  updateSummaryUI(data);
  const monthlyHistory = setupMonthlyHistory(data);
  if (!monthlyHistory) {
    renderHistory(data);
  }
  setupHistoryActions(
    data,
    monthlyHistory?.getVisibleEntries,
    monthlyHistory?.refreshHistoryView || (() => renderHistory(data))
  );
  setupAddForm(data);

  const flashMessage = sessionStorage.getItem("smart-savings-message");
  const pageMessage = document.getElementById("pageMessage");
  if (flashMessage && pageMessage) {
    pageMessage.textContent = flashMessage;
    pageMessage.classList.remove("error");
    sessionStorage.removeItem("smart-savings-message");
  }
}

if (document.getElementById("loginForm")) {
  setupLogin();
} else {
  initDashboard();
}

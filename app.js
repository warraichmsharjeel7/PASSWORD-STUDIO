const passwordInput = document.getElementById("passwordInput");
const lengthSlider = document.getElementById("lengthSlider");
const lengthValue = document.getElementById("lengthValue");
const generateBtn = document.getElementById("generateBtn");
const refreshBtn = document.getElementById("refreshBtn");
const copyBtn = document.getElementById("copyBtn");
const copyText = document.getElementById("copyText");
const visibilityBtn = document.getElementById("visibilityBtn");
const strengthText = document.getElementById("strengthText");
const strengthMeter = document.getElementById("strengthMeter");
const strengthMessage = document.getElementById("strengthMessage");
const charCount = document.getElementById("charCount");
const themeSelect = document.getElementById("themeSelect");
const toast = document.getElementById("toast");

const options = {
  upper: document.getElementById("upperToggle"),
  lower: document.getElementById("lowerToggle"),
  numbers: document.getElementById("numberToggle"),
  symbols: document.getElementById("symbolToggle"),
  exclude: document.getElementById("excludeToggle")
};
const sets = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?"
};
const similar = /[ilLoO01]/g;
let visible = true;
let toastTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}

function secureIndex(max) {
  if (max < 1) throw new Error("Empty character pool");
  const buffer = new Uint32Array(1);
  const ceiling = Math.floor(0x100000000 / max) * max;
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= ceiling);
  return buffer[0] % max;
}

function randomChar(pool) {
  return pool[secureIndex(pool.length)];
}

function secureShuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function chosenSets() {
  return Object.keys(sets).filter(key => options[key].checked).map(key => {
    const pool = options.exclude.checked ? sets[key].replace(similar, "") : sets[key];
    return pool;
  }).filter(pool => pool.length > 0);
}

function generatePassword() {
  const pools = chosenSets();
  if (!pools.length) {
    notify("Please select at least one character type.");
    return;
  }
  const length = Number(lengthSlider.value);
  const all = pools.join("");
  const chars = pools.map(pool => randomChar(pool));
  while (chars.length < length) chars.push(randomChar(all));
  passwordInput.value = secureShuffle(chars).join("");
  passwordInput.type = visible ? "text" : "password";
  analyzePassword();
  copyText.textContent = "Copy";
}

function updateRequirement(id, valid) {
  document.getElementById(id).classList.toggle("valid", valid);
}

function analyzePassword() {
  const value = passwordInput.value;
  const tests = [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value)
  ];
  updateRequirement("reqLength", tests[0]);
  updateRequirement("reqUpper", tests[1]);
  updateRequirement("reqLower", tests[2]);
  updateRequirement("reqNumber", tests[3]);
  updateRequirement("reqSymbol", tests[4]);
  charCount.textContent = `${value.length} ${value.length === 1 ? "char" : "chars"}`;

  if (!value) {
    setStrength(0, "Waiting...", "Start typing to analyze your password.");
    return;
  }

  // This is a practical on-page estimate, not a guarantee against every attack.
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (value.length >= 16) score++;
  const variety = [/[A-Z]/.test(value), /[a-z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  if (variety >= 3) score++;
  if (variety === 4 && value.length >= 12) score = 5;
  else if (value.length >= 20 && variety >= 3) score = 5;

  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const messages = [
    "Try a longer password with mixed character types.",
    "Add length and more character types to improve it.",
    "Getting there — try 12 or more characters.",
    "Good mix. A longer password may improve it further.",
    "Strong password pattern. Avoid reusing it elsewhere.",
    "Excellent mix and length. Keep it unique for each account."
  ];
  setStrength(score, labels[score], messages[score]);
}

function setStrength(score, label, message) {
  strengthText.textContent = label;
  strengthMessage.textContent = message;
  strengthMeter.dataset.level = String(score);
  strengthMeter.setAttribute("aria-valuenow", String(score));
  const colors = ["var(--muted)", "#f17b91", "#ffbd79", "#d8df77", "#83df9e", "var(--good)"];
  strengthText.style.color = colors[score];
}

function updateSlider() {
  const min = Number(lengthSlider.min);
  const max = Number(lengthSlider.max);
  const value = Number(lengthSlider.value);
  const percent = ((value - min) / (max - min)) * 100;
  lengthValue.value = String(value);
  lengthValue.textContent = String(value);
  lengthSlider.style.background = `linear-gradient(90deg, var(--accent) ${percent}%, var(--line) ${percent}%)`;
}

async function copyPassword() {
  if (!passwordInput.value) {
    notify("Type or generate a password first.");
    passwordInput.focus();
    return;
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(passwordInput.value);
    } else {
      const oldType = passwordInput.type;
      passwordInput.type = "text";
      passwordInput.focus();
      passwordInput.select();
      const ok = document.execCommand("copy");
      passwordInput.setSelectionRange(passwordInput.value.length, passwordInput.value.length);
      passwordInput.type = oldType;
      if (!ok) throw new Error("Clipboard unavailable");
    }
    copyText.textContent = "Copied!";
    notify("Password copied to clipboard.");
    setTimeout(() => { copyText.textContent = "Copy"; }, 1700);
  } catch {
    notify("Clipboard blocked. Select the password and copy it manually.");
  }
}

function togglePasswordVisibility() {
  visible = !visible;
  passwordInput.type = visible ? "text" : "password";
  visibilityBtn.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  visibilityBtn.title = visible ? "Hide password" : "Show password";
}

function applyTheme(theme) {
  const allowed = ["midnight", "aurora", "sunset", "light"];
  const chosen = allowed.includes(theme) ? theme : "midnight";
  document.body.dataset.theme = chosen;
  document.querySelector('meta[name="theme-color"]').content = chosen === "light" ? "#f3f5ff" : chosen === "aurora" ? "#071b20" : chosen === "sunset" ? "#21101d" : "#101329";
  try { localStorage.setItem("prism-theme", chosen); } catch {}
}

lengthSlider.addEventListener("input", updateSlider);
generateBtn.addEventListener("click", generatePassword);
refreshBtn.addEventListener("click", generatePassword);
copyBtn.addEventListener("click", copyPassword);
visibilityBtn.addEventListener("click", togglePasswordVisibility);
passwordInput.addEventListener("input", analyzePassword);
themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));

for (const key of ["upper", "lower", "numbers", "symbols", "exclude"]) {
  options[key].addEventListener("change", () => {
    if (passwordInput.value && key !== "exclude" || passwordInput.value && key === "exclude") generatePassword();
  });
}

try {
  const savedTheme = localStorage.getItem("prism-theme");
  if (savedTheme && ["midnight", "aurora", "sunset", "light"].includes(savedTheme)) {
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
  }
} catch {}

updateSlider();
analyzePassword();

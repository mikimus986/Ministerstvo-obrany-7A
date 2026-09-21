const USER_KEY = "hlasovani_current_user";
const CREATOR_NAMES = ["Mikuláš Musialek", "Miroslav Štrop", "Vojtěch Laichman"];
const POLLS_KEY = "hlasovani_polls";

const authView = document.getElementById("authView");
const mainView = document.getElementById("mainView");
const nameInput = document.getElementById("nameInput");
const loginBtn = document.getElementById("loginBtn");
const userBox = document.getElementById("userBox");
const pollList = document.getElementById("pollList");
const pollCount = document.getElementById("pollCount");
const createCard = document.getElementById("createCard");
const questionInput = document.getElementById("questionInput");
const options = document.getElementById("options");

let currentUser = localStorage.getItem(USER_KEY) || "";
let polls = JSON.parse(localStorage.getItem(POLLS_KEY) || "[]");

function save() {
  localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showApp() {
  authView.classList.add("hidden");
  mainView.classList.remove("hidden");
  userBox.textContent = "Přihlášen: " + currentUser;
  document.getElementById("newPollBtn").classList.toggle("hidden", !canCreatePoll());
  renderPolls();
}

function showAuth() {
  authView.classList.remove("hidden");
  mainView.classList.add("hidden");
  userBox.textContent = "";
}

function addOption(value = "") {
  const input = document.createElement("input");
  input.className = "pollOption";
  input.maxLength = 80;
  input.placeholder = "Možnost odpovědi";
  input.value = value;
  options.appendChild(input);
}

function resetCreate() {
  questionInput.value = "";
  options.innerHTML = "";
  addOption();
  addOption();
}

function canCreatePoll() {
  return CREATOR_NAMES.some(n => n.toLowerCase() === currentUser.toLowerCase());
}

function openCreate() {
  if (!canCreatePoll()) {
    alert("Ankety mohou vytvářet pouze povolení uživatelé.");
    return;
  }
  createCard.classList.remove("hidden");
  resetCreate();
  questionInput.focus();
}

function closeCreate() {
  createCard.classList.add("hidden");
}

function createPoll() {
  const question = questionInput.value.trim();
  const optionInputs = [...document.querySelectorAll(".pollOption")];
  const optionNames = optionInputs.map(x => x.value.trim()).filter(Boolean);

  if (!question) {
    alert("Zadej otázku.");
    return;
  }

  if (optionNames.length < 2) {
    alert("Hlasování musí mít alespoň 2 možnosti.");
    return;
  }

  const poll = {
    id: Date.now().toString(),
    question,
    options: optionNames.map((name, index) => ({
      id: String(index),
      name,
      votes: 0
    })),
    voters: [],
    creator: currentUser,
    created: new Date().toISOString()
  };

  polls.unshift(poll);
  save();
  closeCreate();
  renderPolls();
}

function hasVoted(poll) {
  return poll.voters.includes(currentUser.toLowerCase());
}

function vote(pollId, optionId) {
  const poll = polls.find(p => p.id === pollId);
  if (!poll || hasVoted(poll)) return;

  const option = poll.options.find(o => o.id === optionId);
  if (!option) return;

  option.votes++;
  poll.voters.push(currentUser.toLowerCase());
  save();
  renderPolls();
}

function deletePoll(id) {
  const poll = polls.find(p => p.id === id);
  if (!poll || poll.creator !== currentUser) return;

  if (!confirm("Opravdu chceš toto hlasování odstranit?")) return;

  polls = polls.filter(p => p.id !== id);
  save();
  renderPolls();
}

function renderPolls() {
  pollList.innerHTML = "";
  pollCount.textContent = `${polls.length} ${polls.length === 1 ? "hlasování" : "hlasování"}`;

  if (!polls.length) {
    pollList.innerHTML = `<div class="card"><p class="muted">Zatím zde není žádné hlasování.</p></div>`;
    return;
  }

  polls.forEach(poll => {
    const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
    const voted = hasVoted(poll);

    const article = document.createElement("article");
    article.className = "poll";

    let html = `
      <h3>${escapeHTML(poll.question)}</h3>
      <p class="small muted">Vytvořil: ${escapeHTML(poll.creator)} · Celkem hlasů: ${total}</p>
    `;

    if (!voted) {
      html += `<div class="voteOptions">`;
      poll.options.forEach(o => {
        html += `
          <label class="option">
            <input type="radio" name="poll-${poll.id}" value="${o.id}">
            <span>${escapeHTML(o.name)}</span>
          </label>`;
      });
      html += `
        <button class="voteBtn" data-id="${poll.id}">Hlasovat</button>
        </div>`;
    } else {
      html += `<p class="muted">✓ V tomto hlasování už jsi hlasoval.</p>`;
    }

    html += `<div class="results">`;
    poll.options.forEach(o => {
      const percent = total ? Math.round((o.votes / total) * 100) : 0;
      html += `
        <div class="resultLine">
          <span>${escapeHTML(o.name)}</span>
          <strong>${o.votes} (${percent} %)</strong>
        </div>
        <div class="barWrap"><div class="bar" style="width:${percent}%"></div></div>`;
    });
    html += `</div>`;

    if (poll.creator === currentUser) {
      html += `<button class="danger deleteBtn" data-id="${poll.id}">Odstranit hlasování</button>`;
    }

    article.innerHTML = html;
    pollList.appendChild(article);
  });

  document.querySelectorAll(".voteBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const poll = polls.find(p => p.id === btn.dataset.id);
      const selected = document.querySelector(`input[name="poll-${poll.id}"]:checked`);
      if (!selected) {
        alert("Vyber možnost.");
        return;
      }
      vote(poll.id, selected.value);
    });
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => deletePoll(btn.dataset.id));
  });
}

loginBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();

  if (name.length < 2) {
    alert("Jméno musí mít alespoň 2 znaky.");
    return;
  }

  currentUser = name;
  localStorage.setItem(USER_KEY, currentUser);
  showApp();
});

nameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") loginBtn.click();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  currentUser = "";
  localStorage.removeItem(USER_KEY);
  showAuth();
});

document.getElementById("newPollBtn").addEventListener("click", openCreate);
document.getElementById("addOptionBtn").addEventListener("click", () => addOption());
document.getElementById("createBtn").addEventListener("click", createPoll);
document.getElementById("cancelCreateBtn").addEventListener("click", closeCreate);

if (currentUser) showApp();

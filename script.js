const rulesModal = document.getElementById("rulesModal");
const openRules = document.getElementById("openRules");
const closeRules = document.getElementById("closeRules");

// mostra
function showRules() {
  rulesModal.style.display = "flex";
}

// nascondi
function hideRules() {
  rulesModal.style.display = "none";
}

// eventi
openRules.onclick = showRules;
closeRules.onclick = hideRules;

// chiudi regole
closeRules.onclick = () => {
  rulesModal.classList.add("hidden");
};

// riapri regole
openRules.onclick = () => {
  rulesModal.classList.remove("hidden");
};

function showRules() {
  rulesModal.classList.remove("hidden");
}

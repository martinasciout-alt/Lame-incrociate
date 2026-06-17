let choice1 = null;
let choice2 = null;

let score1 = 0;
let score2 = 0;

let round = 1;
let locked = false;

// =========================
// 🎵 AUDIO
// =========================

const bgMusic = new Audio("sottofondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;
bgMusic.preload = "auto";

const clickSound = new Audio("carta.wav");
clickSound.volume = 1;

const winSound = new Audio("vittoria.mp3");
winSound.volume = 1;

const drawSound = new Audio("pareggio.mp3");
drawSound.volume = 1;

const countdownSound = new Audio("countdown.mp3");
countdownSound.volume = 0.8;
countdownSound.preload = "auto";

let musicStarted = false;

// =========================
// 🎵 MUSICA
// =========================
window.startMusic = function () {
  if (musicStarted) return;

  bgMusic.currentTime = 0;

  bgMusic.play()
    .then(() => musicStarted = true)
    .catch(() => {});
};

document.addEventListener("click", function firstMusicTrigger() {
  if (musicStarted) return;

  bgMusic.play()
    .then(() => musicStarted = true)
    .catch(() => {});

  document.removeEventListener("click", firstMusicTrigger);
});

// =========================
// 🔊 CLICK
// =========================
function playClick() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

// =========================
// 🃏 SCELTA CARTE
// =========================
function choose(player, value) {
  if (locked) return;

  playClick();

  if (player === 1) {
    choice1 = value;
    document.getElementById("choice1").innerText = value;

    document.getElementById("cardP1").innerHTML =
      '<img src="retro-carta.webp" alt="card">';
  } else {
    choice2 = value;
    document.getElementById("choice2").innerText = value;

    document.getElementById("cardP2").innerHTML =
      '<img src="retro-carta.webp" alt="card">';
  }

  checkReady();
}

// =========================
// CHECK
// =========================
function checkReady() {
  if (choice1 !== null && choice2 !== null) {
    startReveal();
  }
}

// =========================
// ⏳ COUNTDOWN (FIX STABILE)
// =========================
function startReveal() {
  locked = true;

  let countdown = 3;
  const cd = document.getElementById("countdown");

  cd.innerText = countdown;

  // suono countdown UNA SOLA VOLTA
  countdownSound.pause();
  countdownSound.currentTime = 0;
  countdownSound.play().catch(() => {});

  const interval = setInterval(() => {
    countdown--;

    if (countdown > 0) {
      cd.innerText = countdown;
    } else {
      clearInterval(interval);

      // 🔥 FIX IMPORTANTE: micro-delay per DOM
      setTimeout(() => {
        reveal();
      }, 120);
    }
  }, 1000);
}

// =========================
// 🎴 REVEAL (FIX CARTE)
// =========================
function reveal() {
  const result = document.getElementById("result");

  // 🔥 DEBUG (puoi togliere dopo)
  console.log("CHOICES:", choice1, choice2);

  document.getElementById("cardP1").innerHTML =
    `<img src="carta-${choice1}.webp" alt="card">`;

  document.getElementById("cardP2").innerHTML =
    `<img src="carta-${choice2}.webp" alt="card">`;

  if (choice1 > choice2) {
    score1++;
    result.innerHTML = '<span class="p1">Player 1 vince il turno!</span>';
  } 
  else if (choice2 > choice1) {
    score2++;
    result.innerHTML = '<span class="p2">Player 2 vince il turno!</span>';
  } 
  else {
    result.innerText = "🤝 Pareggio!";
    drawSound.currentTime = 0;
    drawSound.play().catch(() => {});
  }

  document.getElementById("score1").innerText = score1;
  document.getElementById("score2").innerText = score2;

  checkEndRound();
}

// =========================
// 🔁 ROUND
// =========================
function checkEndRound() {
  if (round >= 3) {
    endGame();
  } else {
    round++;
    document.getElementById("round").innerText = round;
  }
}

// =========================
// 🏆 FINE GIOCO
// =========================
function endGame() {
  locked = true;

  let final;

  if (score1 > score2) {
    winSound.currentTime = 0;
    winSound.play().catch(() => {});
    final = "🏆 Player 1 vince la partita!";
  } 
  else if (score2 > score1) {
    winSound.currentTime = 0;
    winSound.play().catch(() => {});
    final = "🏆 Player 2 vince la partita!";
  } 
  else {
    drawSound.currentTime = 0;
    drawSound.play().catch(() => {});
    final = "🤝 Pareggio finale!";
  }

  document.getElementById("finalText").innerText = final;
  document.getElementById("overlay").classList.remove("hidden");
}

// =========================
// 🔄 RESET ROUND
// =========================
function resetRound() {
  choice1 = null;
  choice2 = null;
  locked = false;

  document.getElementById("choice1").innerText = "-";
  document.getElementById("choice2").innerText = "-";
  document.getElementById("countdown").innerText = "Pronto";
  document.getElementById("result").innerText = "";

  document.getElementById("cardP1").innerHTML = "";
  document.getElementById("cardP2").innerHTML = "";
}

// =========================
// NEXT ROUND
// =========================
function nextRound() {
  resetRound();
}

// =========================
// 🔁 RESTART
// =========================
function restartGame() {
  score1 = 0;
  score2 = 0;
  round = 1;
  locked = false;

  choice1 = null;
  choice2 = null;

  document.getElementById("score1").innerText = 0;
  document.getElementById("score2").innerText = 0;
  document.getElementById("round").innerText = 1;

  document.getElementById("overlay").classList.add("hidden");

  resetRound();
}

// =========================
// EXPORT
// =========================
window.startMusic = startMusic;
window.choose = choose;
window.nextRound = nextRound;
window.restartGame = restartGame;

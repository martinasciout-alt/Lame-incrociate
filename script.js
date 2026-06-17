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

const clickSound = new Audio("carta.wav");
clickSound.volume = 1;

const winSound = new Audio("vittoria.mp3");
winSound.volume = 1;

const drawSound = new Audio("pareggio.mp3");
drawSound.volume = 1;

const countdownSound = new Audio("countdown.mp3");
countdownSound.volume = 0.8;

let musicStarted = false;

// =========================
// 🎵 MUSICA
// =========================
window.startMusic = function () {
  if (musicStarted) return;

  bgMusic.play().then(() => {
    musicStarted = true;
  }).catch(() => {});
};

document.addEventListener("click", function firstMusicTrigger() {
  if (musicStarted) return;

  bgMusic.play().then(() => {
    musicStarted = true;
  }).catch(() => {});

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

    // 🔥 MOSTRA RETRO SUBITO
    document.getElementById("cardP1").innerHTML =
      '<img src="retro-carta.webp">';
  }

  if (player === 2) {
    choice2 = value;
    document.getElementById("choice2").innerText = value;

    // 🔥 MOSTRA RETRO SUBITO
    document.getElementById("cardP2").innerHTML =
      '<img src="retro-carta.webp">';
  }

  checkReady();
}

// =========================
// CHECK PRONTI
// =========================
function checkReady() {
  if (choice1 !== null && choice2 !== null) {
    startReveal();
  }
}

// =========================
// ⏳ COUNTDOWN (FIX PERFETTO)
// =========================
function startReveal() {
  locked = true;

  let countdown = 3;
  const cd = document.getElementById("countdown");

  cd.innerText = countdown;

  // 🔥 SUONO UNA SOLA VOLTA
  countdownSound.currentTime = 0;
  countdownSound.play().catch(() => {});

  const interval = setInterval(() => {
    countdown--;

    if (countdown > 0) {
      cd.innerText = countdown;
    } else {
      clearInterval(interval);
      reveal();
    }
  }, 1000);
}

// =========================
// 🎴 REVEAL
// =========================
function reveal() {
  document.getElementById("cardP1").innerHTML =
    `<img src="carta-${choice1}.webp">`;

  document.getElementById("cardP2").innerHTML =
    `<img src="carta-${choice2}.webp">`;

  const result = document.getElementById("result");

  if (choice1 > choice2) {
    score1++;
    result.innerHTML = "Player 1 vince il turno!";
  } else if (choice2 > choice1) {
    score2++;
    result.innerHTML = "Player 2 vince il turno!";
  } else {
    result.innerHTML = "Pareggio!";
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

  if (score1 > score2) {
    winSound.play();
    document.getElementById("finalText").innerText =
      "🏆 Player 1 vince la partita!";
  } else if (score2 > score1) {
    winSound.play();
    document.getElementById("finalText").innerText =
      "🏆 Player 2 vince la partita!";
  } else {
    drawSound.play();
    document.getElementById("finalText").innerText =
      "🤝 Pareggio finale!";
  }

  document.getElementById("overlay").classList.remove("hidden");
}

// =========================
// RESET ROUND
// =========================
function resetRound() {
  choice1 = null;
  choice2 = null;
  locked = false;

  document.getElementById("choice1").innerText = "-";
  document.getElementById("choice2").innerText = "-";
  document.getElementById("countdown").innerText = "Pronto";

  document.getElementById("cardP1").innerHTML = "";
  document.getElementById("cardP2").innerHTML = "";
  document.getElementById("result").innerText = "";
}

// =========================
// NEXT ROUND
// =========================
function nextRound() {
  resetRound();
}

// =========================
// RESTART
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

// EXPORT
window.startMusic = startMusic;
window.choose = choose;
window.nextRound = nextRound;
window.restartGame = restartGame;

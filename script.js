let choice1 = null;
let choice2 = null;

let score1 = 0;
let score2 = 0;

let round = 1;
let locked = false;

// =========================
// 🎵 AUDIO
// =========================

// musica sottofondo
let bgMusic = new Audio("sottofondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;
bgMusic.preload = "auto";

// effetti
let clickSound = new Audio("carta.wav");
clickSound.volume = 1;

let winSound = new Audio("vittoria.mp3");
winSound.volume = 1;

let drawSound = new Audio("pareggio.mp3");
drawSound.volume = 1;

// stato
let musicStarted = false;

// =========================
// 🎵 MUSICA (SOLO BOTTONE)
// =========================
window.startMusic = function () {
  if (musicStarted) return;

  bgMusic.play()
    .then(() => {
      musicStarted = true;
      console.log("🎵 Musica avviata");
    })
    .catch(err => {
      console.log("❌ Errore musica:", err);
    });
};

// =========================
// 🎵 AUTO START (SOLO 1 VOLTA, SICURO)
// =========================
document.addEventListener("click", function firstMusicTrigger() {
  if (musicStarted) return;

  bgMusic.play()
    .then(() => {
      musicStarted = true;
      console.log("🎵 Musica partita al primo click");
    })
    .catch(() => {});

  document.removeEventListener("click", firstMusicTrigger);
});

// =========================
// SCELTA CARTE
// =========================
function choose(player, value) {
  if (locked) return;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});

  if (player === 1) {
    choice1 = value;
    document.getElementById("choice1").innerText = value;
    document.getElementById("cardP1").innerHTML = '<img src="retro-carta.webp">';
  } else {
    choice2 = value;
    document.getElementById("choice2").innerText = value;
    document.getElementById("cardP2").innerHTML = '<img src="retro-carta.webp">';
  }

  checkReady();
}

// =========================
// CONTROLLO
// =========================
function checkReady() {
  if (choice1 !== null && choice2 !== null) {
    startReveal();
  }
}

// =========================
// COUNTDOWN
// =========================
function startReveal() {
  locked = true;

  let countdown = 3;
  const cd = document.getElementById("countdown");
  cd.innerText = countdown;

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
// RIVELAZIONE
// =========================
function reveal() {
  const result = document.getElementById("result");

  document.getElementById("cardP1").innerHTML =
    `<img src="carta-${choice1}.webp">`;

  document.getElementById("cardP2").innerHTML =
    `<img src="carta-${choice2}.webp">`;

  if (choice1 > choice2) {
    score1++;
    result.innerHTML = '<span class="p1">Player 1 vince il turno!</span>';
    winSound.currentTime = 0;
    winSound.play().catch(() => {});
  } 
  else if (choice2 > choice1) {
    score2++;
    result.innerHTML = '<span class="p2">Player 2 vince il turno!</span>';
    winSound.currentTime = 0;
    winSound.play().catch(() => {});
  } 
  else {
    result.innerText = "🤝 Pareggio! Nessun punto.";
    drawSound.currentTime = 0;
    drawSound.play().catch(() => {});
  }

  document.getElementById("score1").innerText = score1;
  document.getElementById("score2").innerText = score2;

  checkEndRound();
}

// =========================
// ROUND
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
// FINE GIOCO
// =========================
function endGame() {
  locked = true;

  let final;

  if (score1 > score2) {
    final = "🏆 Player 1 vince la partita!";
  } else if (score2 > score1) {
    final = "🏆 Player 2 vince la partita!";
  } else {
    final = "🤝 Pareggio finale!";
  }

  document.getElementById("finalText").innerText = final;
  document.getElementById("overlay").classList.remove("hidden");
}

// =========================
// RESET
// =========================
function nextRound() {
  resetRound();
}

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

// EXPORT HTML
window.restartGame = restartGame;
window.startMusic = startMusic;
window.choose = choose;
window.nextRound = nextRound;

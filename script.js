let choice1 = null;
let choice2 = null;

let score1 = 0;
let score2 = 0;

let round = 1;
let locked = false;

function choose(player, value) {
  if (locked) return;

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

function checkReady() {
  if (choice1 !== null && choice2 !== null) {
    startReveal();
  }
}

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

function reveal() {
  const result = document.getElementById("result");

  document.getElementById("cardP1").innerHTML =
    `<img src="carta-${choice1}.webp" alt="card">`;

  document.getElementById("cardP2").innerHTML =
    `<img src="carta-${choice2}.webp" alt="card">`;

  if (choice1 > choice2) {
    score1++;
    result.innerHTML = '<span class="p1">Player 1 vince il turno!</span>';
  } else if (choice2 > choice1) {
    score2++;
    result.innerHTML = '<span class="p2">Player 2 vince il turno!</span>';
  } else {
    result.innerText = "Pareggio! Nessun punto.";
  }

  document.getElementById("score1").innerText = score1;
  document.getElementById("score2").innerText = score2;

  checkEndRound();
}

function checkEndRound() {
  if (round >= 3) {
    endGame();
  } else {
    round++;
    document.getElementById("round").innerText = round;
  }
}

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

function restartGame() {
  score1 = 0;
  score2 = 0;
  round = 1;
  locked = false;

  document.getElementById("score1").innerText = 0;
  document.getElementById("score2").innerText = 0;
  document.getElementById("round").innerText = 1;

  document.getElementById("overlay").classList.add("hidden");

  resetRound();
}

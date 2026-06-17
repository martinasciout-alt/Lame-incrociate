let choice1 = null;
let choice2 = null;

let score1 = 0;
let score2 = 0;

let round = 1;
let locked = false;

// 🎵 MUSICA
let bgMusic = new Audio("sottofondo.wav");
bgMusic.loop = true;
bgMusic.volume = 0.4;

// 🎵 CLICK
let clickSound = new Audio("carta.wav");
clickSound.volume = 1;

// =========================
// 🎵 MUSICA START
// =========================
function startMusic() {
  bgMusic.play()
    .then(() => {
      console.log("Musica avviata");
    })
    .catch(err => {
      console.log("Errore audio:", err);
    });
}

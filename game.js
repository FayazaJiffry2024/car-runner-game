const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const carImage = new Image();
carImage.src = "assets/car.png";

const coneImage = new Image();
coneImage.src = "assets/cone.png";

const barrierImage = new Image();
barrierImage.src = "assets/barrier.png";

const stoneImage = new Image(); // NEW
stoneImage.src = "assets/stone.png"; // NEW

const engineSound = new Audio("assets/sounds/engine.mp3");
engineSound.loop = true;

const crashSound = new Audio("assets/sounds/crash.mp3");

const player = {
  x: canvasWidth / 2 - 25,
  y: canvasHeight - 120,
  width: 50,
  height: 100,
  speed: 5,
  movingLeft: false,
  movingRight: false,
};

let obstacles = [];
let obstacleSpeed = 3;
let obstacleSpawnInterval = 1500;
let lastObstacleSpawn = 0;
let score = 0;
let gameOver = false;
let roadY = 0;
let roadScrollSpeed = 4;

let timeSinceStart = 0;
let lastSpeedIncrease = 0;

// Keyboard input
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") player.movingLeft = true;
  if (e.key === "ArrowRight") player.movingRight = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") player.movingLeft = false;
  if (e.key === "ArrowRight") player.movingRight = false;
});

// Obstacle class supports cone, barrier, and stone
class Obstacle {
  constructor(x, y, width, height, speed, type = "cone") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.type = type;
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    if (this.type === "cone") {
      ctx.drawImage(coneImage, this.x, this.y, this.width, this.height);
    } else if (this.type === "barrier") {
      ctx.drawImage(barrierImage, this.x, this.y, this.width, this.height);
    } else if (this.type === "stone") {
      ctx.drawImage(stoneImage, this.x, this.y, this.width, this.height);
    }
  }
}

function spawnObstacle() {
  const laneWidth = canvasWidth / 3;
  const lane = Math.floor(Math.random() * 3);
  const x = lane * laneWidth + (laneWidth - 40) / 2;

  // Randomly choose type
  const rand = Math.random();
  let type = "cone";
  let width = 40;
  let height = 60;

  if (rand < 0.6) {
    type = "cone";
    width = 40;
    height = 60;
  } else if (rand < 0.85) {
    type = "barrier";
    width = 60;
    height = 80;
  } else {
    type = "stone"; // NEW
    width = 50;
    height = 50;
  }

  obstacles.push(new Obstacle(x, -100, width, height, obstacleSpeed, type));
}

function isColliding(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
}

function drawRoad() {
  const laneWidth = canvas.width / 3;

  for (let i = 0; i < 2; i++) {
    const yPos = roadY + (i - 1) * canvas.height;

    ctx.fillStyle = "#555";
    ctx.fillRect(0, yPos, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.setLineDash([20, 20]);

    for (let lane = 1; lane < 3; lane++) {
      ctx.beginPath();
      ctx.moveTo(lane * laneWidth, yPos);
      ctx.lineTo(lane * laneWidth, yPos + canvas.height);
      ctx.stroke();
    }
  }

  ctx.setLineDash([]);
}

function update(deltaTime) {
  if (gameOver) return;

  timeSinceStart += deltaTime;

  // Increase difficulty every 5s
  if (timeSinceStart - lastSpeedIncrease >= 5000) {
    if (obstacleSpeed < 12) obstacleSpeed += 0.8;
    if (obstacleSpawnInterval > 600) obstacleSpawnInterval -= 100;
    if (roadScrollSpeed < 10) roadScrollSpeed += 0.7;
    lastSpeedIncrease = timeSinceStart;
  }

  if (player.movingLeft) player.x -= player.speed;
  if (player.movingRight) player.x += player.speed;

  // Bounds check
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvasWidth) player.x = canvasWidth - player.width;

  if (performance.now() - lastObstacleSpawn > obstacleSpawnInterval) {
    spawnObstacle();
    lastObstacleSpawn = performance.now();
  }

  obstacles.forEach((obstacle, index) => {
    obstacle.update();

    if (obstacle.y > canvasHeight) {
      obstacles.splice(index, 1);
      score++;
    }

    if (isColliding(player, obstacle)) {
      gameOver = true;
      engineSound.pause();
      engineSound.currentTime = 0;
      crashSound.play();
    }
  });

  roadY += roadScrollSpeed;
  if (roadY >= canvas.height) roadY = 0;
}

function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawRoad();
  obstacles.forEach((obstacle) => obstacle.draw());
  ctx.drawImage(carImage, player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvasWidth / 2 - 130, canvasHeight / 2);
  }
}

let lastTime = 0;
function gameLoop(timeStamp) {
  const deltaTime = timeStamp - lastTime;
  lastTime = timeStamp;

  update(deltaTime);
  draw();

  if (!gameOver) requestAnimationFrame(gameLoop);
}

function startGame() {
  document.getElementById("startScreen").style.display = "none";
  canvas.style.display = "block";
  engineSound.play();
  requestAnimationFrame(gameLoop);
}

window.onload = () => {
  document.getElementById("startButton").addEventListener("click", startGame);
};

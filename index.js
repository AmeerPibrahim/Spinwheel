const sectors = [
  { color: "#241e20", text: "#ffffff", label: "50   ", weight: 1  },
  { color: "#ec303d", text: "#ffffff", label: "100   ", weight: 2 },
  { color: "#241e20", text: "#ffffff", label: "150   ", weight: 30 },
  { color: "#ec303d", text: "#ffffff", label: "200   ", weight: 40 },
  { color: "#241e20", text: "#ffffff", label: "250   ", weight: 50 },
  { color: "#ec303d", text: "#ffffff", label: "300   ", weight: 60 },
  { color: "#241e20", text: "#ffffff", label: "350   ", weight: 70 },
  { color: "#ec303d", text: "#ffffff", label: "400   ", weight: 80 },
  { color: "#241e20", text: "#ffffff", label: "450   ", weight: 90 },
  { color: "#ec303d", text: "#ffffff", label: "500   ", weight: 100 },
];

const events = {
  listeners: {},
  addListener: function (eventName, fn) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(fn);
  },
  fire: function (eventName, ...args) {
    if (this.listeners[eventName]) {
      for (let fn of this.listeners[eventName]) {
        fn(...args);
      }
    }
  },
};

const tot = sectors.length;
const spinEl = document.querySelector("#spin");
const ctx = document.querySelector("#wheel").getContext("2d");
const dia = ctx.canvas.width;
const rad = dia / 2;
const PI = Math.PI;
const TAU = 2 * PI;
const arc = TAU / sectors.length;

const friction = 0.991; // 0.995=soft, 0.99=mid, 0.98=hard
let angVel = 0; // Angular velocity
let ang = 0; // Angle in radians

let spinButtonClicked = false;

const getIndex = () => Math.floor(tot - (ang / TAU) * tot) % tot;

// Calculate cumulative weights
const totalWeight = sectors.reduce((sum, sector) => sum + sector.weight, 0);
const cumulativeWeights = sectors.map(
  ((sum) => (sector) => (sum += sector.weight))(0)
);

function weightedRandomSector() {
  const rand = Math.random() * totalWeight;
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (rand < cumulativeWeights[i]) return i;
  }
  return 0; // Fallback (shouldn't happen)
}

function drawSector(sector, i) {
  const ang = arc * i;
  ctx.save();

  // COLOR
  ctx.beginPath();
  ctx.fillStyle = sector.color;
  ctx.moveTo(rad, rad);
  ctx.arc(rad, rad, rad, ang, ang + arc);
  ctx.lineTo(rad, rad);
  ctx.fill();

  // TEXT
  ctx.translate(rad, rad);
  ctx.rotate(ang + arc / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = sector.text;
  ctx.font = "bold 30px 'Lato', sans-serif";
  ctx.fillText(sector.label, rad - 10, 10);
  //

  ctx.restore();
}

function rotate() {
  const sector = sectors[getIndex()];
  ctx.canvas.style.transform = `rotate(${ang - PI / 2}rad)`;

  spinEl.textContent = !angVel ? "SPIN" : sector.label;
  spinEl.style.background = sector.color;
  spinEl.style.color = sector.text;
}

function frame() {
  // Fire an event after the wheel has stopped spinning
  if (!angVel && spinButtonClicked) {
    const finalSector = sectors[getIndex()];
    events.fire("spinEnd", finalSector);
    spinButtonClicked = false; // reset the flag
    return;
  }

  angVel *= friction; // Decrement velocity by friction
  if (angVel < 0.002) angVel = 0; // Bring to stop
  ang += angVel; // Update angle
  ang %= TAU; // Normalize angle
  rotate();
}

function engine() {
  frame();
  requestAnimationFrame(engine);
}

function init() {
  sectors.forEach(drawSector);
  rotate(); // Initial rotation
  engine(); // Start engine
  spinEl.addEventListener("click", () => {
    if (!angVel) {
      const selectedSectorIndex = weightedRandomSector();
      angVel = 0.35; // Set a fixed velocity for smoothness
      const targetAngle = arc * selectedSectorIndex;
      ang = targetAngle - Math.random() * arc; // Add slight randomness for natural feel
    }
    spinButtonClicked = true;
  });
}

// Select elements
const popup = document.querySelector("#popup");
const popupText = document.querySelector("#popup-text");
const closePopupButton = document.querySelector("#close-popup");

// Load sound effects
const winSound = new Audio('winsound.mp3'); // Winning sound
const tickSound = new Audio('sounds/tick.mp3');    // Tick sound

let tickInterval = null;

// Function to play tick-tick sound with dynamic timing
function playTickSound() {
  if (angVel > 0.01) { // Play sound only when wheel is spinning
    tickSound.currentTime = 0; // Reset sound to the start
    tickSound.play();
  }
}

// Trigger confetti effect
function triggerConfetti() {
  // Get the position of the popup element
  const popupRect = document.querySelector("#popup").getBoundingClientRect();

  // Calculate the center of the popup
  const centerX = popupRect.left + popupRect.width / 2;
  const centerY = popupRect.top + popupRect.height / 2;

  confetti({
    particleCount: 700,  // Increase particle count for a bigger effect
    spread: 700,  // Wider spread to cover more of the screen
    startVelocity: 50,  // Higher start velocity for a more dramatic burst
    origin: { 
      x: centerX / window.innerWidth,  // Normalized to the screen width (0 to 1)
      y: centerY / window.innerHeight  // Normalized to the screen height (0 to 1)
    },
    angle: 90,  // Spread horizontally
    colors: [
      '#ff4500', // Orange
      '#ffbb33', // Yellow
      '#4caf50', // Green
      '#2196f3', // Blue
      '#ff69b4', // Pink
      '#f44336', // Red
      '#8e44ad', // Purple
      '#f1c40f'  // Gold
    ],
    gravity: 1.5,  // Stronger downward pull for a dramatic fall
    drift: 0.1,    // Slight horizontal movement for randomness
    decay: 0.9,    // Gradually fade out particles
    shapes: ['square', 'circle', 'triangle'],  // Add variety to the confetti shapes
    zIndex: 9999    // Ensure the confetti is on top of all other elements
  });
}

// Add spin end listener
events.addListener("spinEnd", (sector) => {
  console.log(`Spin ended. You won: ${sector.label.trim()}`);
  
  // Update popup text
  popupText.textContent = `You won ${sector.label.trim()}!`;
  
  // Show the popup
  popup.showModal();
  
  // Play win sound
  winSound.currentTime = 0;
  winSound.play();

  // Trigger confetti
  triggerConfetti();
});

// Close popup on button click
closePopupButton.addEventListener("click", () => {
  popup.close(); // Hide the dialog
});

// Update frame function to include tick sound
function frame() {
  if (!angVel && spinButtonClicked) {
    const finalSector = sectors[getIndex()];
    events.fire("spinEnd", finalSector);
    spinButtonClicked = false; // Reset the flag
    clearInterval(tickInterval); // Stop tick sound
    return;
  }

  angVel *= friction; // Decrement velocity by friction
  if (angVel < 0.002) angVel = 0; // Bring to stop
  ang += angVel; // Update angle
  ang %= TAU; // Normalize angle
  rotate();

  // Adjust tick interval based on velocity
  const interval = Math.max(50, 200 - Math.floor(angVel * 5000)); // Dynamic interval
  clearInterval(tickInterval);
  tickInterval = setInterval(playTickSound, interval);
}

// Initialize the wheel
function init() {
  sectors.forEach(drawSector);
  rotate(); // Initial rotation
  engine(); // Start engine
  spinEl.addEventListener("click", () => {
    if (!angVel) {
      const selectedSectorIndex = weightedRandomSector();
      angVel = 0.35; // Set a fixed velocity for smoothness
      const targetAngle = arc * selectedSectorIndex;
      ang = targetAngle - Math.random() * arc; // Add slight randomness for natural feel

      // Start tick-tick sound immediately
      playTickSound();
      tickInterval = setInterval(playTickSound, 100); // Initial interval
    }
    spinButtonClicked = true;
  });
}

init();

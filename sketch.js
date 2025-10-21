let heading = 0;
let lastHeading = 0;
let lastTime = 0;
let turnRate = 0;
let rollAngle = 0;
let permissionGranted = false;

const maxRoll = 30;       // max roll in degrees
const maxTurnRate = 6;    // deg/sec corresponding to max roll (realistic: 6°/s = coordinated turn)
const smoothing = 0.08;   // smoothing factor (0-1, lower = smoother)
const deadzone = 0.3;     // ignore turn rates below this (deg/sec)

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  noStroke();

  const button = document.getElementById('enableMotion');
  button.addEventListener('click', async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        permissionGranted = true;
        button.style.display = 'none';
        lastTime = millis() / 1000;
      }
    } else {
      permissionGranted = true;
      button.style.display = 'none';
      lastTime = millis() / 1000;
    }
  });
}

function draw() {
  background(0);
  if (!permissionGranted) {
    fill(255);
    textAlign(CENTER, CENTER);
    text('Tap to enable sensors', width / 2, height / 2);
    return;
  }

  drawHorizon(rollAngle);
  drawIndicator();
}

function drawHorizon(roll) {
  push();
  translate(width / 2, height / 2);
  rotate(-roll);
  
  // Sky
  fill(80, 160, 255);
  rect(-width, -height, width*2, height);
  // Ground
  fill(180, 120, 60);
  rect(-width, 0, width*2, height);
  
  // Perspective lines to create depth
  drawPerspectiveLines();
  
  // Horizon line
  stroke(255);
  strokeWeight(4);
  line(-width, 0, width, 0);
  pop();
}

function drawPerspectiveLines() {
  stroke(255, 255, 255, 50); // Semi-transparent white
  strokeWeight(2);
  
  // Vanishing point is above the horizon (in the sky)
  const vanishX = 0;
  const vanishY = -height * 0.2; // Slightly above horizon for stronger perspective
  
  // Draw converging lines from bottom (foreground) to vanishing point, but only on ground
  const numLines = 9;
  const groundWidth = width * 1.5; // Width at the foreground
  
  for (let i = 0; i <= numLines; i++) {
    const startX = -groundWidth + (i / numLines) * groundWidth * 2;
    
    // Calculate where this line intersects the horizon (y=0)
    // Line equation: y = startY + t * (vanishY - startY), x = startX + t * (vanishX - startX)
    // At horizon: 0 = height*2 + t * (vanishY - height*2)
    const t = (0 - height * 2) / (vanishY - height * 2);
    const intersectX = startX + t * (vanishX - startX);
    
    // Draw line from foreground to horizon intersection only
    line(startX, height * 2, intersectX, 0);
  }
}

function drawIndicator() {
  fill(255);
  noStroke();
  triangle(
    width/2-20, height/2+60,
    width/2+20, height/2+60,
    width/2, height/2+30
  );

  textAlign(CENTER);
  textSize(16);
  text(`Heading: ${heading.toFixed(0)}°`, width/2, height-60);
  text(`Turn rate: ${turnRate.toFixed(1)}°/s`, width/2, height-40);
  text(`Roll: ${rollAngle.toFixed(1)}°`, width/2, height-20);
}

window.addEventListener('deviceorientation', (event) => {
  if (!permissionGranted) return;

  const now = millis() / 1000;
  const deltaTime = now - lastTime;

  // Use only absolute heading (yaw)
  const alpha = event.alpha || 0;

  // Shortest angle between headings, handling wrap-around
  const deltaHeading = ((alpha - lastHeading + 540) % 360) - 180;

  const instantTurnRate = deltaHeading / deltaTime;
  // Apply exponential smoothing to turn rate
  turnRate = turnRate * (1 - smoothing) + instantTurnRate * smoothing;
  
  // Apply deadzone - if turn rate is very small, treat as zero
  const filteredTurnRate = Math.abs(turnRate) < deadzone ? 0 : turnRate;
  
  // Map turn rate to roll angle, clamp to maxRoll
  // Negate to get correct banking direction: right turn = horizon tilts left (counter-clockwise)
  const targetRoll = -constrain((filteredTurnRate / maxTurnRate) * maxRoll, -maxRoll, maxRoll);
  // Apply smoothing to roll angle for smoother visual response
  rollAngle = rollAngle * (1 - smoothing) + targetRoll * smoothing;

  lastHeading = alpha;
  lastTime = now;
  heading = alpha;
});

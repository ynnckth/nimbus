let heading = 0;
let lastHeading = null; // null until first reading
let lastTime = 0;
let turnRate = 0;
let rollAngle = 0;
let permissionGranted = false;
let planeImg;

const maxRoll = 30;       // max roll in degrees
const maxTurnRate = 4;    // deg/sec corresponding to max roll (realistic: 3°/s = standard rate, 4°/s = steeper)
const smoothing = 0.03;   // smoothing factor (0-1, lower = smoother)
const deadzone = 0.3;     // ignore turn rates below this (deg/sec)

function preload() {
  planeImg = loadImage('assets/plane.png');
}

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
  drawCompass();
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

function drawCompass() {
  push();
  
  // Compass position and size
  const compassY = 80;
  const compassWidth = width * 0.8;
  const compassHeight = 60;
  const centerX = width / 2;
  
  // Draw compass background
  fill(0, 0, 0, 150);
  stroke(255);
  strokeWeight(2);
  rect(centerX - compassWidth/2, compassY - compassHeight/2, compassWidth, compassHeight, 10);
  
  // Draw compass tape (scrolling based on heading)
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(18);
  
  // Cardinal directions and their degree positions
  const directions = [
    {deg: 0, label: 'N'}, {deg: 45, label: 'NE'}, {deg: 90, label: 'E'}, 
    {deg: 135, label: 'SE'}, {deg: 180, label: 'S'}, {deg: 225, label: 'SW'},
    {deg: 270, label: 'W'}, {deg: 315, label: 'NW'}, {deg: 360, label: 'N'}
  ];
  
  // Degree marks
  const degreesVisible = 120; // Range of degrees visible
  const pixelsPerDegree = compassWidth / degreesVisible;
  
  for (let deg = Math.floor(heading - degreesVisible/2); deg <= heading + degreesVisible/2; deg += 10) {
    const normalizedDeg = ((deg % 360) + 360) % 360;
    const offset = (deg - heading) * pixelsPerDegree;
    const x = centerX + offset;
    
    if (x >= centerX - compassWidth/2 && x <= centerX + compassWidth/2) {
      // Draw tick marks
      stroke(255);
      strokeWeight(1);
      if (normalizedDeg % 30 === 0) {
        line(x, compassY - 15, x, compassY - 5);
      } else {
        line(x, compassY - 10, x, compassY - 5);
      }
    }
  }
  
  // Draw direction labels
  for (let dir of directions) {
    const offset = (dir.deg - heading) * pixelsPerDegree;
    const x = centerX + offset;
    
    // Wrap around for continuity
    const wrappedOffsets = [offset, offset + 360 * pixelsPerDegree, offset - 360 * pixelsPerDegree];
    
    for (let wrappedOffset of wrappedOffsets) {
      const wrappedX = centerX + wrappedOffset;
      if (wrappedX >= centerX - compassWidth/2 && wrappedX <= centerX + compassWidth/2) {
        fill(255);
        noStroke();
        text(dir.label, wrappedX, compassY + 8);
      }
    }
  }
  
  // Draw center indicator (triangle pointing down)
  fill(255, 200, 0);
  noStroke();
  triangle(centerX - 8, compassY - 25, centerX + 8, compassY - 25, centerX, compassY - 15);
  
  // Draw current heading number at top
  fill(255, 200, 0);
  textSize(20);
  text(`${Math.round(heading)}°`, centerX, compassY - 40);
  
  pop();
}

function drawPerspectiveLines() {
  stroke(255, 255, 255, 50); // Semi-transparent white
  strokeWeight(2);
  
  // Vanishing point is above the horizon (in the sky)
  const vanishX = 0;
  const vanishY = -height * 0.2; // Slightly above horizon for stronger perspective
  
  // Draw converging lines from bottom (foreground) to vanishing point, but only on ground
  const numLines = 25;
  const groundWidth = width * 3; // Width at the foreground (covers entire visible area)
  
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
  // Draw the plane icon
  push();
  imageMode(CENTER);
  const planeWidth = 225;
  const planeHeight = planeWidth * (planeImg.height / planeImg.width);
  image(planeImg, width/2, height/2, planeWidth, planeHeight);
  pop();

  // Draw debug info
  textAlign(CENTER);
  textSize(16);
  fill(255);
  text(`Heading: ${heading.toFixed(0)}°`, width/2, height-60);
  text(`Turn rate: ${turnRate.toFixed(1)}°/s`, width/2, height-40);
}

function handleOrientation(event) {
  if (!permissionGranted) return;

  const now = millis() / 1000;
  const deltaTime = now - lastTime;

  // Get true compass heading
  let alpha;
  if (event.webkitCompassHeading !== undefined) {
    // iOS: webkitCompassHeading gives true compass heading (0 = North)
    alpha = event.webkitCompassHeading;
  } else if (event.absolute && event.alpha !== null) {
    // Android with absolute orientation (compass-based)
    alpha = event.alpha;
  } else if (event.alpha !== null) {
    // Fallback to relative alpha
    alpha = event.alpha;
  } else {
    return; // No valid data
  }

  // Initialize on first reading
  if (lastHeading === null) {
    lastHeading = alpha;
    lastTime = now;
    heading = alpha;
    return;
  }

  // Shortest angle between headings, handling wrap-around
  const deltaHeading = ((alpha - lastHeading + 540) % 360) - 180;

  const instantTurnRate = deltaHeading / deltaTime;
  // Apply exponential smoothing to turn rate
  turnRate = turnRate * (1 - smoothing) + instantTurnRate * smoothing;
  
  // Apply deadzone - if turn rate is very small, treat as zero
  const filteredTurnRate = Math.abs(turnRate) < deadzone ? 0 : turnRate;
  
  // Map turn rate to roll angle, clamp to maxRoll
  // Right turn = horizon tilts left (counter-clockwise)
  const targetRoll = constrain((filteredTurnRate / maxTurnRate) * maxRoll, -maxRoll, maxRoll);
  // Apply smoothing to roll angle for smoother visual response
  rollAngle = rollAngle * (1 - smoothing) + targetRoll * smoothing;

  lastHeading = alpha;
  lastTime = now;
  heading = alpha;
}

// Listen to both absolute and regular orientation events for best compatibility
window.addEventListener('deviceorientationabsolute', handleOrientation, true);
window.addEventListener('deviceorientation', handleOrientation, true);

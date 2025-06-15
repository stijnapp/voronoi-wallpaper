let config = {
    dotsPer100Pixels: 0.5,
    dotCount: 75,
    speedMultiplier: 0.5,
    frameRateLimit: 60,
    backgroundColor: [0, 0, 0],
    borderColor: [222,222,222],
    cornerRadius: 10,
    glowSize: 8,
    glowAlpha: 80
};

let dots = [];
let lastTime = 0;
let delaunay, voronoi;
const CANVAS_PADDING = 50;

function setup() {
    createCanvas(windowWidth, windowHeight);
    generateRandomDots();
    frameRate(config.frameRateLimit);
    lastTime = millis();
}

function draw() {
    background(config.borderColor); // Set background color
    updateDots();
    drawVoronoiCells();
    // drawDebugDots(255, 0, 0);
    // drawDebugLines(255, 0, 0);
    // console.log(`FPS: ${frameRate().toFixed(2)}`);

    // draw the framerate as text in the top left corner
    fill(255);
    noStroke();
    textSize(16);
    text(`FPS: ${frameRate().toFixed(2)}`, 10, 20);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    generateRandomDots();
}

function generateRandomDots() {
    config.dotCount = Math.floor((width * height) / (100 * 100)) * config.dotsPer100Pixels;

    dots = [];
    for (let i = 0; i < config.dotCount; i++) {
        dots.push(generateRandomDot());
    }
}

function generateRandomDot() {
    return {
        x: random(width),
        y: random(height),
        direction: random(TWO_PI),
        speed: random(0.1, 0.3),
    };
}

function updateDots() {
    let currentTime = millis();
    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Convert deltaTime to seconds and use 60 FPS as baseline
    let timeMultiplier = deltaTime / (1000 / 60);

    for (let dot of dots) {
        let dx = cos(dot.direction) * dot.speed * config.speedMultiplier * timeMultiplier;
        let dy = sin(dot.direction) * dot.speed * config.speedMultiplier * timeMultiplier;
        dot.x += dx;
        dot.y += dy;

        // Bounce off edges
        if (dot.x < 0 || dot.x > width) {
            dot.direction = PI - dot.direction;
        }
        if (dot.y < 0 || dot.y > height) {
            dot.direction = -dot.direction;
        }

        // change direction slightly
        dot.direction += random(-0.05, 0.05);

        // change speed slightly
        dot.speed += random(-0.01, 0.01);
        dot.speed = constrain(dot.speed, 0.1, 0.3); // Keep speed within bounds

        // Keep dots within canvas bounds
        dot.x = constrain(dot.x, 0, width);
        dot.y = constrain(dot.y, 0, height);
    }
}

function drawVoronoiCells() {
    // Create points array from dots for d3-delaunay
    let points = [];
    for (let dot of dots) {
        points.push(dot.x, dot.y);
    }

    if (points.length < 6) return; // Need at least 3 points (6 coordinates)

    // Create Delaunay triangulation and Voronoi diagram
    delaunay = d3.Delaunay.from(dots.map(dot => [dot.x, dot.y]));
    voronoi = delaunay.voronoi([-CANVAS_PADDING, -CANVAS_PADDING, width + CANVAS_PADDING, height + CANVAS_PADDING]);

    // Draw Voronoi cells with smooth rounded corners
    stroke(config.borderColor);
    strokeWeight(2);
    fill(config.backgroundColor);

    for (let i = 0; i < dots.length; i++) {
        let cell = voronoi.cellPolygon(i);
        if (cell && cell.length > 2) {
            // beginShape();
            // for (let j = 0; j < cell.length; j++) {
            //     let v = cell[j];
            //     vertex(v[0], v[1]);
            // }
            // endShape(CLOSE);

            drawRoundedPolygon(cell);
        }
    }
}

function drawRoundedPolygon(points) {
    points.pop();
    if (points.length < 3) return;

    beginShape();

    // point halfway between the first and last point
    let first = points[0];
    let last = points[points.length - 1];
    let anchorX = first[0] + (last[0] - first[0]) * 0.5;
    let anchorY = first[1] + (last[1] - first[1]) * 0.5;
    vertex(anchorX, anchorY);

    // ellipse(anchorX, anchorY, 5, 5);

    for (let pointIndex = 1; pointIndex < points.length + 1; pointIndex++) {
        let prev = points[pointIndex - 1];
        let current = points[pointIndex % points.length];

        // start halfway between the previous and current point
        let anchorX = prev[0] + (current[0] - prev[0]) * 0.5;
        let anchorY = prev[1] + (current[1] - prev[1]) * 0.5;

        bezierVertex(prev[0], prev[1], prev[0], prev[1], anchorX, anchorY);
    }

    endShape(CLOSE);
}

function drawDebugDots(r, g, b) {
    // Draw dots
    for (let dot of dots) {
        fill(r, g, b);
        noStroke();
        ellipse(dot.x, dot.y, 5, 5);
    }
}

function drawDebugLines(r, g, b) {
    if (dots.length < 3 || !voronoi) return;

    // Draw Voronoi cell outlines for debugging
    stroke(r, g, b);
    strokeWeight(0.5);
    noFill();

    for (let i = 0; i < dots.length; i++) {
        let cell = voronoi.cellPolygon(i);
        if (cell && cell.length > 2) {
            beginShape();
            for (let v of cell) {
                vertex(v[0], v[1]);
            }
            endShape(CLOSE);
        }
    }
}

function keyPressed() {
    // Dot count controls
    if (key === 'a' || key === 'A') {
        const current = config.dotCount;
        config.dotCount = max(1, config.dotCount - 1);
        console.log('Dot count:', config.dotCount);

        if (current !== config.dotCount) {
            dots.pop();
        }
        // generateRandomDots();
    }
    if (key === 'q' || key === 'Q') {
        const current = config.dotCount;
        config.dotCount = min(50, config.dotCount + 1);
        console.log('Dot count:', config.dotCount);

        if (current !== config.dotCount) {
            dots.push(generateRandomDot());
        }
        // generateRandomDots();
    }

    // Speed controls
    if (key === 'w' || key === 'W') {
        config.speedMultiplier = min(5, config.speedMultiplier + (key === 'W' ? 1 : 0.1));
        console.log('Speed multiplier:', config.speedMultiplier);
    }
    if (key === 's' || key === 'S') {
        config.speedMultiplier = max(0.1, config.speedMultiplier - (key === 'S' ? 1 : 0.1));
        console.log('Speed multiplier:', config.speedMultiplier);
    }

    // FPS controls
    if (key === 'e' || key === 'E') {
        config.frameRateLimit = min(120, config.frameRateLimit + 5);
        console.log('FPS cap:', config.frameRateLimit);
        frameRate(config.frameRateLimit);
    }
    if (key === 'd' || key === 'D') {
        config.frameRateLimit = max(10, config.frameRateLimit - 5);
        console.log('FPS cap:', config.frameRateLimit);
        frameRate(config.frameRateLimit);
    }

    // Corner radius controls
    if (key === 'r' || key === 'R') {
        config.cornerRadius = min(50, config.cornerRadius + (key === 'R' ? 5 : 1));
        console.log('Corner radius:', config.cornerRadius);
    }
    if (key === 'f' || key === 'F') {
        config.cornerRadius = max(0, config.cornerRadius - (key === 'F' ? 5 : 1));
        console.log('Corner radius:', config.cornerRadius);
    }

    // Glow size controls
    if (key === 't' || key === 'T') {
        config.glowSize = min(20, config.glowSize + (key === 'T' ? 2 : 1));
        console.log('Glow size:', config.glowSize);
    }
    if (key === 'g' || key === 'G') {
        config.glowSize = max(0, config.glowSize - (key === 'G' ? 2 : 1));
        console.log('Glow size:', config.glowSize);
    }

    // Glow alpha controls
    if (key === 'y' || key === 'Y') {
        config.glowAlpha = min(255, config.glowAlpha + (key === 'Y' ? 20 : 5));
        console.log('Glow alpha:', config.glowAlpha);
    }
    if (key === 'h' || key === 'H') {
        config.glowAlpha = max(0, config.glowAlpha - (key === 'H' ? 20 : 5));
        console.log('Glow alpha:', config.glowAlpha);
    }
}
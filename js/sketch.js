let config = {
    dotsPer100Pixels: 0.4,
    speedMultiplier: 0.5,
    frameRateLimit: 30,
    backgroundColor: [0, 0, 0],
    borderColor: [75, 75, 75],
    borderWidth: 5,
    canvasPadding: 50,
    cornerRoundness: 0.7, // TODO: Implement corner roundness
    debug: false,
};

let dots = [];
let lastTime = 0;
let delaunay, voronoi;
let previousFPS = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    generateRandomDots();
    frameRate(config.frameRateLimit);
    lastTime = millis();
}

function draw() {
    background(config.borderColor);

    updateDots();
    drawVoronoiCells();

    if (config.debug) {
        drawDebugDots(255, 0, 0);
        drawDebugLines(255, 0, 0);
        drawFrameRate();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    generateRandomDots();
}

function generateRandomDots() {
    let dotCount = Math.floor((width * height) / (100 * 100) * config.dotsPer100Pixels);
    // console.log(`Generating ${dotCount} dots`);

    dots = [];
    for (let i = 0; i < dotCount; i++) {
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

        // change direction randomly
        dot.direction += random(-0.05, 0.05);

        // change speed randomly
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
    voronoi = delaunay.voronoi([-config.canvasPadding, -config.canvasPadding, width + config.canvasPadding, height + config.canvasPadding]);

    // Draw Voronoi cells with smooth rounded corners
    stroke(config.borderColor);
    strokeWeight(config.borderWidth);
    fill(config.backgroundColor);

    for (let i = 0; i < dots.length; i++) {
        let cell = voronoi.cellPolygon(i);
        if (!cell || cell.length < 3) continue; // Skip if no cell or not enough points

        drawRoundedPolygon(cell);
    }
}

function drawRoundedPolygon(points) {
    points.pop();
    if (points.length < 3) return;

    if (config.cornerRoundness <= 0) {
        beginShape();
        for (let j = 0; j < points.length; j++) {
            let v = points[j];
            vertex(v[0], v[1]);
        }
        endShape(CLOSE);
        return;
    }

    beginShape();

    let first = points[0];
    vertex(first[0], first[1]);

    for (let i = 0; i < points.length + 1; i++) {
        let current = points[i % points.length];
        let next = points[(i + 1) % points.length];

        // Calculate the midpoint between current and next
        let midX = (current[0] + next[0]) / 2;
        let midY = (current[1] + next[1]) / 2;

        // Draw a bezier curve to the midpoint
        if (i === 0) {
            vertex(midX, midY);
        } else {
            bezierVertex(current[0], current[1], current[0], current[1], midX, midY);
        }
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

function drawFrameRate() {
    // draw the framerate as text in the top left corner
    previousFPS.push(frameRate());
    if (previousFPS.length > 100) {
        previousFPS.shift();
    }
    let avgFPS = previousFPS.reduce((a, b) => a + b, 0) / previousFPS.length;
    fill(255);
    noStroke();
    textSize(16);
    text(`FPS: ${avgFPS.toFixed(0)}`, 10, 20);
}
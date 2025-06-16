let config = {
    dotsPer100Pixels: 0.3,
    speedMultiplier: 0.5,
    frameRateLimit: 30,
    backgroundColor: [0, 0, 0],
    borderColor: [255, 255, 255],
    borderWidth: 3,
    canvasPadding: 50,
    smoothCorners: true,
    maxSmoothing: 40,
    debug: false,
    fps: false,
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
    }

    if (config.fps) {
        drawFrameRate();
    }

    // if (frameRate().toFixed(0) < config.frameRateLimit - 1) {
    //     fill(255, 0, 0);
    //     noStroke();
    //     rect(50, 50, 50, 50);
    // }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    generateRandomDots();
}

function generateRandomDots() {
    let dotCount = Math.floor((width * height) / (100 * 100) * config.dotsPer100Pixels);

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

    if (deltaTime > 100) {
        // If deltaTime is too large, reset to avoid large jumps
        deltaTime = 100;
    }

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

        // change speed randomly
        dot.speed += random(-0.01, 0.01);
        dot.speed = constrain(dot.speed, 0.1, 0.3); // Keep speed within bounds

        // move away from close dots
        for (let otherDot of dots) {
            if (otherDot !== dot) {
                let distance = dist(dot.x, dot.y, otherDot.x, otherDot.y);
                if (distance < 20) { // If too close, change direction
                    dot.direction = atan2(dot.y - otherDot.y, dot.x - otherDot.x);
                    break; // Only change direction once per frame
                }
            }
        }

        // change direction randomly
        dot.direction += random(-0.05, 0.05);

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

    if (!config.smoothCorners) {
        beginShape();
        for (let j = 0; j < points.length; j++) {
            let v = points[j];
            vertex(v[0], v[1]);
        }
        endShape(CLOSE);
        return;
    }

    beginShape();

    vertex(points[0][0], points[0][1]); // Start at the first point

    for (let i = 0; i < points.length; i++) {
        let prevPoint = points[(i - 1 + points.length) % points.length];
        let currPoint = points[i % points.length];
        let nextPoint = points[(i + 1) % points.length];

        let prevLineMiddle = [(prevPoint[0] + currPoint[0]) / 2, (prevPoint[1] + currPoint[1]) / 2];
        let nextLineMiddle = [(currPoint[0] + nextPoint[0]) / 2, (currPoint[1] + nextPoint[1]) / 2];

        let distanceToPrevLineMidpoint = dist(prevLineMiddle[0], prevLineMiddle[1], currPoint[0], currPoint[1]);
        let distanceToNextLineMidpoint = dist(nextLineMiddle[0], nextLineMiddle[1], currPoint[0], currPoint[1]);

        // the starting point is either the midpoint of the previous line or closer to the current point, depending on config.maxSmoothing (which is the maximum distance to the point in pixels)
        let startPoint = distanceToPrevLineMidpoint < config.maxSmoothing ? prevLineMiddle : [
            // calculate the point along the line between the previous point and the current point, at the distance of config.maxSmoothing away from the current point
            currPoint[0] - (currPoint[0] - prevPoint[0]) * (config.maxSmoothing / dist(prevPoint[0], prevPoint[1], currPoint[0], currPoint[1])),
            currPoint[1] - (currPoint[1] - prevPoint[1]) * (config.maxSmoothing / dist(prevPoint[0], prevPoint[1], currPoint[0], currPoint[1]))
        ];

        let endPoint = distanceToNextLineMidpoint < config.maxSmoothing ? nextLineMiddle : [
            currPoint[0] - (currPoint[0] - nextPoint[0]) * (config.maxSmoothing / dist(nextPoint[0], nextPoint[1], currPoint[0], currPoint[1])),
            currPoint[1] - (currPoint[1] - nextPoint[1]) * (config.maxSmoothing / dist(nextPoint[0], nextPoint[1], currPoint[0], currPoint[1]))
        ];

        vertex(startPoint[0], startPoint[1]);
        bezierVertex(
            currPoint[0], currPoint[1],
            currPoint[0], currPoint[1],
            endPoint[0], endPoint[1]
        );
    }

    endShape(CLOSE);
}

function drawDebugDots(r, g, b) {
    for (let dot of dots) {
        fill(r, g, b);
        noStroke();
        ellipse(dot.x, dot.y, 5, 5);
    }
}

function drawDebugLines(r, g, b) {
    if (dots.length < 3 || !voronoi) return;

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
    let framerate = frameRate();
    if (framerate <= 999) {
        previousFPS.push(frameRate());
    }

    if (previousFPS.length > 100) {
        previousFPS.shift();
    }

    let avgFPS = previousFPS.reduce((a, b) => a + b, 0) / previousFPS.length;

    fill(255);
    noStroke();
    textSize(20);
    textAlign(LEFT, TOP);
    text(`FPS: ${framerate.toFixed(0)}`, 50, 50);
    text(`Avg FPS: ${avgFPS.toFixed(0)}`, 50, 70);
    text(`min FPS: ${Math.min(...previousFPS).toFixed(0)}`, 50, 90);
    text(`max FPS: ${Math.max(...previousFPS).toFixed(0)}`, 50, 110);

    if (frameRate().toFixed(0) > config.frameRateLimit - 1 && frameRate().toFixed(0) < config.frameRateLimit + 1) {
        fill(255, 0, 0);
        noStroke();
        rect(50, 150, 50, 50);
    }
}
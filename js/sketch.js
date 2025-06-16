let config = {
    // canvas
    frameRateLimit: 30, // managed in general properties
    canvasPadding: 50,
    blurRadius: 2,
    showFadingOutline: true,
    fadingOutlineColor: [0, 0, 0],

    // dots
    dotsPer100Pixels: 0.3,
    speedMultiplier: 1,
    enableRepulsion: true,
    moveAwayDistance: 50,
    generatedDotSpread: 100,

    // styling
    borderWidth: 3,
    enableSmoothing: true,
    maxSmoothing: 40,
    backgroundColor: [0, 0, 0],
    borderColor: [255, 255, 255],

    // debugging
    debug: {
        showDots: false,
        showLines: false,
        showFPS: false,
        showFrameRateWarning: false,
    },
};

let dots = [];
let lastTime = 0;
let delaunay, voronoi;
let previousFPS = [];

function setup() {
    applyOverlayEffects();
    createCanvas(windowWidth, windowHeight);
    generateRandomDots();
    frameRate(config.frameRateLimit);
    lastTime = millis();
}

function draw() {
    background(config.borderColor);

    updateDots();
    drawVoronoiCells();

    // DEBUGGING
    drawDebugDots();
    drawDebugLines();
    drawFrameRate();
    drawFrameRateWarning();
}

function applyOverlayEffects() {
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.style.backdropFilter = `blur(${config.blurRadius}px)`;

        if (config.showFadingOutline) {
            overlay.style.boxShadow = `0px 0px 50px 50px rgb(${config.fadingOutlineColor.join(', ')}) inset`;
        } else {
            overlay.style.boxShadow = 'none';
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    generateRandomDots();
}

function generateRandomDots() {
    let dotCount = Math.floor((width * height) / (100 * 100) * config.dotsPer100Pixels);
    dots = [];

    let aspectRatio = width / height;
    let rows = Math.ceil(Math.sqrt(dotCount / aspectRatio));
    let cols = Math.ceil(dotCount / rows);

    let spacingX = width / cols;
    let spacingY = height / rows;

    for (let i = 0; i < cols && dots.length < dotCount; i++) {
        for (let j = 0; j < rows && dots.length < dotCount; j++) {
            let x = i * spacingX + spacingX / 2 + random(-config.generatedDotSpread, config.generatedDotSpread);
            let y = j * spacingY + spacingY / 2 + random(-config.generatedDotSpread, config.generatedDotSpread);
            dots.push({
                x: constrain(x, 0, width),
                y: constrain(y, 0, height),
                direction: random(TWO_PI),
                speed: random(0.1, 0.3),
            });
        }
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
            dot.x = constrain(dot.x, 0, width);
        }
        if (dot.y < 0 || dot.y > height) {
            dot.direction = -dot.direction;
            dot.y = constrain(dot.y, 0, height);
        }

        // change speed randomly
        dot.speed += random(-0.01, 0.01);
        dot.speed = constrain(dot.speed, 0.1, 0.3);

        // move away from close dots
        if (config.enableRepulsion && config.moveAwayDistance > 0) {
            let closestDot = null;
            let closestDistance = Infinity;

            for (let otherDot of dots) {
                if (otherDot === dot) continue;

                let distance = dist(dot.x, dot.y, otherDot.x, otherDot.y);
                if (distance >= config.moveAwayDistance) continue;

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestDot = otherDot;
                }
            }

            if (!closestDot) continue;

            let angleFromOtherDot = atan2(dot.y - closestDot.y, dot.x - closestDot.x);

            // Calculate the shortest angular difference between current direction and desired direction
            let angleDifference = angleFromOtherDot - dot.direction;

            // Normalize the angle difference to be between -PI and PI (shortest path)
            while (angleDifference > PI) angleDifference -= TWO_PI;
            while (angleDifference < -PI) angleDifference += TWO_PI;

            // draw a line in the angleFromOtherDot direction
            stroke(0, 255, 0);
            line(dot.x, dot.y, closestDot.x, closestDot.y);
            stroke(0, 0, 255);
            line(dot.x, dot.y, dot.x + cos(angleFromOtherDot) * 20, dot.y + sin(angleFromOtherDot) * 20);

            // direction change speed should be higher when the distance is smaller
            let distanceFactor = map(closestDistance, 0, config.moveAwayDistance, 1, 0) * 0.1;
            dot.direction += angleDifference * distanceFactor;
        }
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

    if (!config.enableSmoothing || config.maxSmoothing <= 0) {
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

// --- DEBUGGING FUNCTIONS ---
function drawDebugDots() {
    if (!config.debug.showDots) return;

    for (let dot of dots) {
        fill(255, 0, 0);
        noStroke();
        ellipse(dot.x, dot.y, 5, 5);

        stroke(255, 0, 0);
        line(dot.x, dot.y, dot.x + cos(dot.direction) * (50 * dot.speed), dot.y + sin(dot.direction) * (50 * dot.speed));
    }
}

function drawDebugLines() {
    if (!config.debug.showLines) return;
    if (dots.length < 3 || !voronoi) return;

    stroke(255, 0, 0);
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
    if (!config.debug.showFPS) return;

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
}

function drawFrameRateWarning() {
    if (!config.debug.showFrameRateWarning) return;

    if (frameRate().toFixed(0) < config.frameRateLimit - 1 && config.debug.showFrameRateWarning) {
        fill(255, 0, 0);
        noStroke();
        rect(50, 150, 50, 50);
    }
}
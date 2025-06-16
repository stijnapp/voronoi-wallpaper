// Wallpaper Engine Property Listener
// This file handles user-configurable properties for the Voronoi wallpaper

window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        // Animation Properties
        if (properties.dotdensity) {
            config.dotsPer100Pixels = properties.dotdensity.value;
            generateRandomDots(); // Regenerate dots when density changes
        }

        if (properties.animationspeed) {
            config.speedMultiplier = properties.animationspeed.value;
        }

        if (properties.repulsion) {
            config.moveAwayDistance = properties.repulsion.value;
        }

        if (properties.dotspread) {
            config.generatedDotSpread = properties.dotspread.value;
            generateRandomDots(); // Regenerate dots when spread changes
        }

        // Visual Properties
        if (properties.backgroundcolor) {
            // Convert Wallpaper Engine color format (0.0-1.0) to RGB (0-255)
            var bgColor = properties.backgroundcolor.value.split(' ');
            config.backgroundColor = bgColor.map(function(c) {
                return Math.ceil(c * 255);
            });
        }

        if (properties.bordercolor) {
            // Convert Wallpaper Engine color format (0.0-1.0) to RGB (0-255)
            var borderColor = properties.bordercolor.value.split(' ');
            config.borderColor = borderColor.map(function(c) {
                return Math.ceil(c * 255);
            });
        }

        if (properties.borderwidth) {
            config.borderWidth = properties.borderwidth.value;
        }

        if (properties.smoothing) {
            config.maxSmoothing = properties.smoothing.value;
        }

        if (properties.blurradius) {
            config.blurRadius = properties.blurradius.value;
            applyOverlayEffects();
        }

        // Debug Properties
        if (properties.showdots) {
            config.debug.showDots = properties.showdots.value;
        }

        if (properties.showlines) {
            config.debug.showLines = properties.showlines.value;
        }

        if (properties.showfps) {
            config.debug.showFPS = properties.showfps.value;
        }
    },

    applyGeneralProperties: function(properties) {
        // Handle FPS limit from Wallpaper Engine general settings
        if (properties.fps) {
            config.frameRateLimit = properties.fps;
            frameRate(config.frameRateLimit);
        }
    },

    setPaused: function(isPaused) {
        // Handle pause/unpause events
        if (isPaused) {
            noLoop(); // Stop the animation loop
        } else {
            loop(); // Resume the animation loop
        }
    }
};
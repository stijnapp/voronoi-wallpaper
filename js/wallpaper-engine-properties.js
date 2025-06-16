// Wallpaper Engine Property Listener
// This file handles user-configurable properties for the Voronoi wallpaper

window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        // Animation Properties
        if (properties.dotdensity) {
            config.dotsPer100Pixels = properties.dotdensity.value;
            generateRandomDots();
        }

        if (properties.animationspeed) {
            config.speedMultiplier = properties.animationspeed.value;
        }

        if (properties.repulsion) {
            config.moveAwayDistance = properties.repulsion.value;
        }

        if (properties.dotspread) {
            config.generatedDotSpread = properties.dotspread.value;
            generateRandomDots();
        }

        // Visual Properties
        if (properties.schemecolor) {
            config.backgroundColor = convertColorFormat(properties.schemecolor.value);
        }

        if (properties.bordercolor) {
            config.borderColor = convertColorFormat(properties.bordercolor.value);
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

        if (properties.showfadingoutline) {
            config.showFadingOutline = properties.showfadingoutline.value;
            applyOverlayEffects();
        }

        if (properties.fadingoutlinecolor) {
            config.fadingOutlineColor = convertColorFormat(properties.fadingoutlinecolor.value);
            applyOverlayEffects();
        }

        // Debug Properties
        if (properties.debugfps) {
            config.debug.showFPS = properties.debugfps.value;
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

// function for converting color format
function convertColorFormat(color) {
	return color.split(' ').map(c => Math.ceil(c * 255));
}
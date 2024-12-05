const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, text) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, size, size);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = `${size/4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FIT', size/2, size/2 - size/8);
    ctx.fillText('TIME', size/2, size/2 + size/8);

    return canvas.toBuffer();
}

// Generate icons
const sizes = [192, 512];
sizes.forEach(size => {
    const buffer = generateIcon(size, `${size}x${size}`);
    fs.writeFileSync(`public/logo-${size}x${size}.png`, buffer);
});

// Generate apple touch icon (180x180)
const appleTouchIcon = generateIcon(180, '180x180');
fs.writeFileSync('public/apple-touch-icon.png', appleTouchIcon);

console.log('Icons generated successfully!');

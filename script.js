// Select the canvas element
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Draw something on the canvas
ctx.fillStyle = "lightblue";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Test message in the console
console.log("NeuroJam is running!");

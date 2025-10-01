const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3001 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server running on ws://localhost:3001");

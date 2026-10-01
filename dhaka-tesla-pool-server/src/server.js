// ─────────────────────────────────────────────────────────────
// src/server.js — HTTP server entry point
// Binds the port here, not in app.js, so Jest can import
// app.js cleanly without starting a real server.
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Dhaka Tesla Pool API running on port ${PORT}`);
});

// ─────────────────────────────────────────────────────────────
// src/app.js — Express application factory
// Separated from server.js so Jest can import the app without
// binding a real port (avoids EADDRINUSE in parallel tests).
// ─────────────────────────────────────────────────────────────
require('dotenv').config();

const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');

const errorHandler = require('./middlewares/errorHandler');

// Route groups
const authRoutes    = require('./routes/auth');
const ridesRoutes   = require('./routes/rides');
const driverRoutes  = require('./routes/driver');
const profileRoutes = require('./routes/profile');

const app = express();

// ── CORS — allow the Vite dev server to send credentials ──────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,              // required for httpOnly cookies
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Cookie parsing (reads req.cookies.*) ─────────────────────
app.use(cookieParser(process.env.COOKIE_SECRET));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/rides',   ridesRoutes);
app.use('/api/driver',  driverRoutes);
app.use('/api/profile', profileRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Central error handler (must be last middleware) ───────────
app.use(errorHandler);

module.exports = app;

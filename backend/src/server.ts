import express from "express";
import usersRouter from "./Routes/usersRoute.js";
import cartsRoute from "./Routes/cartsRoute.js"
import productRouter from "./Routes/productsRoute.js"
import dotenv from "dotenv";
import session from "express-session"
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
dotenv.config();

const app = express();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // HTTP för development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 timmar
  }
}));

const port = process.env.PORT;

// Routes
app.use('/api/cart', cartsRoute)
app.use("/products",productRouter)
app.use("/api/users", usersRouter);

// Serve static files from frontend dist
const staticPath = path.join(__dirname, '../../frontend/dist');
console.log('Static files path:', staticPath);
console.log('Files in static path:', fs.readdirSync(staticPath));
app.use(express.static(staticPath));

// Catch all handler: send back React's index.html file for any non-API routes
app.use((req, res) => {
  const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
  console.log('Serving index.html from:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`server run on port ${port}`);
});

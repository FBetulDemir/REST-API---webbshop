import express from "express";
import usersRouter from "./Routes/usersRoute.js";
import cartsRoute from "./Routes/cartsRoute.js"
import productRouter from "./Routes/productsRoute.js"
import dotenv from "dotenv";
import cors from "cors"
import session from "express-session"
import path from "path";
import { fileURLToPath } from 'url';
dotenv.config();

const app = express();

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Både dev och prod
  credentials: true // Tillåt cookies
}));

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

// Statiska filer (frontend)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Routes
app.use('/api/cart', cartsRoute)
app.use("/products",productRouter)
app.use("/api/users", usersRouter);

// Fallback för SPA routing - alla andra routes ska visa index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`server run on port ${port}`);
});

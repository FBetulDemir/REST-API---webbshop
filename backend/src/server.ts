import express from "express";
import usersRouter from "./Routes/usersRoute.js";
import cartsRoute from "./Routes/cartsRoute.js"
import productRouter from "./Routes/productsRoute.js"
import dotenv from "dotenv";
import cors from "cors"
import session from "express-session"
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
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

// Routes
app.use('/api/cart', cartsRoute)
app.use("/products",productRouter)
app.use("/api/users", usersRouter);

app.listen(port, () => {
  console.log(`server run on port ${port}`);
});

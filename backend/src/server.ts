import express from "express";
import usersRouter from "./Routes/usersRoute.js";
import cartsRoute from "./Routes/cartsRoute.js"
import productRouter from "./Routes/productsRoute.js"
import dotenv from "dotenv";
import cors from "cors"
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors())

const port = process.env.PORT;

// Routes
app.use('/api/cart', cartsRoute)
app.use("/products",productRouter)
app.use("/api/users", usersRouter);

app.listen(port, () => {
  console.log(`server run on port ${port}`);
});

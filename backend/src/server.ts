import express from "express";
import usersRouter from "./Routes/usersRoute.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

const port = process.env.PORT;

app.use("/api/users", usersRouter);

app.listen(port, () => {
  console.log(`server run on port ${port}`);
});

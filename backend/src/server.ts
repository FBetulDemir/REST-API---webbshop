import express from "express";
import usersRouter from "./Routes/usersRoute.js"

const app=express()
import dotenv from "dotenv"
dotenv.config()

const port=process.env.PORT

app.use("/users", usersRouter);

app.listen(port,()=>{
	console.log(`server run on port ${port}`)
})
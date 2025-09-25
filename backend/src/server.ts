import express from "express"
const app=express()
import dotenv from "dotenv"
import productRouter from "./Routes/productsRoute.js"
dotenv.config()
const port=process.env.PORT

app.use("/products",productRouter)


app.listen(port,()=>{
	console.log(`server run on port ${port}`)
})
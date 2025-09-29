import express from "express"
const app=express()
import dotenv from "dotenv"
import cartsRoute from "./Routes/cartsRoute.js"
import productRouter from "./Routes/productsRoute.js"

dotenv.config()
const port=process.env.PORT

// Middleware
app.use(express.json())

// Routes
app.use('/api/cart', cartsRoute)
app.use("/products",productRouter)

app.listen(port,()=>{
	console.log(`server run on port ${port}`)
})
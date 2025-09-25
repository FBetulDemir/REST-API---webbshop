import express from "express"
const app=express()
import dotenv from "dotenv"
import cartsRoute from "./Routes/cartsRoute.js"

dotenv.config()

const port=process.env.PORT

// Middleware
app.use(express.json())

// Routes
app.use('/api/cart', cartsRoute)

app.listen(port,()=>{
	console.log(`server run on port ${port}`)
})
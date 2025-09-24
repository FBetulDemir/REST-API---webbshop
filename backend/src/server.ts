import express from "express"
const app=express()
import dotenv from "dotenv"
dotenv.config()

const port=process.env.PORT

app.listen(port,()=>{
	console.log(`server run on port ${port}`)
})
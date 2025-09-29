import { Router } from "express";
import express from "express"
import type { Request, Response } from "express";
import { ddbDocClient } from "../data/dynamoDb.js";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"; 
import type { Product } from "../data/types/produstsType.js";
import { createProductSchema, productsArraySchema } from "../data/validators/productValidate.js";

const router = Router();
const myTable = "webshop";
router.use(express.json())

router.get("/", async (req: Request, res: Response) => {
	const params = {
		TableName: myTable,
		FilterExpression: "begins_with(pk, :pkPrefix)",
		ExpressionAttributeValues: {
			":pkPrefix": "PRODUCT#"  
		}
	};
	
	try {
		const data = await ddbDocClient.send(new ScanCommand(params));
		const products: Product[] = data.Items ? (data.Items as Product[]) : [];
		const result=productsArraySchema.parse(products)
		
		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching products:", error);
		res.status(500).json({ message: "Something went wrong" });
	}
});
router.post("/",async (req: Request, res: Response)=>{
	try{
		const validatedData = createProductSchema.parse(req.body);
		const {id}=req.body
		if (!id || typeof id !== "number") {
			return res.status(400).json({ message: "Product id (number) is required" });
		}

		const newProduct={
			pk:`PRODUCT#${id}`,
			sk:"#METADATA",
			...validatedData
		}

		await ddbDocClient.send(
			new PutCommand({ TableName: myTable, Item: newProduct })
		);
		
		res.status(201).json(newProduct);
		
	}catch(error){
		console.log(error)
		res.status(500).json({ message: "Something went wrong" });
	}
	
	
})

export default router;

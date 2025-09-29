import { Router } from "express";
import express from "express"
import type { Request, Response } from "express";
import { ddbDocClient } from "../data/dynamoDb.js";
import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"; 
import type { Product } from "../data/types/produstsType.js";
import { createProductSchema, productsArraySchema, productSchema } from "../data/validators/productValidate.js";

const router = Router();
const myTable = "webshop";
router.use(express.json())

//lista alla produkter
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

//hämta en produkt
router.get("/:productId", async (req: Request, res: Response) => {
	try {
		const selectId=req.params.productId
		if (!selectId) {
			return res.status(400).json({ message: "Product ID is required" });
		}
		const pk = `PRODUCT#${selectId}`;
		const sk = "#METADATA";
		const data = await ddbDocClient.send(
			new GetCommand({
				TableName: myTable,
				Key: { pk, sk }
			})
		);
		
		if (!data.Item) {
			return res.status(404).json({ message: `Product ${selectId} not found` });
		}
		
		const product = productSchema.parse(data.Item);
		
		res.status(200).json(product);
		
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Something went wrong" });
	}
});


//skapa produkt
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

//ta bort produkt
router.delete("/:productId",async(req: Request, res: Response)=>{
	try{
		const deleteId=req.params.productId
		
		if (!deleteId) {
			return res.status(400).json({ message: "Product ID is required" });
		}
		const pk = `PRODUCT#${deleteId}`;
		const sk = "#METADATA";
		
		await ddbDocClient.send(
			new DeleteCommand({
				TableName: myTable,
				Key: { pk, sk }
			})
		);
		
		res.status(200).json({ message: `Product ${deleteId} deleted successfully` });
		
	}catch(error){
		console.log(error)
		res.status(500).json({message:"Something went wrong" })
	}
	
	
})

export default router;

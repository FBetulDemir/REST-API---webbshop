import { Router } from "express";
import express from "express"
import type { Request, Response } from "express";
import { ddbDocClient } from "../data/dynamoDb.js";
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"; 
import type { Product } from "../data/types/produstsType.js";
import { PartialProductSchema, editschema, productsArraySchema, productSchema } from "../data/validators/productValidate.js";

const router = Router();
const myTable = "webshop";
router.use(express.json())

interface ProductIdParam{
	productId:string
}

interface ProductResponse extends Product {}


interface MessageResponse {
	message: string;
}
//lista alla produkter
router.get("/", async (req, res: Response<MessageResponse | Product[]>) => {
	const params = {
		TableName: myTable,
		FilterExpression: "begins_with(pk, :pkPrefix)",
		ExpressionAttributeValues: {
			":pkPrefix": "PRODUCT#"  
		}
	};
	
	try {
		const data = await ddbDocClient.send(new ScanCommand(params));
		// const products: Product[] = data.Items ? (data.Items as Product[]) : [];
		const result: Product[] =productsArraySchema.parse(data.Items)
		
		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching products:", error);
		res.status(500).json({ message: "Something went wrong" });
	}
});

//hämta en produkt
router.get("/:productId", async (req: Request<ProductIdParam>, res: Response<ProductResponse | MessageResponse>) => {
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
		
		const product:Product = productSchema.parse(data.Item);
		
		res.status(200).json(product);
		
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Something went wrong" });
	}
});


//skapa produkt
router.post("/",async (req: Request, res: Response<MessageResponse | Product>)=>{
	try{
		const validatedData= PartialProductSchema.parse(req.body);
		const {id}=req.body
		if (!id || typeof id !== "number") {
			return res.status(400).json({ message: "Product id (number) is required" });
		}

		const newProduct: Product={
			...validatedData,
			pk:`PRODUCT#${id}`,
			sk:"#METADATA"
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
router.delete("/:productId",async(req: Request<ProductIdParam>, res: Response<MessageResponse>)=>{
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

//uppdatera produkt 
router.put("/:productId", async (req: Request<ProductIdParam>, res: Response) => { 
	const { productId } = req.params;
	
	try {
		const validatedData = editschema.parse(req.body);
		const { name, price, image, amountInStock } = validatedData;
		
		await ddbDocClient.send(
			new UpdateCommand({
				TableName: myTable,
				Key: {
					pk: `PRODUCT#${productId}`,
					sk: "#METADATA",
				},
				UpdateExpression:
				"SET #n = :name, price = :price, image = :image, amountInStock = :amountInStock",
				ExpressionAttributeNames: {
					"#n": "name"    
				},
				
				ExpressionAttributeValues: {
					":name": name,
					":price": price,
					":image": image,
					":amountInStock": amountInStock,
				},
				ReturnValues: "ALL_NEW",
			})
		);
		
		res.status(200).json({ message: "Product updated successfully" });
	} catch (error: any) {
		if (error?.errors) {
			return res.status(400).json({ message: "Validation failed" });
		}
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
})


	export default router;
		
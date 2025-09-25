import { Router } from "express";
import type { Request, Response } from "express";
import { ddbDocClient } from "../data/dynamoDb.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb"; // note: lib-dynamodb
import type { Product } from "../data/types/produstsType.js";
import { productsArraySchema } from "../data/validators/productValidate.js";

const router = Router();
const myTable = "webshop";

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

export default router;

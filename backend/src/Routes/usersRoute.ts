import express, { Request, Response } from "express";
import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";


const router = express.Router();
const client = new DynamoDBClient({ region: "eu-north-1" });


router.post("/", async (req: Request, res: Response) => {

});

export default router;
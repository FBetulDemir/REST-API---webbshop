import express, { type Request, type Response } from "express";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const client = new DynamoDBClient({ region: "eu-north-1" });
const ddb = DynamoDBDocumentClient.from(client);
const table = process.env.TABLE_NAME!;

export interface User {
  id: string;
  name: string;
  password: string;
  email?: string;
  type: "user";
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: table }));
    const users = (result.Items || []).filter(
      (item) => item.type?.S === "user"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve users" });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { password, name } = req.body;
    if (!password || !name) {
      return res.status(400).json({ error: "password and name are required" });
    }
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    const item = {
      pk: `USER#${id}`,
      sk: "#METADATA",
      type: "user",
      id,
      name,
      hashedPassword,
    };

    await ddb.send(new PutCommand({ TableName: table, Item: item }));

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

export default router;

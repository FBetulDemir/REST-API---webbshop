import express, { type Request, type Response } from "express";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const router = express.Router();
const client = new DynamoDBClient({ region: "eu-north-1" });
const ddb = DynamoDBDocumentClient.from(client);
const table = process.env.TABLE_NAME!;
const JWT_SECRET = process.env.JWT_SECRET || "secretPassword";

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

router.get("/:id", async (req, res) => {
  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: table,
        Key: { pk: `USER#${req.params.id}`, sk: "#METADATA" },
      })
    );
    if (!result.Item) return res.status(404).json({ error: "User not found" });

    const { hashedPassword, ...safe } = result.Item;
    res.json(safe);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// create a new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { password, name, email } = req.body;
    if (!password || !name) {
      return res.status(400).json({ error: "password and name are required" });
    }
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      pk: `USER#${id}`,
      sk: "#METADATA",
      type: "user",
      id,
      name,
      email,
      hashedPassword,
    };

    await ddb.send(new PutCommand({ TableName: table, Item: user }));

    // res.status(201).json({ message: "User created successfully" });
    const { hashedPassword: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

// user login
router.post("/login", async (req: Request, res: Response) => {
  const { name, password } = req.body;
  if (!name || !password)
    return res.status(400).json({ error: "name and password required" });

  const result = await ddb.send(new ScanCommand({ TableName: table }));
  const user = (result.Items || []).find(
    (u) => u.type?.S === "user" && u.name?.S === name
  );

  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const hashedPassword = user.hashedPassword?.S;
  if (!hashedPassword)
    return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, hashedPassword);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);

  res.json({ message: "Login successful", token });
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name && !email && !password) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updates: string[] = [];
    const values: Record<string, any> = {};
    const names: Record<string, string> = { "#n": "name" };

    if (name) {
      updates.push("#n = :name");
      values[":name"] = name;
    }
    if (email) {
      updates.push("email = :email");
      values[":email"] = email;
    }

    let changedPassword = false;
    if (password) {
      updates.push("hashedPassword = :pw");
      values[":pw"] = await bcrypt.hash(password, 10);
      changedPassword = true;
    }

    updates.push("id = :id");
    values[":id"] = id;

    const result = await ddb.send(
      new UpdateCommand({
        TableName: table,
        Key: { pk: `USER#${id}`, sk: "#METADATA" },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeValues: values,
        ExpressionAttributeNames: names,
        ReturnValues: "ALL_NEW",
      })
    );

    const { hashedPassword, ...publicUser } = result.Attributes || {};
    res.json({ message: "User updated", user: publicUser, changedPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not update user" });
  }
});

export default router;

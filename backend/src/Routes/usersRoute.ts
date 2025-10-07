import express, { type Request, type Response } from "express";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import {
  idParamSchema,
  loginSchema,
  registerSchema,
  updateUserSchema,
  validate,
} from "../validation/validateUser.js";
import type {
  User,
  RegisterRequest,
  LoginRequest,
  UpdateUserRequest,
} from "../types/user.js";

dotenv.config();

const router = express.Router();
const client = new DynamoDBClient({ region: "eu-north-1" });
const ddb = DynamoDBDocumentClient.from(client);
const table = process.env.TABLE_NAME!;
const JWT_SECRET = process.env.JWT_SECRET || "secretPassword";

type UserParam = {
  id: string;
  name: string;
  password: string;
  email?: string;
  type: "user";
};

// Type for DynamoDB scan result
export type GetResult = Record<string, any> | undefined;

interface ScanResult<T> {
  Items?: T[];
  Count?: number;
}

// get all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: table }));
    // Filter only items with type 'user'
    const users: User[] = (result.Items || [])
      .filter((item) => item.type === "user")
      .map((item) => ({
        id: item.id,
        name: item.name,
        password: item.password,
        email: item.email,
        type: item.type,
      }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve users" });
  }
});

// get user by id
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  async (req: Request, res: Response) => {
    try {
      const result = await ddb.send(
        new GetCommand({
          TableName: table,
          Key: { pk: `USER#${req.params.id}`, sk: "#METADATA" },
        })
      );
      if (!result.Item)
        return res.status(404).json({ error: "User not found" });

      const { hashedPassword, ...safe } = result.Item;
      res.json(safe);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

// create a new user
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    try {
      const { password, name, email } = req.body;
      if (!password || !name) {
        return res
          .status(400)
          .json({ error: "password and name are required" });
      }
      // Generate a unique user ID
      const id = randomUUID();
      // Hash the user's password with bcrypt using 10 rounds for security
      const hashedPassword = await bcrypt.hash(password, 10);
      // User object for DynamoDB
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

      // Remove hashedPassword from user and store the rest in safe to avoid exposing sensitive info so the data remains only in the original user object and it is never exposed in API responses
      const { hashedPassword: _, ...safe } = user;
      res.status(201).json(safe);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Could not create user" });
    }
  }
);

// user login
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    const { name, password } = req.body;

    const result = await ddb.send(new ScanCommand({ TableName: table }));

    // Find user by name
    const user = (result.Items || []).find(
      (u) => u.type === "user" && u.name === name
    );

    if (!user?.hashedPassword)
      return res.status(401).json({ error: "Invalid credentials" });

    // Compare password
    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);

    res.json({ message: "Login successful", token });
  }
);

// update user
router.put(
  "/:id",
  validate(updateUserSchema),
  async (
    req: Request<{ id: string }, {}, UpdateUserRequest>,
    res: Response
  ) => {
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
      // Prepare updates for DynamoDB
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
      // values[":id"] = id;

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

      // Remove hashedPassword before sending response
      const { hashedPassword, ...publicUser } = result.Attributes || {};
      res.json({ message: "User updated", user: publicUser, changedPassword });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Could not update user" });
    }
  }
);

// delete user
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params;

      await ddb.send(
        new DeleteCommand({
          TableName: table,
          Key: {
            pk: `USER#${id}`,
            sk: "#METADATA",
          },
        })
      );

      res.json({ message: `User ${id} deleted` });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Could not delete user" });
    }
  }
);

export default router;

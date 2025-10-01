import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
dotenv.config();
console.log(process.env.AWS_REGION)
console.log(process.env.AWS_ACCESS_KEY_ID)
console.log(process.env.AWS_SECRET_ACCESS_KEY)
console.log(process.env.TABLE_NAME)


const client = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


export const ddbDocClient = DynamoDBDocumentClient.from(client);

// Export table name for use in routes
export const TABLE_NAME = process.env.TABLE_NAME || 'webshop';
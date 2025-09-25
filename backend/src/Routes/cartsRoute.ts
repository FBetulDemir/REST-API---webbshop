import { Router } from 'express';
import { ddbDocClient, TABLE_NAME } from '../data/dynamoDb.js';
import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const router = Router();

// TypeScript interfaces för Cart-objekt
export interface Cart {
  PK: string;           // CART#1, CART#2, etc.
  SK: string;           // #METADATA
  userId: string;       // USER#1, USER#2, etc.
  productId: string;    // PRODUCT#3, PRODUCT#7, etc.
  amount: number;       // Antal av produkten
  type: 'cart';         // Alltid 'cart'
}

// Interface för att skapa ny cart
export interface CreateCartRequest {
  userId: string;
  productId: string;
  amount: number;
}

// Interface för att uppdatera cart
export interface UpdateCartRequest {
  amount: number;
}

// Interface för cart response (utan PK/SK för frontend)
export interface CartResponse {
  id: string;           // Extraherat från PK (CART#1 -> 1)
  userId: string;
  productId: string;
  amount: number;
  type: 'cart';
}

export default router;

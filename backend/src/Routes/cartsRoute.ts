import { Router } from 'express';
import { ddbDocClient, TABLE_NAME } from '../data/dynamoDb.js';
import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Cart, CreateCartRequest, UpdateCartRequest, CartResponse } from '../data/types.js';

const router = Router();

// GET /api/cart - Hämta alla cart-objekt
router.get('/', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#type = :cartType',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':cartType': 'cart'
      }
    });
    
    const result = await ddbDocClient.send(command);
    
    // Konvertera till CartResponse format
    const carts: CartResponse[] = result.Items?.map(item => ({
      id: item.PK?.replace('CART#', '') || '',
      userId: item.userId || '',
      productId: item.productId || '',
      amount: item.amount || 0,
      type: 'cart' as const
    })) || [];
    
    res.json({
      success: true,
      data: carts,
      count: carts.length
    });
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carts'
    });
  }
});

export default router;

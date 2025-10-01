import { Router } from 'express';
import { ddbDocClient, TABLE_NAME } from '../data/dynamoDb.js';
import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Cart, CreateCartRequest, UpdateCartRequest, CartResponse } from '../data/types.js';
import { createCartSchema, updateCartSchema } from '../schemas/cartSchemas.js';

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
      id: item.pk?.replace('CART#', '') || '',
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

// GET /api/cart/:id - Hämta specifikt cart-objekt
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cartId = `CART#${id}`;
    
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: cartId,
        sk: '#METADATA'
      }
    });
    
    const result = await ddbDocClient.send(command);
    
    if (!result.Item) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    const cartResponse: CartResponse = {
      id: result.Item.pk?.replace('CART#', '') || '',
      userId: result.Item.userId || '',
      productId: result.Item.productId || '',
      amount: result.Item.amount || 0,
      type: 'cart'
    };
    
    res.json({
      success: true,
      data: cartResponse
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart'
    });
  }
});

// POST /api/cart - Skapa nytt cart-objekt
router.post('/', async (req, res) => {
  try {
    // Validera inkommande data
    const validatedData = createCartSchema.parse(req.body);
    const { userId, productId, amount } = validatedData;
    
    // Generera unikt ID för cart
    const cartId = `CART#${Date.now()}`;
    
    const cart = {
      pk: cartId,
      sk: '#METADATA',
      userId,
      productId,
      amount,
      type: 'cart'
    };
    
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: cart
    });
    
    await ddbDocClient.send(command);
    
    // Skapa response
    const cartResponse: CartResponse = {
      id: cartId.replace('CART#', ''),
      userId,
      productId,
      amount,
      type: 'cart'
    };
    
    res.status(201).json({
      success: true,
      data: cartResponse
    });
  } catch (error: any) {
    console.error('Error creating cart:', error);
    
    // Hantera valideringsfel
    if (error.name === 'ZodError') {
      const errorDetails = error.issues || error.errors || [];
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails,
        message: errorDetails.length > 0 
          ? errorDetails.map((err: any) => err.message).join(', ')
          : 'Invalid input data'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create cart'
    });
  }
});

// PUT /api/cart/:id - Uppdatera cart-objekt
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validera inkommande data
    const validatedData = updateCartSchema.parse(req.body);
    const { amount } = validatedData;
    
    const cartId = `CART#${id}`;
    
    // Hämta befintligt cart-objekt först
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: cartId,
        sk: '#METADATA'
      }
    });
    
    const existingCart = await ddbDocClient.send(getCommand);
    
    if (!existingCart.Item) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    // Uppdatera med befintliga värden
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: cartId,
        sk: '#METADATA',
        userId: existingCart.Item.userId,
        productId: existingCart.Item.productId,
        amount,
        type: 'cart'
      }
    });
    
    await ddbDocClient.send(command);
    
    const cartResponse: CartResponse = {
      id,
      userId: existingCart.Item.userId,
      productId: existingCart.Item.productId,
      amount,
      type: 'cart'
    };
    
    res.json({
      success: true,
      data: cartResponse
    });
  } catch (error: any) {
    console.error('Error updating cart:', error);
    
    // Hantera valideringsfel
    if (error.name === 'ZodError') {
      const errorDetails = error.issues || error.errors || [];
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails,
        message: errorDetails.length > 0 
          ? errorDetails.map((err: any) => err.message).join(', ')
          : 'Invalid input data'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update cart'
    });
  }
});

// DELETE /api/cart/:id - Ta bort cart-objekt
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cartId = `CART#${id}`;
    
    // Kontrollera om cart finns först
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: cartId,
        sk: '#METADATA'
      }
    });
    
    const existingCart = await ddbDocClient.send(getCommand);
    
    if (!existingCart.Item) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    // Ta bort cart om den finns
    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: cartId,
        sk: '#METADATA'
      }
    });
    
    await ddbDocClient.send(deleteCommand);
    
    res.json({
      success: true,
      message: 'Cart deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cart'
    });
  }
});

export default router;

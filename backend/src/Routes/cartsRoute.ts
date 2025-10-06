import { Router } from 'express';
import type { Request, Response } from 'express';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}
import { ddbDocClient, TABLE_NAME } from '../data/dynamoDb.js';
import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Cart, CreateCartRequest, UpdateCartRequest, CartResponse } from '../data/types.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

type CartItem = CartResponse;
type ErrorMessage = { error: string };
import { createCartSchema, updateCartSchema } from '../schemas/cartSchemas.js';

// JWT middleware för att validera token och extrahera userId
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).send({ error: 'Access token required' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "secretPassword";
  
  jwt.verify(token, JWT_SECRET, (err: Error | null, user: { id: string; name: string } | undefined) => {
    if (err) {
      return res.status(403).send({ error: 'Invalid or expired token' });
    }
    
    if (!user) {
      return res.status(403).send({ error: 'Invalid token payload' });
    }
    
    // Lägg till userId i request object
    req.user = user;
    next();
  });
};

const router = Router();

// GET /api/cart - Hämta alla cart-objekt för inloggad användare
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response<CartItem[] | ErrorMessage>) => {
  try {
    // Extrahera userId från JWT token
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).send({ error: 'User ID not found in token' });
    }
    
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#type = :cartType AND userId = :userId',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':cartType': 'cart',
        ':userId': userId
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
    
    res.status(200).send(carts);
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).send({ error: 'Failed to fetch carts' });
  }
});

// GET /api/cart/user/:userId - Hämta alla cart-objekt för specifik användare
router.get('/user/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response<CartItem[] | ErrorMessage>) => {
  try {
    // Extrahera userId från JWT token
    const loggedInUserId = req.user?.id;
    const requestedUserId = req.params.userId;
    
    if (!loggedInUserId) {
      return res.status(401).send({ error: 'User ID not found in token' });
    }
    
    // Kontrollera att användaren bara kan hämta sina egna carts
    if (loggedInUserId !== requestedUserId) {
      return res.status(403).send({ error: 'You can only view your own cart items' });
    }
    
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#type = :cartType AND userId = :userId',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':cartType': 'cart',
        ':userId': requestedUserId
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
    
    res.status(200).send(carts);
  } catch (error) {
    console.error('Error fetching user carts:', error);
    res.status(500).send({ error: 'Failed to fetch user carts' });
  }
});

// GET /api/cart/:id - Hämta specifikt cart-objekt
router.get('/:id', async (req: Request<{id: string}>, res: Response<CartItem | ErrorMessage>) => {
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
      return res.status(404).send({ error: 'Cart not found' });
    }
    
    const cartResponse: CartResponse = {
      id: result.Item.pk?.replace('CART#', '') || '',
      userId: result.Item.userId || '',
      productId: result.Item.productId || '',
      amount: result.Item.amount || 0,
      type: 'cart'
    };
    
    res.status(200).send(cartResponse);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).send({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart - Skapa nytt cart-objekt för inloggad användare
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response<CartItem | ErrorMessage>) => {
  try {
    // Extrahera userId från JWT token
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).send({ error: 'User ID not found in token' });
    }
    
    // Validera inkommande data (utan userId i body)
    const validatedData = createCartSchema.parse(req.body);
    const { productId, amount } = validatedData;
    
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
    
    res.status(201).send(cartResponse);
  } catch (error: unknown) {
    console.error('Error creating cart:', error);
    
    // Hantera valideringsfel
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as { issues?: Array<{ message: string }>; errors?: Array<{ message: string }> };
      const errorDetails = zodError.issues || zodError.errors || [];
      return res.status(400).send({ 
        error: errorDetails.length > 0 
          ? errorDetails.map((err: { message: string }) => err.message).join(', ')
          : 'Invalid input data'
      });
    }
    
    res.status(500).send({ error: 'Failed to create cart' });
  }
});

// PUT /api/cart/:id - Uppdatera cart-objekt för inloggad användare
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response<CartItem | ErrorMessage>) => {
  try {
    const { id } = req.params;
    
    // Extrahera userId från JWT token
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).send({ error: 'User ID not found in token' });
    }
    
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
      return res.status(404).send({ error: 'Cart not found' });
    }
    
    // Kontrollera att användaren äger cart:en
    if (existingCart.Item.userId !== userId) {
      return res.status(403).send({ error: 'You can only update your own cart items' });
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
      id: id || '',
      userId: existingCart.Item.userId || '',
      productId: existingCart.Item.productId || '',
      amount,
      type: 'cart'
    };
    
    res.status(200).send(cartResponse);
  } catch (error: unknown) {
    console.error('Error updating cart:', error);
    
    // Hantera valideringsfel
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as { issues?: Array<{ message: string }>; errors?: Array<{ message: string }> };
      const errorDetails = zodError.issues || zodError.errors || [];
      return res.status(400).send({ 
        error: errorDetails.length > 0 
          ? errorDetails.map((err: { message: string }) => err.message).join(', ')
          : 'Invalid input data'
      });
    }
    
    res.status(500).send({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:id - Ta bort cart-objekt för inloggad användare
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response<{message: string} | ErrorMessage>) => {
  try {
    const { id } = req.params;
    
    // Extrahera userId från JWT token
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).send({ error: 'User ID not found in token' });
    }
    
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
      return res.status(404).send({ error: 'Cart not found' });
    }
    
    // Kontrollera att användaren äger cart:en
    if (existingCart.Item.userId !== userId) {
      return res.status(403).send({ error: 'You can only delete your own cart items' });
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
    
    res.status(200).send({ message: 'Cart deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting cart:', error);
    res.status(500).send({ error: 'Failed to delete cart' });
  }
});

export default router;

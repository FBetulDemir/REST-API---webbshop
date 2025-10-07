import { Router } from 'express';
import type { Request, Response } from 'express';

// Session interface
interface SessionData {
  userId?: string;
  userName?: string;
}
import { ddbDocClient, TABLE_NAME } from '../data/dynamoDb.js';
import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Cart, CreateCartRequest, UpdateCartRequest, CartResponse } from '../data/types.js';


type CartItem = CartResponse;
type ErrorMessage = { error: string };
import { createCartSchema, updateCartSchema } from '../schemas/cartSchemas.js';

const router = Router();

// Helper function to validate user exists
const validateUser = async (userId: string): Promise<boolean> => {
  try {
    const userCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `USER#${userId}`, sk: '#METADATA' }
    });
    const userResult = await ddbDocClient.send(userCommand);
    return userResult.Item ? true : false;
  } catch (error) {
    console.error('Error validating user:', error);
    return false;
  }
};

// Helper function to get user info
const getUserInfo = async (userId: string) => {
  try {
    const userCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `USER#${userId}`, sk: '#METADATA' }
    });
    const userResult = await ddbDocClient.send(userCommand);
    return userResult.Item ? { 
      name: userResult.Item.name, 
      email: userResult.Item.email 
    } : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// Helper function to get current logged-in user from session
const getCurrentUser = (req: Request): string | null => {
  const session = req.session as SessionData;
  return session?.userId || null;
};

// GET /api/cart - Hämta alla cart-objekt
router.get('/', async (req: Request, res: Response<CartItem[] | ErrorMessage>) => {
  try {
    // Backend styr - hämta användare från session
    const userId = getCurrentUser(req);
    if (!userId) {
      return res.status(401).send({ error: 'No active user found' });
    }
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
    
    // Konvertera till CartResponse format med user-info
    const carts: CartResponse[] = result.Items?.map(item => ({
      id: item.pk?.replace('CART#', '') || '',
      userId: item.userId || '',
      productId: item.productId || '',
      amount: item.amount || 0,
      type: 'cart' as const
    })) || [];
    
    // Filtrera för den inloggade användaren
    const userCarts = carts.filter(cart => cart.userId === userId);
    
    // Lägg till user-info för varje cart
    const cartsWithUsers = await Promise.all(
      userCarts.map(async cart => ({
        ...cart,
        user: await getUserInfo(cart.userId)
      }))
    );
    
    res.status(200).send(cartsWithUsers);
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).send({ error: 'Failed to fetch carts' });
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

// POST /api/cart - Skapa nytt cart-objekt eller uppdatera befintligt
router.post('/', async (req: Request<{}, CartItem | ErrorMessage, CreateCartRequest>, res: Response<CartItem | ErrorMessage>) => {
  try {
    // Backend styr - hämta användare från session
    const userId = getCurrentUser(req);
    if (!userId) {
      return res.status(401).send({ error: 'No active user found' });
    }
    
    // Validera inkommande data
    const validatedData = createCartSchema.parse({ ...req.body, userId });
    const { productId, amount } = validatedData;
    
    // Validera att användaren finns
    const userExists = await validateUser(userId);
    if (!userExists) {
      return res.status(404).send({ error: 'User not found' });
    }
    
    // Kolla om produkten redan finns i användarens varukorg
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#type = :cartType AND userId = :userId AND productId = :productId',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':cartType': 'cart',
        ':userId': userId,
        ':productId': productId
      }
    });
    
    const existingCart = await ddbDocClient.send(scanCommand);
    
    if (existingCart.Items && existingCart.Items.length > 0) {
      // Produkten finns redan - uppdatera antal
      const existingItem = existingCart.Items[0];
      if (!existingItem) {
        return res.status(500).send({ error: 'Cart item not found' });
      }
      
      const newAmount = (existingItem.amount || 0) + amount;
      
      const updateCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...existingItem,
          amount: newAmount
        }
      });
      
      await ddbDocClient.send(updateCommand);
      
      const cartResponse: CartResponse = {
        id: existingItem.pk?.replace('CART#', '') || '',
        userId,
        productId,
        amount: newAmount,
        type: 'cart'
      };
      
      res.status(200).send(cartResponse);
    } else {
      // Produkten finns inte - skapa ny cart
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
      
      const cartResponse: CartResponse = {
        id: cartId.replace('CART#', ''),
        userId,
        productId,
        amount,
        type: 'cart'
      };
      
      res.status(201).send(cartResponse);
    }
  } catch (error: any) {
    console.error('Error creating/updating cart:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).send({ error: 'Invalid data provided' });
    }
    
    res.status(500).send({ error: 'Failed to create/update cart' });
  }
});

// PUT /api/cart/:id - Uppdatera cart-objekt
router.put('/:id', async (req: Request<{id: string}, CartItem | ErrorMessage, UpdateCartRequest>, res: Response<CartItem | ErrorMessage>) => {
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
      return res.status(404).send({ error: 'Cart not found' });
    }
    
    // Validera att användaren fortfarande finns
    const userExists = await validateUser(existingCart.Item.userId);
    if (!userExists) {
      return res.status(404).send({ error: 'User not found' });
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
    
    res.status(200).send(cartResponse);
  } catch (error: any) {
    console.error('Error updating cart:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).send({ error: 'Invalid data provided' });
    }
    
    res.status(500).send({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:id - Ta bort cart-objekt
router.delete('/:id', async (req: Request<{id: string}>, res: Response<{message: string} | ErrorMessage>) => {
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
      return res.status(404).send({ error: 'Cart not found' });
    }
    
    // Validera att användaren fortfarande finns
    const userExists = await validateUser(existingCart.Item.userId);
    if (!userExists) {
      return res.status(404).send({ error: 'User not found' });
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
  } catch (error: any) {
    console.error('Error deleting cart:', error);
    res.status(500).send({ error: 'Failed to delete cart' });
  }
});

export default router;

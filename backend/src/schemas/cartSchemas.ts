import { z } from 'zod';

// Cart validation schemas
export const createCartSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  amount: z.number().int().positive('Amount must be a positive integer')
});

export const updateCartSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer')
});

export const cartIdSchema = z.string().min(1, 'Cart ID is required');

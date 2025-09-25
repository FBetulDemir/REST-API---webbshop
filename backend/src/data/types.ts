// TypeScript interfaces för alla entiteter i webbshoppen

// Cart interfaces
export interface Cart {
  PK: string;           // CART#1, CART#2, etc.
  SK: string;           // #METADATA
  userId: string;       // USER#1, USER#2, etc.
  productId: string;    // PRODUCT#3, PRODUCT#7, etc.
  amount: number;       // Antal av produkten
  type: 'cart';         // Alltid 'cart'
}

export interface CreateCartRequest {
  userId: string;
  productId: string;
  amount: number;
}

export interface UpdateCartRequest {
  amount: number;
}

export interface CartResponse {
  id: string;           // Extraherat från PK (CART#1 -> 1)
  userId: string;
  productId: string;
  amount: number;
  type: 'cart';
}

// User interfaces
export interface User {
  PK: string;           // USER#1, USER#2, etc.
  SK: string;           // #METADATA
  name: string;
  type: 'user';
}

export interface CreateUserRequest {
  name: string;
}

export interface UserResponse {
  id: string;           // Extraherat från PK (USER#1 -> 1)
  name: string;
  type: 'user';
}

// Product interfaces
export interface Product {
  PK: string;           // PRODUCT#1, PRODUCT#2, etc.
  SK: string;           // #METADATA
  name: string;
  price: number;
  image: string;
  amountInStock: number;
  type: 'product';
}

export interface CreateProductRequest {
  name: string;
  price: number;
  image: string;
  amountInStock: number;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  image?: string;
  amountInStock?: number;
}

export interface ProductResponse {
  id: string;           // Extraherat från PK (PRODUCT#1 -> 1)
  name: string;
  price: number;
  image: string;
  amountInStock: number;
  type: 'product';
}

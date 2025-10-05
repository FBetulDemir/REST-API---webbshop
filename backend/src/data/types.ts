// TypeScript interfaces för alla entiteter i webbshoppen

// Cart interfaces
export interface Cart {
  pk: string;           // CART#1, CART#2, etc.
  sk: string;           // #METADATA
  userId: string;       // USER#1, USER#2, etc.
  productId: string;    // PRODUCT#3, PRODUCT#7, etc.
  amount: number;       // Antal av produkten
  type: 'cart';         // Alltid 'cart'
}

export interface CreateCartRequest {
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


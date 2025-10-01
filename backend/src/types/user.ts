export interface User {
  id: string;
  name: string;
  password: string;
  email?: string;
  type: "user";
}

export interface RegisterRequest {
  name: string;
  password: string;
  email?: string;
}

export interface LoginRequest {
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

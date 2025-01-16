export interface RegisterUser {
  username: string;
  email: string;
  colboNumber: number;
  password: string;
}
export interface LoginUser {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    isMuted: boolean;
    isBanned: boolean;
  }
  
  export interface AuthApiResponse {
    success: boolean;
    data?: { // Make data optional in case success is false
      user: User;
    };
    message?: string; // Optional error message
  }
  
import { createAuthClient } from "better-auth/react";
import { username, organization } from "better-auth/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [username(), organization()],
});

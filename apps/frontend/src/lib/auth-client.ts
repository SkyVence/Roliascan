import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient, usernameClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000/auth/",
  plugins: [usernameClient(), organizationClient(), adminClient(), usernameClient()],
});


export const {
    signIn,
    signOut,
    signUp,
    useSession
} = authClient;
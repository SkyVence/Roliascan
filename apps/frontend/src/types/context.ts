export type UserContextType = {
    userId: string;
    username: string;
    email: string;
    role: string;
    teamRole: {
        [teamId: string]: string;
    }
}

export interface AuthContextType {
    user: UserContextType | null;
    isLoading: boolean;
    isSubmitting: boolean;
    isAuthenticated: boolean;
    refetchUser: () => Promise<void>;
    logout: () => Promise<void>;
    handleAuthAction: (
        endpoint: string,
        payload: any,
        form: any,
        successMessage: string,
        successRedirect?: string
    ) => Promise<void>;
}
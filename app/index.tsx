import React from "react";
import { NavigationIndependentTree, NavigationContainer } from "@react-navigation/native";
import AuthStack from "@/navigation/AuthStack";
import AppStack from "@/navigation/AppStack";
import { useAuthStore } from "@/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes standard stale time
        },
    },
});

export default function App() {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    return (
        <QueryClientProvider client={queryClient}>
            <NavigationIndependentTree>
                <NavigationContainer>
                    {isLoggedIn ? <AppStack /> : <AuthStack />}
                </NavigationContainer>
            </NavigationIndependentTree>
        </QueryClientProvider>
    );
}
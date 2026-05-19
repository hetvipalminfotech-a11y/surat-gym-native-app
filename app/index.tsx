import React, { useEffect, useState } from "react";
import { NavigationIndependentTree, NavigationContainer } from "@react-navigation/native";
import { View } from "react-native";
import AuthStack from "@/navigation/AuthStack";
import AppStack from "@/navigation/AppStack";
import { getToken, getUser, storage } from "@/storage/mmkv";

export default function App() {
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = getToken();
            const user = getUser();
            setIsLoggedIn(!!(token && user));
        };

        checkAuth();
        setLoading(false);

        // Listen for storage changes reactively (login or logout)
        const listener = storage.addOnValueChangedListener((key) => {
            if (key === "token" || key === "user") {
                checkAuth();
            }
        });

        return () => {
            listener.remove();
        };
    }, []);

    if (loading) return null;

    return (
        <NavigationIndependentTree>
            <NavigationContainer>
                {isLoggedIn ? <AppStack /> : <AuthStack />}
            </NavigationContainer>
        </NavigationIndependentTree>
    );
}
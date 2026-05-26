import React, { useEffect } from "react";
import { NavigationIndependentTree, NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import AuthStack from "@/navigation/AuthStack";
import AppStack from "@/navigation/AppStack";
import { useAuthStore } from "@/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootStackParamList } from "@/navigation/types";
import API from "@/services/api";
import { Member, MemberPtSession } from "@/services/receptionist.service";

let Notifications: typeof import("expo-notifications") | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require("expo-notifications");
    Notifications?.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

} catch (err) {
    console.warn("expo-notifications is not available in standard Expo Go:", err);
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes standard stale time
        },
    },
});

// Provide RootStackParamList to the navigation container ref for 100% TypeScript safety
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    useEffect(() => {
        if (!Notifications) return;

        // 1. Handle cold launch deep-linking (when app was completely closed/killed and launched by tapping notification)
        Notifications.getLastNotificationResponseAsync().then(async response => {
            if (response) {
                const data = response.notification.request.content.data;
                console.log("[Push Notification] Cold Start Deep Link:", data);
                if (!data) return;

                try {
                    // Wait until navigation container is fully loaded and user login session is established
                    let checkAttempts = 0;
                    while ((!navigationRef.isReady() || !useAuthStore.getState().isLoggedIn) && checkAttempts < 40) {
                        await new Promise(resolve => setTimeout(resolve, 250));
                        checkAttempts++;
                    }

                    if (!navigationRef.isReady() || !useAuthStore.getState().isLoggedIn) {
                        console.warn("[Push Notification] App took too long to boot or user is not logged in.");
                        return;
                    }

                    // A brief solid 800ms delay to let the default initial route fully mount and prevent routing override
                    await new Promise(resolve => setTimeout(resolve, 800));

                    if (data.memberId) {
                        const memberId = Number(data.memberId);
                        if (isNaN(memberId)) return;

                        const res = await API.get(`/members/${memberId}`);
                        const member = res.data?.data as Member;
                        if (member) {
                            navigationRef.navigate("MemberDetail", { member });
                        }
                    } else if (data.sessionId) {
                        const sessionId = Number(data.sessionId);
                        if (isNaN(sessionId)) return;

                        const res = await API.get(`/pt-sessions/${sessionId}`);
                        const session = res.data?.data as MemberPtSession;
                        if (session) {
                            navigationRef.navigate("PtSessionDetail", { session });
                        }
                    }
                } catch (err) {
                    console.error("[Push Notification] Cold launch routing failed:", (err as Error).message);
                }
            }
        });

        // 2. Global subscriber for incoming notifications while app is in foreground
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            const { title, body } = notification.request.content;
            console.log("[Push Notification] Foreground Received:", title, body);
        });

        // 3. Global subscriber for notification interactions/taps while app is running (foreground or background)
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
            const data = response.notification.request.content.data;
            console.log("[Push Notification] Tap Interaction Received:", data);
            if (!data) return;

            try {
                let checkAttempts = 0;
                while (!navigationRef.isReady() && checkAttempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                    checkAttempts++;
                }

                if (!navigationRef.isReady()) {
                    console.warn("[Push Notification] Navigation container not ready.");
                    return;
                }

                // A brief 400ms delay to let the app transition smoothly to active/foreground state before navigating
                await new Promise(resolve => setTimeout(resolve, 400));

                if (data.memberId) {
                    const memberId = Number(data.memberId);
                    if (isNaN(memberId)) return;

                    const res = await API.get(`/members/${memberId}`);
                    const member = res.data?.data as Member;
                    if (member) {
                        navigationRef.navigate("MemberDetail", { member });
                    }
                } else if (data.sessionId) {
                    const sessionId = Number(data.sessionId);
                    if (isNaN(sessionId)) return;

                    const res = await API.get(`/pt-sessions/${sessionId}`);
                    const session = res.data?.data as MemberPtSession;
                    if (session) {
                        navigationRef.navigate("PtSessionDetail", { session });
                    }
                }
            } catch (err) {
                console.error("[Push Notification] Interactive tap routing failed:", (err as Error).message);
            }
        });

        return () => {
            foregroundSubscription.remove();
            responseSubscription.remove();
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <NavigationIndependentTree>
                <NavigationContainer ref={navigationRef}>
                    {isLoggedIn ? <AppStack /> : <AuthStack />}
                </NavigationContainer>
            </NavigationIndependentTree>
        </QueryClientProvider>
    );
}
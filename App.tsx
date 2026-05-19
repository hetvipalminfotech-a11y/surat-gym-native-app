// import React, { useEffect, useState } from "react";
// import { NavigationIndependentTree,NavigationContainer } from "@react-navigation/native";
// import AuthStack from "./src/navigation/AuthStack";
// import AppStack from "./src/navigation/AppStack";
// import { getToken, getUser } from "./src/storage/mmkv";
// import { View } from "react-native";

// export default function App() {
//   const [loading, setLoading] = useState(true);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   useEffect(() => {
//     const token = getToken();
//     const user = getUser();

//     if (token && user) {
//       setIsLoggedIn(true);
//     }

//     setLoading(false);
//   }, []);

//   if (loading) return null;

//   return (
//     <NavigationIndependentTree>
//     <NavigationContainer>
//       {isLoggedIn ? <AppStack /> : <AuthStack />}
    
//     </NavigationContainer>
//     </NavigationIndependentTree>
//   );
// }   
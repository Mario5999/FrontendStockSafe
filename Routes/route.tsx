import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import Login from "./Login";
import RestaurantRegister from "./RestaurantRegister";
import RestaurantSetup from "./RestaurantSetup";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import AdminDashboard from "./AdminDashboard";
import RestaurantDashboard from "./RestaurantDashboard";
import RoleSelect from "./RoleSelect";
import Inventory from "./Inventory";
import EmployeeInventory from "./EmployeeInventory";
import InventoryReport from "./InventoryReport";
import NotFound from "./NotFound";

const Stack = createNativeStackNavigator();

export function Router() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={Login}
        options={{ headerShown: false }} />
      <Stack.Screen
        name="Register" component={RestaurantRegister}
        options={{ headerShown: true, headerTitleAlign: "center",
          headerTitle: () => (
            <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", lineHeight: 18 }} numberOfLines={1}>
                Registro de Restaurante
              </Text>
              <Text style={{ fontSize: 16, lineHeight: 16, color: "#6b7280" }} numberOfLines={1}>
                Crea tu cuenta empresarial
              </Text>
            </View>
          ),
        }}
      />
      <Stack.Screen name="Setup" component={RestaurantSetup} 
        options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword}
        options={{ headerShown: false }} />
      <Stack.Screen name="ResetPassword" component={ResetPassword}
        options={{ headerShown: false }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} 
        options={{ headerShown: true }} />
      <Stack.Screen name="RestaurantDashboard" component={RestaurantDashboard} 
        options= {{ headerShown: false}} />
      <Stack.Screen name="RoleSelect" component={RoleSelect}
        options={{ headerShown: false }} />
      <Stack.Screen name="Inventory" component={Inventory}
        options={{ headerShown: false}} />
      <Stack.Screen name="EmployeeInventory" component={EmployeeInventory} 
        options={{ headerShown: false}}/>
      <Stack.Screen name="InventoryReport" component={InventoryReport} 
        options={{ headerShown: false }} />
      <Stack.Screen name="NotFound" component={NotFound} />
    </Stack.Navigator>
  );
}
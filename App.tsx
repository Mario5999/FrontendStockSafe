import { NavigationContainer } from "@react-navigation/native";
import { Router } from "./Routes/route";

export default function App() {
  return (
    <NavigationContainer>
      <Router />
    </NavigationContainer>
  );
}
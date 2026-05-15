import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import LoginScreen from './screens/LoginScreen';
import EventSelectScreen from './screens/EventSelectScreen';
import ScannerScreen from './screens/ScannerScreen';

export type RootStackParamList = {
  Login: undefined;
  EventSelect: { staffId: string; staffName: string };
  Scanner: { staffId: string; staffName: string; eventId: string; eventTitle: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="EventSelect" component={EventSelectScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

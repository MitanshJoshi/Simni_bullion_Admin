import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, AuthStackParamList, AppStackParamList } from '../types/navigation';
import { useAppSelector } from '../store';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import KycListScreen from '../screens/KycListScreen';
import KycDetailScreen from '../screens/KycDetailScreen';
import OrderListScreen from '../screens/OrderListScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import UserListScreen from '../screens/UserListScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuditLogScreen from '../screens/AuditLogScreen';

const Root = createNativeStackNavigator<RootStackParamList>();
const Auth = createNativeStackNavigator<AuthStackParamList>();
const App = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={LoginScreen} />
    </Auth.Navigator>
  );
}

function AppNavigator() {
  return (
    <App.Navigator screenOptions={{ headerShown: false }}>
      <App.Screen name="Dashboard" component={DashboardScreen} />
      <App.Screen name="KycList" component={KycListScreen} />
      <App.Screen name="KycDetail" component={KycDetailScreen} />
      <App.Screen name="OrderList" component={OrderListScreen} />
      <App.Screen name="OrderDetail" component={OrderDetailScreen} />
      <App.Screen name="ProductList" component={ProductListScreen} />
      <App.Screen name="ProductForm" component={ProductFormScreen} />
      <App.Screen name="UserList" component={UserListScreen} />
      <App.Screen name="UserDetail" component={UserDetailScreen} />
      <App.Screen name="Settings" component={SettingsScreen} />
      <App.Screen name="AuditLog" component={AuditLogScreen} />
    </App.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {isAuthenticated ? (
          <Root.Screen name="App" component={AppNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

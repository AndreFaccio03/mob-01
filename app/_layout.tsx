import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // O screenOptions={{ headerShown: false }} é o comando mágico
    // que desliga o cabeçalho global do aplicativo
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
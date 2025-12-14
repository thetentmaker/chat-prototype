import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { store } from '@/store';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Provider } from 'react-redux';

export default function RootLayout() {
    return (
        <Provider store={store}>
            <KeyboardProvider>
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="agent-chat"
                        options={{
                            title: 'Agent Chat',
                            headerBackTitle: '홈',
                        }}
                    />
                </Stack>
                <StatusBar style="auto" />
            </KeyboardProvider>
        </Provider>
    );
}

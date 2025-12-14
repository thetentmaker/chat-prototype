import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { Message, sendMessage } from '@/store/chatSlice';
import { useRef, useState } from 'react';
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AgentChatScreen() {
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const dispatch = useAppDispatch();
    const { messages, isLoading } = useAppSelector((state) => state.chat);

    const handleSend = () => {
        if (inputText.trim() === '') return;

        dispatch(sendMessage(inputText.trim()));
        setInputText('');

        // 메시지 전송 시 스크롤을 아래로 이동 (Footer 덕분에 메시지를 상단에 위치시킬 수 있음)
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.agentMessage]}>
                <Text style={[styles.roleLabel, isUser ? styles.userLabel : styles.agentLabel]}>
                    {isUser ? '나' : 'Agent'}
                </Text>
                <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.content}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 400 }} />}
                    onContentSizeChange={() => {
                        // 리스트 크기가 변경되면(화면 진입 및 새 메시지) 즉시 바닥으로 스크롤
                        if (messages.length > 0) {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }
                    }}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="메시지를 입력하세요..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={isLoading || inputText.trim() === ''}
                    >
                        <Text style={styles.sendButtonText}>
                            {isLoading ? '...' : '전송'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    messageContainer: {
        marginVertical: 8,
        padding: 12,
        borderRadius: 12,
        maxWidth: '90%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    agentMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    userLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    agentLabel: {
        color: '#666',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
    },
    userMessageText: {
        color: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        backgroundColor: '#f9f9f9',
    },
    sendButton: {
        marginLeft: 8,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

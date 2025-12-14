import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { Message, sendMessage } from '@/store/chatSlice';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
    const [isInitializing, setIsInitializing] = useState(true);
    // 각각 독립적으로 최초 1회 실행을 보장하기 위한 변수들
    const hasScrolledForContent = useRef(false);
    const hasScrolledForLayout = useRef(false);

    const dispatch = useAppDispatch();
    const { messages, isLoading } = useAppSelector((state) => state.chat);

    // 화면 진입 시 초기 로딩 처리 (UI Freezing 방지)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitializing(false);
        }, 500); // 0.5초 로딩
        return () => clearTimeout(timer);
    }, []);

    const handleSend = () => {
        if (inputText.trim() === '') return;

        dispatch(sendMessage(inputText.trim()));
        setInputText('');

        // 메시지 전송 시에는 수동으로 스크롤 (onContentSizeChange 사용 안 함)
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

    if (isInitializing) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>대화 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                    initialNumToRender={messages.length > 0 ? messages.length : 10} // 모든 아이템을 미리 렌더링하여 스크롤 위치 계산 정확도 확보
                    // initialScrollIndex={messages.length > 0 ? messages.length - 1 : 0}
                    ListFooterComponent={<View style={{ height: 400 }} />}
                    onContentSizeChange={() => {
                        // 첫 진입 시 (내용물 크기 완성 시점)
                        if (messages.length > 0 && !hasScrolledForContent.current) {
                            hasScrolledForContent.current = true;
                            // 렌더링 타이밍 이슈로 인해 약간의 지연 후 스크롤
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: false });
                            }, 100); // 로딩 후 렌더링이라 0.1초면 충분함
                        }
                    }}
                    onLayout={() => {
                        // 첫 진입 시 (레이아웃 완성 시점)
                        if (messages.length > 0 && !hasScrolledForLayout.current) {
                            hasScrolledForLayout.current = true;
                            // 렌더링 타이밍 이슈로 인해 약간의 지연 후 스크롤
                            setTimeout(() => {
                                // flatListRef.current?.scrollToEnd({ animated: false });
                            }, 100); // 로딩 후 렌더링이라 0.1초면 충분함
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
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

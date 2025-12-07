import React, { useEffect, useRef } from 'react';
import { Dimensions, FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addUserMessage, ChatItem, streamResponse } from '../../store/chatSlice';

const { height } = Dimensions.get('window');

// Separate component for rendering items to keep the main component clean
const ChatItemRenderer = ({ item, index }: { item: ChatItem; index: number }) => {
    if (item.type === 'user_question') {
        return (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.userMessageContainer}>
                <View style={styles.userMessageBubble}>
                    <Text style={styles.userMessageText}>{item.content}</Text>
                </View>
            </Animated.View>
        );
    }

    if (item.type === 'ai_status') {
        return (
            <Animated.View entering={FadeIn.duration(300)} style={styles.aiMessageContainer}>
                <View style={styles.aiStatusBubble}>
                    <Text style={styles.aiStatusText}>Thinking...</Text>
                </View>
            </Animated.View>
        );
    }

    // AI Answer Chunk
    return (
        <Animated.View entering={FadeIn.duration(150)} style={styles.aiMessageContainer}>
            {/* We can style this to look like a continuous stream or discrete blocks */}
            <Text style={styles.aiChunkText}>{item.content}</Text>
        </Animated.View>
    );
};

export const ChatScreen = () => {
    const dispatch = useDispatch();
    const { items, isGenerating } = useSelector((state: RootState) => state.chat);
    const [inputText, setInputText] = React.useState('');
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    const lastScrolledUserMessageId = useRef<string | null>(null);

    const pendingScrollIndex = useRef<number | null>(null);

    // 사용자 메시지가 추가될 때 스크롤할 인덱스 저장
    useEffect(() => {
        if (items.length > 0) {
            // 마지막 사용자 메시지 찾기 (뒤에서부터 탐색)
            let lastUserMessageIndex = -1;
            for (let i = items.length - 1; i >= 0; i--) {
                if (items[i].type === 'user_question') {
                    lastUserMessageIndex = i;
                    break;
                }
            }

            if (lastUserMessageIndex !== -1) {
                const lastUserMessage = items[lastUserMessageIndex];

                // 이미 스크롤한 메시지가 아니면 스크롤 예약
                if (lastUserMessage.id !== lastScrolledUserMessageId.current) {
                    pendingScrollIndex.current = lastUserMessageIndex;
                    lastScrolledUserMessageId.current = lastUserMessage.id;
                }
            }
        }
    }, [items]);

    // 콘텐츠가 그려진 후 스크롤 실행
    const onContentSizeChange = () => {
        if (pendingScrollIndex.current !== null) {
            flatListRef.current?.scrollToIndex({
                index: pendingScrollIndex.current,
                viewPosition: 0, // 최상단에 위치
                animated: false, // 깜빡임 방지를 위해 애니메이션 끔
            });

            // AI 응답이 끝나면 스크롤 예약 해제
            if (!isGenerating) {
                pendingScrollIndex.current = null;
            }
        }
    };

    const onScrollToIndexFailed = (info: {
        index: number;
        highestMeasuredFrameIndex: number;
        averageItemLength: number;
    }) => {
        // 스크롤 실패 시 대체 방법
        flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
        });
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        dispatch(addUserMessage(inputText.trim()));
        setInputText('');
        dispatch(streamResponse() as any); // Type cast for Thunk
        Keyboard.dismiss();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
            <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                <FlatList
                    ref={flatListRef}
                    data={items}
                    renderItem={({ item, index }) => <ChatItemRenderer item={item} index={index} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    style={styles.list}
                    ListFooterComponent={<View style={{ height: height * 0.8 }} />}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    onContentSizeChange={onContentSizeChange}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask AI..."
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                        editable={!isGenerating}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={isGenerating || !inputText.trim()}
                        style={[styles.sendButton, (isGenerating || !inputText.trim()) && styles.sendButtonDisabled]}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        gap: 8, // Using gap for spacing between items
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
        maxWidth: '80%',
        marginBottom: 12,
    },
    userMessageBubble: {
        backgroundColor: '#007AFF', // iOS Blue
        padding: 12,
        borderRadius: 20,
        borderBottomRightRadius: 4,
    },
    userMessageText: {
        color: '#fff',
        fontSize: 16,
    },
    aiMessageContainer: {
        alignSelf: 'flex-start',
        maxWidth: '90%',
        marginBottom: 4, // Smaller margin between chunks to make them feel cohesive
    },
    aiStatusBubble: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 12,
    },
    aiStatusText: {
        color: '#888',
        fontSize: 14,
        fontStyle: 'italic',
    },
    aiChunkText: {
        color: '#000',
        fontSize: 16,
        lineHeight: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: '#f4f4f4',
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
    },
    sendButton: {
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

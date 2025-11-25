import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};

// import { useNetInfo } from '@react-native-community/netinfo';

export default function RootLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  // const netInfo = useNetInfo();
  // const [isConnected, setIsConnected] = useState(netInfo.isConnected);
  const sendMessage = () => {
    if (inputText.trim().length > 0) {
      const userMsg: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
      };
      setMessages((prevMessages) => [...prevMessages, userMsg]);
      setInputText('');

      // AI 응답 시뮬레이션
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: `AI Answer to: ${userMsg.text}`,
          sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, aiMsg]);
      }, 1500);
    }
  };

  const lastScrolledMessageId = useRef<string | null>(null);

  // 메시지가 변경될 때마다 실행됩니다.
  useEffect(() => {
    if (messages.length > 0) {
      // 뒤에서부터 탐색하여 가장 최근의 '사용자' 메시지를 찾습니다.
      // 이렇게 하면 AI 답변이 이미 달린 상태라도(마지막 메시지가 AI라도) 사용자의 질문 위치를 찾을 수 있습니다.
      const lastUserMessageIndex = messages.map((m) => m.sender).lastIndexOf('user');

      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = messages[lastUserMessageIndex];

        // 이미 스크롤한 메시지인지 확인합니다. (중복 스크롤 방지)
        if (lastUserMessage.id !== lastScrolledMessageId.current) {
          // 레이아웃 업데이트를 기다리기 위해 잠시 지연시킵니다.
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: lastUserMessageIndex,
              viewPosition: 0, // 0은 뷰포트의 최상단을 의미합니다.
              animated: true,
            });
          }, 100);

          // 스크롤한 메시지 ID를 저장하여 다음에 중복으로 스크롤하지 않도록 합니다.
          lastScrolledMessageId.current = lastUserMessage.id;
        }
      }
    }
  }, [messages]);

  const onScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    // 이 콜백은 scrollToIndex가 실패했을 때 실행됩니다.
    // 주로 리스트의 아이템이 아직 렌더링되지 않았거나 레이아웃이 측정되지 않았을 때 발생합니다.
    // 이때는 averageItemLength(평균 아이템 길이)를 사용하여 대략적인 위치로 스크롤함으로써
    // 스크롤 동작이 완전히 무시되는 것을 방지하는 '안전장치' 역할을 합니다.
    flatListRef.current?.scrollToOffset({
      offset: info.averageItemLength * info.index,
      animated: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageItem,
                item.sender === 'user' ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<View style={{ height: height * 0.8 }} />}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            returnKeyType="done"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  messageItem: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    color: 'black', // 기본 텍스트 색상
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white', // Set to white so the input field background is not transparent
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  offlineContainer: {
    backgroundColor: '#b52424',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  offlineText: {
    color: '#fff',
  },
});

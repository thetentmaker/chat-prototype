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

export default function RootLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

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

  // 메시지가 변경될 때, '사용자'가 보낸 메시지인 경우에만 해당 메시지로 스크롤합니다.
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // 마지막 메시지가 사용자의 질문인 경우에만 스크롤을 이동합니다.
      // 이렇게 하면 사용자가 질문을 입력했을 때 화면이 위로 올라가서(Focus Mode) 질문에 집중할 수 있습니다.
      if (lastMessage.sender === 'user') {
        // 레이아웃 업데이트를 기다리기 위해 잠시 지연시킵니다.
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: messages.length - 1,
            viewPosition: 0, // 0은 뷰포트의 최상단을 의미합니다. 즉, 메시지가 화면 맨 위에 위치하게 됩니다.
            animated: true,
          });
        }, 100);
      }
      // AI의 답변이 달릴 때는 위 조건(lastMessage.sender === 'user')을 만족하지 않으므로 스크롤이 발생하지 않습니다.
      // 따라서 사용자의 질문이 화면 상단에 유지되고, AI 답변은 그 아래에 자연스럽게 추가되어 질문이 가려지지 않습니다.
    }
  }, [messages]);

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
          onScrollToIndexFailed={(info) => {
            // 이 콜백은 scrollToIndex가 실패했을 때 실행됩니다.
            // 주로 리스트의 아이템이 아직 렌더링되지 않았거나 레이아웃이 측정되지 않았을 때 발생합니다.
            // 이때는 averageItemLength(평균 아이템 길이)를 사용하여 대략적인 위치로 스크롤함으로써
            // 스크롤 동작이 완전히 무시되는 것을 방지하는 '안전장치' 역할을 합니다.
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
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
});

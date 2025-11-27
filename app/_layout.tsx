import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

type Message = {
  id: string;
  text: string;
  displayedText?: string; // 타이핑 효과를 위한 표시된 텍스트
  sender: "user" | "ai";
  isTyping?: boolean; // 타이핑 중인지 여부
};

// import { useNetInfo } from '@react-native-community/netinfo';

export default function RootLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // const netInfo = useNetInfo();
  // const [isConnected, setIsConnected] = useState(netInfo.isConnected);
  const sendMessage = () => {
    if (inputText.trim().length > 0) {
      const userMsg: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: "user",
      };
      setMessages((prevMessages) => [...prevMessages, userMsg]);
      setInputText("");

      // AI 응답 시뮬레이션
      setTimeout(() => {
        // 애국가 4절을 4번 반복
        const anthem = `동해 물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세 무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세\n\n남산 위에 저 소나무 철갑을 두른 듯 바람 서리 불변함은 우리 기상일세 무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세\n\n가을 하늘 공활한데 높고 구름 없이 밝은 달은 우리 가슴 일편단심일세 무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세\n\n이 기상과 이 맘으로 충성을 다하여 괴로우나 즐거우나 나라 사랑하세 무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세`;
        const fullText = `${anthem}\n\n${anthem}\n\n${anthem}\n\n${anthem}`;

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: fullText,
          displayedText: "",
          sender: "ai",
          isTyping: true,
        };
        setMessages((prevMessages) => [...prevMessages, aiMsg]);
      }, 1500);
    }
  };

  const lastScrolledMessageId = useRef<string | null>(null);

  // 타이핑 효과를 위한 useEffect
  useEffect(() => {
    // 타이핑 중인 메시지 찾기
    const typingMessage = messages.find((msg) => msg.isTyping && msg.sender === "ai");

    if (typingMessage && typingMessage.displayedText !== undefined) {
      const fullText = typingMessage.text;
      const currentDisplayed = typingMessage.displayedText;

      // 아직 모든 텍스트를 표시하지 않았다면
      if (currentDisplayed.length < fullText.length) {
        // 기존 인터벌 정리
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }

        // 한 글자씩 추가하는 인터벌 설정
        typingIntervalRef.current = setInterval(() => {
          setMessages((prevMessages) =>
            prevMessages.map((msg) => {
              if (msg.id === typingMessage.id && msg.isTyping) {
                const newDisplayedText = fullText.slice(0, msg.displayedText!.length + 1);
                const isComplete = newDisplayedText.length === fullText.length;

                return {
                  ...msg,
                  displayedText: newDisplayedText,
                  isTyping: !isComplete,
                };
              }
              return msg;
            })
          );
        }, 10); // 30ms마다 한 글자씩 (조절 가능)
      } else {
        // 타이핑 완료
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }

    // cleanup 함수
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [messages]);

  // 메시지가 변경될 때마다 실행됩니다.
  useEffect(() => {
    if (messages.length > 0) {
      // 뒤에서부터 탐색하여 가장 최근의 '사용자' 메시지를 찾습니다.
      // 이렇게 하면 AI 답변이 이미 달린 상태라도(마지막 메시지가 AI라도) 사용자의 질문 위치를 찾을 수 있습니다.
      const lastUserMessageIndex = messages
        .map((m) => m.sender)
        .lastIndexOf("user");

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

  // 스크롤이 시작될 때 키보드를 닫는 핸들러
  const handleScrollBeginDrag = () => {
    Keyboard.dismiss();
  };

  // Footer 높이를 계산
  // 목적: 사용자 메시지가 최상단에 위치하도록 유지
  // AI 답변이 추가되어도 Footer 높이를 고정하여 사용자 메시지 위치를 유지
  const calculateFooterHeight = () => {
    if (messages.length === 0) return 0;

    // 마지막 사용자 메시지의 인덱스를 찾습니다
    const lastUserMessageIndex = messages
      .map((m) => m.sender)
      .lastIndexOf("user");

    // 사용자 메시지가 없으면 Footer 불필요
    if (lastUserMessageIndex === -1) return 0;

    // 사용자 메시지가 있으면 화면 높이의 75%를 Footer로 고정
    // 이렇게 하면 AI 답변이 추가되어도 사용자 메시지는 화면 최상단에 유지됩니다
    return height * 0.75;
  };

  const footerHeight = calculateFooterHeight();

  return (
    <SafeAreaView style={styles.container}>
      {/* TopBar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>AI상담사</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageItem,
                item.sender === "user" ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={styles.messageText}>
                {item.sender === "ai" && item.displayedText !== undefined
                  ? item.displayedText
                  : item.text}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 30 }} />}
          ListFooterComponent={<View style={{ height: footerHeight }} />}
          onScrollToIndexFailed={onScrollToIndexFailed}
          onScrollBeginDrag={handleScrollBeginDrag}
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
    backgroundColor: "white",
  },
  topBar: {
    height: 80,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
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
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 16,
    color: "black", // 기본 텍스트 색상
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white", // Set to white so the input field background is not transparent
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
  },
  offlineContainer: {
    backgroundColor: "#b52424",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  offlineText: {
    color: "#fff",
  },
});

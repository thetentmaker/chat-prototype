import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatItem {
  id: string;
  type: 'user_question' | 'ai_status' | 'ai_answer_chunk';
  content: string;
}

interface ChatState {
  items: ChatItem[];
  isGenerating: boolean;
}

const initialState: ChatState = {
  items: [],
  isGenerating: false,
};

// Mock response text
const MOCK_RESPONSE = `This is a simulated AI response.\n\nI am built using React Native and Redux.\n\nI am streaming this text chunk by chunk to demonstrate the "Multiple Items" architecture you requested.`;

export const streamResponse = createAsyncThunk(
  'chat/streamResponse',
  async (_, { dispatch }) => {
    // 1. Simulate network delay (Thinking time)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Remove status item
    dispatch(chatSlice.actions.removeStatus());

    // 3. Stream chunks
    // We split by newlines to simulate paragraphs or blocks
    // This makes "Multiple Items" presentation look like separate paragraphs/bubbles
    const chunks = MOCK_RESPONSE.split(/\n\n/); 
    
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      dispatch(chatSlice.actions.addAnswerChunk(chunk.trim()));
      // Random delay between 500ms and 1500ms for block simulation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.items.push({
        id: Date.now().toString(),
        type: 'user_question',
        content: action.payload,
      });
      // Add status immediately after
      state.items.push({
        id: 'status-' + Date.now(),
        type: 'ai_status',
        content: 'Thinking...',
      });
      state.isGenerating = true;
    },
    removeStatus: (state) => {
      state.items = state.items.filter(item => item.type !== 'ai_status');
    },
    addAnswerChunk: (state, action: PayloadAction<string>) => {
      state.items.push({
        id: 'chunk-' + Date.now() + Math.random(),
        type: 'ai_answer_chunk',
        content: action.payload,
      });
    },
    resetChat: (state) => {
      state.items = [];
      state.isGenerating = false;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(streamResponse.fulfilled, (state) => {
      state.isGenerating = false;
    });
  }
});

export const { addUserMessage, removeStatus, addAnswerChunk, resetChat } = chatSlice.actions;
export default chatSlice.reducer;

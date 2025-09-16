export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
}

export interface HeaderProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  onNewConversation: () => void
  onSelectConversation: (conversation: Conversation) => void
  onOpenSettings: () => void
}

export interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export interface InputAreaProps {
  disabled: boolean
}
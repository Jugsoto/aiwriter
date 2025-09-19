export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  reasoningContent?: string // 推理内容
  isReasoning?: boolean // 是否正在推理
  showReasoning?: boolean // 是否显示推理内容
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  bookId: number
  createdAt: Date
  updatedAt: Date
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
  starredSettings?: any[]
  settingsLoading?: boolean
  bookId?: number
  selectedSettings?: any[]
}

export interface CopilotSettings {
  contextLength: number
}

export interface CopilotSettingsProps {
  bookId: number
}

export interface CopilotHeaderProps extends HeaderProps {
  bookId: number
}
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiChatService, ChatMessage, type ChatSession } from '@/services/aiChatService';
import { Supplier, Store } from '@/types';
import { 
  Bot, 
  Send, 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2,
  User,
  Loader2
} from 'lucide-react';

interface AIChatbotProps {
  supplier?: Supplier | null;
  stores?: Store[];
  isAlternative?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  // New prop for dynamic height/width (optional, but good for demonstrating dynamism)
  className?: string; 
}

const AIChatbot: React.FC<AIChatbotProps> = ({
  supplier,
  stores = [],
  isAlternative = false,
  isOpen,
  onToggle,
  className // Destructure the new className prop
}) => {
  const storeProblems = stores.flatMap(store => {
    if (store.problems && store.problems.products) {
      return store.problems.products.map(problem => ({
        storeId: store.id,
        storeName: store.name,
        ...problem
      }));
    }
    return [];
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to format messages with ** for bold text
  const formatMessage = (content: string): JSX.Element[] => {
    return content.split('**').map((part, index) => (
      index % 2 === 1 ? <b key={index}>{part}</b> : <span key={index}>{part}</span>
    ));
  };

  const renderProblems = () => {
    return storeProblems.map(problem => (
      <div key={problem.storeId + problem.category} className="mb-4">
        <h3 className="font-bold">{problem.storeName} - {problem.category}</h3>
        <p>{problem.description}</p>
        <p>Status: {problem.status}</p>
      </div>
    ));
  };

  useEffect(() => {
    if (isOpen && !sessionId && (supplier || (stores && stores.length > 0))) {
      initializeChat();
    }
  }, [isOpen, supplier?.id, stores]);

  // Update context when supplier or store changes
  useEffect(() => {
    if (sessionId && isOpen && (supplier || (stores && stores.length > 0))) {
      updateChatContext();
    }
  }, [supplier?.id, stores, isAlternative, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    if (!supplier && (!stores || stores.length === 0)) return;

    try {
      const contextSupplier = supplier || {
        id: 'store-context',
        name: stores[0]?.name || 'Store',
        category: 'General' as any,
        coordinates: stores[0]?.coordinates || [0, 0],
        riskScore: stores[0]?.riskScore || 0,
        riskBreakdown: {
          financial: 0,
          quality: 0,
          delivery: 0,
          compliance: 0,
          sustainability: 0,
          customerFeedback: 0
        },
        products: [],
        deliveryRadius: 0,
        monthlyVolume: 0,
        contractValue: 0,
        certifications: [],
        lastAudit: '',
        performanceTrend: 'stable' as any,
        contact: { name: '', email: '', phone: '' },
        address: '',
        establishedYear: 0,
        employeeCount: 0
      };
      
      const newSessionId = await aiChatService.initializeSession(
        contextSupplier.id,
        contextSupplier,
        stores,
        isAlternative,
        stores[0]?.id // Use the selected store ID or the first store
      );
      setSessionId(newSessionId);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: supplier 
          ? `Hello! I'm your AI assistant for ${supplier.name}. I can help you analyze ${isAlternative ? 'this alternative supplier\'s benefits and implementation strategy' : 'supplier performance and potential issues'}. What would you like to know?`
          : `Hello! I'm your AI assistant for ${stores[0]?.name || 'this store'}. I can help you analyze store operations, supplier performance, and current issues. What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const scrollToBottom = () :void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateChatContext = async () => {
    if (!sessionId || (!supplier && (!stores || stores.length === 0))) return;

    try {
      const contextSupplier = supplier || {
        id: 'store-context',
        name: stores[0]?.name || 'Store',
        category: 'General' as any,
        coordinates: stores[0]?.coordinates || [0, 0],
        riskScore: stores[0]?.riskScore || 0,
        riskBreakdown: {
          financial: 0,
          quality: 0,
          delivery: 0,
          compliance: 0,
          sustainability: 0,
          customerFeedback: 0
        },
        products: [],
        deliveryRadius: 0,
        monthlyVolume: 0,
        contractValue: 0,
        certifications: [],
        lastAudit: '',
        performanceTrend: 'stable' as any,
        contact: { name: '', email: '', phone: '' },
        address: '',
        establishedYear: 0,
        employeeCount: 0
      };

      const success = await aiChatService.updateSessionContext(sessionId, contextSupplier, stores, isAlternative, stores[0]?.id);
      if (success) {
        setMessages([...aiChatService.getSession(sessionId)?.messages || []]);
      }
    } catch (error) {
      console.error('Failed to update chat context:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage(sessionId, userMessage);
      const session = aiChatService.getSession(sessionId);
      if (session) {
        setMessages([...session.messages]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getQuickQuestions = () => {
    if (!supplier && stores && stores.length > 0) {
      // Store context questions
      return [
        'What is the name of the store?',
        'List of suppliers for this store',
        'What are the current store issues?',
        'How can we improve store performance?'
      ];
    } else if (isAlternative) {
      // Alternative supplier questions
      return [
        'What are the key benefits of this supplier?',
        'How does this compare to current suppliers?',
        'What are the implementation costs?',
        'What risks should we consider?'
      ];
    } else {
      // Current supplier questions
      const hasIssues = supplier?.issues && supplier.issues.length > 0;
      const baseQuestions = [
        'What is the name of this supplier?',
        'What are the main performance issues?',
        'How can we reduce supply chain risks?',
        'What cost optimization opportunities exist?'
      ];
      
      if (hasIssues) {
        return [
          ...baseQuestions,
          'What are the current supplier issues?',
          'How can we resolve these problems?',
          'What\'s the impact on store operations?'
        ];
      }
      
      return baseQuestions;
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  if (!isOpen || (!supplier && (!stores || stores.length === 0))) {
    return null;
  }

  return (
    // Removed fixed height and added 'flex flex-col' to allow children to grow
    // Added 'h-full' and 'w-full' to ensure it takes the size of its parent
    <Card className={`flex flex-col w-full h-full bg-white shadow-lg border transition-all duration-300 ${className}`}>
      <CardHeader className="p-4 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
              <p className="text-xs opacity-90">{supplier?.name || (stores && stores.length > 0 ? stores[0].name : 'No context selected')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        // Changed fixed height to 'flex-1' to take remaining vertical space
        // Added 'overflow-hidden' to prevent content from spilling out if it exceeds available space
        <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <div className="text-sm">{formatMessage(message.content)}</div>
                    </div>
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {messages.length === 1 && (
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
              <div className="grid grid-cols-1 gap-1">
                {getQuickQuestions().map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs justify-start h-8 text-left"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about supplier performance, risks, or opportunities..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AIChatbot;

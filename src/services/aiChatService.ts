import { Supplier, Store } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  supplierId: string;
  messages: ChatMessage[];
  context: {
    supplier: Supplier;
    stores?: Store[];
    isAlternative: boolean;
    selectedStoreId?: string;
  };
}

interface SupplierDataFromJSON {
  id: string;
  name: string;
  supplies: string[];
  parameters: {
    sustainabilityScore: number;
    riskScore: number;
    productQuality: number;
    profitMargin: number;
    localRelevance: number;
    brandRecognition: number;
    availability: number;
    carbonFootprint: number;
    packagingQuality: number;
  };
  performanceScore: number;
  clusterId?: string;
}

class AIChatService {
  private apiKey: string;
  private modelId: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private sessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.modelId = import.meta.env.VITE_GEMINI_MODEL_ID || 'gemini-1.5-flash';
    
    if (!this.apiKey) {
      console.warn('Gemini API key not found. AI chat functionality will use mock responses.');
    }
  }

  async initializeSession(
    supplierId: string, 
    supplier: Supplier, 
    stores: Store[] = [], 
    isAlternative: boolean = false,
    selectedStoreId?: string
  ): Promise<string> {
    const sessionId = `${supplierId}-${Date.now()}`;
    
    // Fetch fresh data from JSON
    const freshSupplierData = await this.fetchSupplierData(supplierId, isAlternative);
    const enrichedSupplier = this.enrichSupplierData(supplier, freshSupplierData);
    
    const session: ChatSession = {
      id: sessionId,
      supplierId,
      messages: [],
      context: {
        supplier: enrichedSupplier,
        stores,
        isAlternative,
        selectedStoreId
      }
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    const userMessageObj: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    session.messages.push(userMessageObj);

    try {
      const aiResponse = await this.getAIResponse(session, userMessage);
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      session.messages.push(assistantMessage);
      return assistantMessage;
    } catch (error) {
      console.error('AI API Error:', error);
      // Fallback to mock response
      return this.generateMockResponse(session, userMessage);
    }
  }

  // Fetch supplier data from JSON files
  private async fetchSupplierData(supplierId: string, isAlternative: boolean): Promise<SupplierDataFromJSON | null> {
    try {
      const response = await fetch(isAlternative ? '/walmart_us_alternate_suppliers.json' : '/walmart_us_stores_with_suppliers.json');
      const data = await response.json();
      
      if (isAlternative) {
        return data.alternateSuppliers.find((s: SupplierDataFromJSON) => s.id === supplierId) || null;
      } else {
        // Search through all stores for the supplier
        for (const store of data.stores) {
          const supplier = store.suppliers.find((s: SupplierDataFromJSON) => s.id === supplierId);
          if (supplier) return supplier;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching supplier data:', error);
      return null;
    }
  }

  // Enrich supplier data with fresh JSON data
  private enrichSupplierData(supplier: Supplier, freshData: SupplierDataFromJSON | null): Supplier {
    if (!freshData) return supplier;
    
    return {
      ...supplier,
      sustainabilityScore: freshData.parameters.sustainabilityScore,
      riskScore: freshData.parameters.riskScore,
      productQuality: freshData.parameters.productQuality,
      profitMargin: freshData.parameters.profitMargin,
      localRelevance: freshData.parameters.localRelevance,
      brandRecognition: freshData.parameters.brandRecognition,
      availability: freshData.parameters.availability,
      carbonFootprint: freshData.parameters.carbonFootprint,
      packagingQuality: freshData.parameters.packagingQuality,
      products: freshData.supplies
    };
  }

  private async getAIResponse(session: ChatSession, userMessage: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not available');
    }

    const context = this.buildEnhancedPrompt(session);
    const prompt = `${context}\n\nUser Question: ${userMessage}\n\nProvide a **short**, **data-driven** response (max 150 words). Use **bold** formatting for key metrics and important points. Be concise and actionable.`;

    const response = await fetch(`${this.baseUrl}/${this.modelId}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Unable to generate response.';
  }

  private buildEnhancedPrompt(session: ChatSession): string {
    const { supplier, stores, isAlternative, selectedStoreId } = session.context;
    
    const bold = (text: string) => `**${text}**`;
    
    let context = `You are an expert AI for Walmart Supply Chain Analysis. Respond with ${bold('short')}, ${bold('actionable')} insights using ${bold('**bold**')} for key data points.\n\n`;
    
    context += `${bold('Supplier')}: ${supplier.name} (${supplier.category})\n`;
    context += `${bold('Type')}: ${isAlternative ? 'Alternative Supplier' : 'Current Supplier'}\n`;
    context += `${bold('Risk Score')}: ${supplier.riskScore}/100\n`;
    context += `${bold('Sustainability')}: ${supplier.sustainabilityScore || 'N/A'}/100\n`;
    context += `${bold('Product Quality')}: ${supplier.productQuality || 'N/A'}/100\n`;
    context += `${bold('Profit Margin')}: ${supplier.profitMargin || 'N/A'}%\n`;
    context += `${bold('Local Relevance')}: ${supplier.localRelevance || 'N/A'}\n`;
    context += `${bold('Products')}: ${supplier.products.slice(0, 3).join(', ')}\n`;
    
    if (stores && stores.length > 0) {
      const targetStore = selectedStoreId ? stores.find(s => s.id === selectedStoreId) : stores[0];
      if (targetStore) {
        context += `${bold('Target Store')}: ${targetStore.name} (Revenue: ₹${targetStore.monthlyRevenue.toLocaleString()}/mo)\n`;
      }
    }
    
    if (isAlternative) {
      context += `\n${bold('FOCUS')}: Highlight competitive advantages, cost savings, and implementation strategy.`;
    } else {
      context += `\n${bold('FOCUS')}: Identify performance issues, risk mitigation, and optimization opportunities.`;
    }
    
    return context;
  }

  private generateMockResponse(session: ChatSession, userMessage: string): ChatMessage {
    const { supplier, isAlternative } = session.context;
    const lowerMessage = userMessage.toLowerCase();
    
    let mockResponse = '';

    if (lowerMessage.includes('risk') || lowerMessage.includes('issue')) {
      if (isAlternative) {
        mockResponse = `This alternative supplier shows a ${supplier.riskScore}/100 risk score, which ${supplier.riskScore > 70 ? 'indicates lower risk' : 'requires attention'}. Key advantages include ${supplier.sustainabilityScore && supplier.sustainabilityScore > 70 ? 'strong sustainability practices' : 'competitive pricing'}. I recommend evaluating their ${supplier.performanceTrend === 'improving' ? 'improving performance trend' : 'current capabilities'} for potential integration.`;
      } else {
        mockResponse = `Current risk analysis shows ${supplier.riskScore}/100 score. Main concerns: ${supplier.riskBreakdown.financial > 5 ? 'financial stability, ' : ''}${supplier.riskBreakdown.quality > 5 ? 'quality control, ' : ''}${supplier.riskBreakdown.delivery > 5 ? 'delivery reliability' : ''}. Recommend implementing risk mitigation strategies and performance monitoring.`;
      }
    } else if (lowerMessage.includes('cost') || lowerMessage.includes('profit')) {
      mockResponse = `Cost analysis: Contract value ₹${supplier.contractValue.toLocaleString()}, ${supplier.profitMargin ? `profit margin ${supplier.profitMargin}%` : 'competitive pricing structure'}. ${isAlternative ? 'Potential savings through optimized logistics and improved efficiency ratios.' : 'Consider renegotiating terms based on performance metrics.'}`;
    } else if (lowerMessage.includes('quality')) {
      mockResponse = `Quality metrics: ${supplier.productQuality || 75}/100 score. Certifications: ${supplier.certifications.join(', ')}. ${isAlternative ? 'Offers enhanced quality standards with proven track record.' : 'Recommend quality improvement initiatives and regular audits.'}`;
    } else {
      mockResponse = `${supplier.name} overview: ${isAlternative ? 'Alternative supplier' : 'Current supplier'} with ${supplier.riskScore}/100 risk score, ${supplier.performanceTrend} performance trend. Established ${supplier.establishedYear}, serving ${supplier.products.length} product categories. Contact me for specific areas of analysis.`;
    }

    return {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: mockResponse,
      timestamp: new Date()
    };
  }

  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }
}

export const aiChatService = new AIChatService();
export type { ChatMessage, ChatSession };

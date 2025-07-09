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
    storeProblems?: any[];
    contextType: 'supplier' | 'store' | 'alternative';
    currentSelection?: {
      type: 'supplier' | 'store';
      id: string;
      name: string;
    };
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
    
    // Determine context type
    let contextType: 'supplier' | 'store' | 'alternative';
    let currentSelection: { type: 'supplier' | 'store'; id: string; name: string } | undefined;
    
    if (supplier.id === 'store-context') {
      contextType = 'store';
      const targetStore = stores.find(s => s.id === selectedStoreId) || stores[0];
      if (targetStore) {
        currentSelection = { type: 'store', id: targetStore.id, name: targetStore.name };
      }
    } else if (isAlternative) {
      contextType = 'alternative';
      currentSelection = { type: 'supplier', id: supplier.id, name: supplier.name };
    } else {
      contextType = 'supplier';
      currentSelection = { type: 'supplier', id: supplier.id, name: supplier.name };
    }
    
    // Fetch fresh data from JSON
    const freshSupplierData = await this.fetchSupplierData(supplierId, isAlternative);
    const enrichedSupplier = this.enrichSupplierData(supplier, freshSupplierData);
    
    // Collect store problems related to this supplier
    const storeProblems = stores.flatMap(store => {
      if (store.problems) {
        return [
          ...store.problems.products.filter(p => p.affectedSuppliers.includes(supplierId)),
          ...store.problems.services.map(s => ({ ...s, type: 'service', storeId: store.id, storeName: store.name })),
          ...store.problems.operational.map(o => ({ ...o, type: 'operational', storeId: store.id, storeName: store.name }))
        ];
      }
      return [];
    });
    
    const session: ChatSession = {
      id: sessionId,
      supplierId,
      messages: [],
      context: {
        supplier: enrichedSupplier,
        stores,
        isAlternative,
        selectedStoreId,
        storeProblems,
        contextType,
        currentSelection
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
    const { supplier, stores, isAlternative, selectedStoreId, storeProblems, contextType, currentSelection } = session.context;
    
    const bold = (text: string) => `**${text}**`;
    
    let context = `You are an expert AI for Walmart Supply Chain Analysis. You must respond with accurate, current data based on the EXACT context provided. Use ${bold('**bold**')} for key metrics and be concise.\n\n`;
    
    // Add current selection context
    if (currentSelection) {
      context += `${bold('CURRENT SELECTION')}: ${currentSelection.name} (${currentSelection.type.toUpperCase()})\n`;
      context += `${bold('SELECTION ID')}: ${currentSelection.id}\n`;
    }
    
    // Handle different context types
    switch (contextType) {
      case 'store':
        const targetStore = stores?.find(s => s.id === selectedStoreId) || stores?.[0];
        if (targetStore) {
          context += `${bold('STORE CONTEXT')}:\n`;
          context += `${bold('Store Name')}: ${targetStore.name}\n`;
          context += `${bold('Store Type')}: ${targetStore.type}\n`;
          context += `${bold('Location')}: ${targetStore.address}\n`;
          context += `${bold('Risk Score')}: ${targetStore.riskScore}/100\n`;
          context += `${bold('Monthly Revenue')}: ₹${targetStore.monthlyRevenue?.toLocaleString()}\n`;
          context += `${bold('Customer Count')}: ${targetStore.customerCount?.toLocaleString()}\n`;
          context += `${bold('Connected Suppliers')}: ${targetStore.suppliers?.length || 0}\n`;
          
          // Add store issues if available
          if (targetStore.issues && targetStore.issues.length > 0) {
            context += `${bold('Store Issues')}: ${targetStore.issues.join(', ')}\n`;
          }
        }
        break;
        
      case 'alternative':
        context += `${bold('ALTERNATIVE SUPPLIER CONTEXT')}:\n`;
        context += `${bold('Supplier Name')}: ${supplier.name}\n`;
        context += `${bold('Category')}: ${supplier.category}\n`;
        context += `${bold('Risk Score')}: ${supplier.riskScore}/100\n`;
        context += `${bold('Sustainability Score')}: ${supplier.sustainabilityScore || 'N/A'}/100\n`;
        context += `${bold('Product Quality')}: ${supplier.productQuality || 'N/A'}/100\n`;
        context += `${bold('Profit Margin')}: ${supplier.profitMargin || 'N/A'}%\n`;
        context += `${bold('Local Relevance')}: ${supplier.localRelevance || 'N/A'}\n`;
        context += `${bold('Products/Services')}: ${supplier.products.slice(0, 3).join(', ')}\n`;
        context += `${bold('Contract Value')}: ₹${supplier.contractValue?.toLocaleString()}\n`;
        break;
        
      default: // current supplier
        context += `${bold('CURRENT SUPPLIER CONTEXT')}:\n`;
        context += `${bold('Supplier Name')}: ${supplier.name}\n`;
        context += `${bold('Category')}: ${supplier.category}\n`;
        context += `${bold('Risk Score')}: ${supplier.riskScore}/100\n`;
        context += `${bold('Sustainability Score')}: ${supplier.sustainabilityScore || 'N/A'}/100\n`;
        context += `${bold('Product Quality')}: ${supplier.productQuality || 'N/A'}/100\n`;
        context += `${bold('Profit Margin')}: ${supplier.profitMargin || 'N/A'}%\n`;
        context += `${bold('Local Relevance')}: ${supplier.localRelevance || 'N/A'}\n`;
        context += `${bold('Products/Services')}: ${supplier.products.slice(0, 3).join(', ')}\n`;
        context += `${bold('Contract Value')}: ₹${supplier.contractValue?.toLocaleString()}\n`;
        context += `${bold('Performance Trend')}: ${supplier.performanceTrend}\n`;
        
        // Add supplier issues if available
        if (supplier.issues && supplier.issues.length > 0) {
          context += `${bold('Current Issues')}:\n`;
          supplier.issues.forEach(issue => {
            context += `- ${issue.type}: ${issue.description} (${issue.severity} severity, ${issue.status})\n`;
          });
        }
        break;
    }
    
    // Add related store context if available
    if (stores && stores.length > 0 && contextType !== 'store') {
      const relatedStore = selectedStoreId ? stores.find(s => s.id === selectedStoreId) : stores[0];
      if (relatedStore) {
        context += `${bold('Related Store')}: ${relatedStore.name}\n`;
      }
    }
    
    // Add store problems context
    if (storeProblems && storeProblems.length > 0) {
      context += `\n${bold('Related Store Problems')}:\n`;
      storeProblems.slice(0, 3).forEach(problem => {
        context += `- ${problem.storeName}: ${problem.description} (${problem.severity} severity, ${problem.status})\n`;
      });
    }
    
    // Add focus instructions based on context
    switch (contextType) {
      case 'store':
        context += `\n${bold('FOCUS')}: Analyze store operations, supplier management, and provide actionable recommendations for store optimization. Answer questions about store performance, issues, and supplier relationships.`;
        break;
      case 'alternative':
        context += `\n${bold('FOCUS')}: Highlight competitive advantages, benefits, cost savings, and implementation strategy for this alternative supplier. Compare with current suppliers when relevant.`;
        break;
      default:
        context += `\n${bold('FOCUS')}: Analyze current supplier performance, identify issues, risk mitigation strategies, and optimization opportunities. Address problems and provide improvement recommendations.`;
    }
    
    context += `\n\n${bold('IMPORTANT')}: Use ONLY the data provided above. Do not reference outdated information like 'Rocky Mountain Fresh' or 'Denver, CO' unless they are specifically mentioned in the current context.`;
    
    return context;
  }

  private generateMockResponse(session: ChatSession, userMessage: string): ChatMessage {
    const { supplier, isAlternative, stores, storeProblems, contextType, currentSelection } = session.context;
    const lowerMessage = userMessage.toLowerCase();
    
    let mockResponse = '';
    
    // Handle different context types
    if (contextType === 'store' && stores && stores.length > 0) {
      const store = stores[0];
      if (lowerMessage.includes('name') || lowerMessage.includes('what is')) {
        mockResponse = `**Current Selection**: ${store.name} (${store.type})\n**Location**: ${store.address}\n**Store ID**: ${store.id}\n**Risk Score**: ${store.riskScore}/100\n**Monthly Revenue**: ₹${store.monthlyRevenue?.toLocaleString()}\n**Customer Count**: ${store.customerCount?.toLocaleString()}\n**Connected Suppliers**: ${store.suppliers?.length || 0}`;
      } else if (lowerMessage.includes('supplier') || lowerMessage.includes('list')) {
        const supplierCount = store.suppliers?.length || 0;
        mockResponse = `**${store.name} Suppliers**: This store works with **${supplierCount} suppliers**. ${supplierCount > 0 ? 'Click on individual suppliers on the map or supplier list to get detailed analysis for each one.' : 'No suppliers currently connected to this store.'}`;
      } else if (lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
        const problemCount = storeProblems?.length || 0;
        const storeIssues = store.issues || [];
        mockResponse = `**Store Issues Analysis**: ${store.name} has **${storeIssues.length} store-level issues** and **${problemCount} supplier-related problems**. ${storeIssues.length > 0 ? `Store issues: ${storeIssues.join(', ')}. ` : ''}${problemCount > 0 ? 'Supplier problems include inventory management, quality control, and delivery coordination.' : 'No major supplier problems reported.'}`;
      } else {
        mockResponse = `**Store Analysis**: ${store.name} performance indicators show revenue of **₹${store.monthlyRevenue?.toLocaleString()}/month** with **${store.customerCount?.toLocaleString()} customers**. Risk score: **${store.riskScore}/100**. How can I help you optimize store operations?`;
      }
    } else if (contextType === 'alternative') {
      if (lowerMessage.includes('name') || lowerMessage.includes('what is')) {
        mockResponse = `**Alternative Supplier**: ${supplier.name}\n**Category**: ${supplier.category}\n**Risk Score**: ${supplier.riskScore}/100\n**Sustainability**: ${supplier.sustainabilityScore || 'N/A'}/100\n**Product Quality**: ${supplier.productQuality || 'N/A'}/100\n**Profit Margin**: ${supplier.profitMargin || 'N/A'}%\n**Contract Value**: ₹${supplier.contractValue?.toLocaleString()}`;
      } else if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage')) {
        mockResponse = `**Key Benefits of ${supplier.name}**: ${supplier.riskScore > 70 ? 'Lower risk profile, ' : ''}${supplier.sustainabilityScore && supplier.sustainabilityScore > 70 ? 'Strong sustainability practices, ' : ''}${supplier.productQuality && supplier.productQuality > 80 ? 'High product quality, ' : ''}${supplier.profitMargin && supplier.profitMargin > 15 ? 'Good profit margins' : 'Competitive pricing'}. Consider for integration based on current needs.`;
      } else if (lowerMessage.includes('risk') || lowerMessage.includes('issue')) {
        mockResponse = `**Risk Assessment**: ${supplier.name} shows a **${supplier.riskScore}/100** risk score. ${supplier.riskScore > 70 ? 'This indicates lower risk and good reliability.' : 'Monitor this supplier closely and consider risk mitigation strategies.'} Key advantages include ${supplier.sustainabilityScore && supplier.sustainabilityScore > 70 ? 'strong sustainability practices' : 'competitive positioning'}.`;
      } else {
        mockResponse = `**${supplier.name} Overview**: Alternative supplier in **${supplier.category}** category with **${supplier.riskScore}/100** risk score. Products: ${supplier.products.slice(0, 3).join(', ')}. Contract value: **₹${supplier.contractValue?.toLocaleString()}**. What specific aspect would you like to analyze?`;
      }
    } else {
      // Current supplier context
      if (lowerMessage.includes('name') || lowerMessage.includes('what is')) {
        mockResponse = `**Current Supplier**: ${supplier.name}\n**Category**: ${supplier.category}\n**Risk Score**: ${supplier.riskScore}/100\n**Performance Trend**: ${supplier.performanceTrend}\n**Contract Value**: ₹${supplier.contractValue?.toLocaleString()}\n**Products**: ${supplier.products.slice(0, 3).join(', ')}`;
      } else if (lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
        const issues = supplier.issues || [];
        if (issues.length > 0) {
          mockResponse = `**Current Issues with ${supplier.name}**: ${issues.length} active issues:\n${issues.map(issue => `• **${issue.type}**: ${issue.description} (${issue.severity} severity, ${issue.status})`).join('\n')}\n\nRecommend addressing these issues through supplier performance meetings and corrective action plans.`;
        } else {
          mockResponse = `**${supplier.name} Status**: No major issues currently reported. Risk score: **${supplier.riskScore}/100**. Performance trend: **${supplier.performanceTrend}**. Continue monitoring for optimal performance.`;
        }
      } else if (lowerMessage.includes('risk')) {
        mockResponse = `**Risk Analysis**: ${supplier.name} shows **${supplier.riskScore}/100** risk score. ${supplier.riskScore > 70 ? 'This indicates good performance with low risk.' : 'Monitor this supplier closely for potential issues.'} Performance trend: **${supplier.performanceTrend}**. ${supplier.issues && supplier.issues.length > 0 ? `Current issues: ${supplier.issues.length} active problems requiring attention.` : 'No major issues reported.'}`;
      } else {
        mockResponse = `**${supplier.name} Overview**: Current supplier in **${supplier.category}** category with **${supplier.riskScore}/100** risk score and **${supplier.performanceTrend}** performance trend. Contract value: **₹${supplier.contractValue?.toLocaleString()}**. What would you like to analyze?`;
      }
    }

    return {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: mockResponse,
      timestamp: new Date()
    };
  }

  // Update session context when user changes selection
  async updateSessionContext(
    sessionId: string,
    supplier: Supplier,
    stores: Store[] = [],
    isAlternative: boolean = false,
    selectedStoreId?: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Determine new context type
    let contextType: 'supplier' | 'store' | 'alternative';
    let currentSelection: { type: 'supplier' | 'store'; id: string; name: string } | undefined;
    
    if (supplier.id === 'store-context') {
      contextType = 'store';
      const targetStore = stores.find(s => s.id === selectedStoreId) || stores[0];
      if (targetStore) {
        currentSelection = { type: 'store', id: targetStore.id, name: targetStore.name };
      }
    } else if (isAlternative) {
      contextType = 'alternative';
      currentSelection = { type: 'supplier', id: supplier.id, name: supplier.name };
    } else {
      contextType = 'supplier';
      currentSelection = { type: 'supplier', id: supplier.id, name: supplier.name };
    }

    // Fetch fresh supplier data
    const freshSupplierData = await this.fetchSupplierData(supplier.id, isAlternative);
    const enrichedSupplier = this.enrichSupplierData(supplier, freshSupplierData);

    // Update context
    session.context = {
      ...session.context,
      supplier: enrichedSupplier,
      stores,
      isAlternative,
      selectedStoreId,
      contextType,
      currentSelection
    };

    // Add context change message
    const contextChangeMessage: ChatMessage = {
      id: `context-change-${Date.now()}`,
      role: 'assistant',
      content: `Context updated to ${currentSelection?.name || 'unknown'}. I'm now ready to help you analyze ${contextType === 'store' ? 'store operations and supplier management' : contextType === 'alternative' ? 'this alternative supplier' : 'this current supplier'}. What would you like to know?`,
      timestamp: new Date()
    };

    session.messages.push(contextChangeMessage);
    return true;
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

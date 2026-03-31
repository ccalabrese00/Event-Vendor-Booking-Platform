import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from './logger';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIChatbotService {
  // Main chat method
  static async chat(userId: string, message: string, context?: any) {
    try {
      // Get user's conversation history
      const history = await this.getConversationHistory(userId, 10);
      
      // Get relevant context (vendors, bookings, etc.)
      const userContext = await this.getUserContext(userId);
      
      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(userContext);
      
      // Prepare messages for OpenAI
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role as any, content: h.content })),
        { role: 'user', content: message },
      ];

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, I could not process your request.';

      // Save conversation
      await this.saveMessage(userId, 'user', message);
      await this.saveMessage(userId, 'assistant', response);

      // Check if action needed (booking, search, etc.)
      const action = this.detectAction(message, response);

      return {
        response,
        action,
        suggestions: this.generateSuggestions(userContext, message),
      };
    } catch (error) {
      logger.error('AI chat failed', { error, userId, message });
      return {
        response: 'I apologize, I am having trouble right now. Please try again later.',
        action: null,
        suggestions: [],
      };
    }
  }

  // Booking assistant - specialized for booking flow
  static async bookingAssistant(userId: string, step: string, data?: any) {
    const prompts: Record<string, string> = {
      start: 'Hello! I can help you book the perfect vendor for your event. What type of event are you planning?',
      category: `Great! For ${data?.eventType}, I recommend looking for ${this.getRecommendedCategories(data?.eventType)}. Would you like me to suggest some top-rated vendors?`,
      vendor_selected: `${data?.vendorName} is an excellent choice! Their rating is ${data?.rating}/5. What date are you considering?`,
      date_selected: `${data?.date} works! Should I check if ${data?.vendorName} is available on that date?`,
      availability_confirmed: 'Perfect! The vendor is available. Would you like me to help you complete the booking request?',
      pricing: `Based on the event details, the estimated price range would be ${data?.priceRange}. Does this fit your budget?`,
      complete: 'Excellent! I have prepared your booking request. You can review and submit it on the booking page.',
    };

    return {
      message: prompts[step] || 'How can I assist you with your booking?',
      nextSteps: this.getNextSteps(step),
    };
  }

  // Vendor assistant - specialized for vendor questions
  static async vendorAssistant(vendorId: string, question: string) {
    try {
      // Get vendor data
      const vendor = await prisma.user.findUnique({
        where: { id: vendorId },
        include: {
          bookings: {
            where: {
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
          reviews: true,
        },
      });

      if (!vendor) throw new Error('Vendor not found');

      const prompt = `
        You are an AI assistant for ${vendor.businessName}, a ${vendor.category} vendor.
        
        Vendor Stats:
        - Total Bookings (last 30 days): ${vendor.bookings.length}
        - Average Rating: ${vendor.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / (vendor.reviews.length || 1)}/5
        - Response Time: Usually within 2 hours
        
        Customer Question: ${question}
        
        Provide a helpful, professional response. If it's a booking inquiry, suggest checking availability.
      `;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful vendor assistant.' },
          { role: 'user', content: prompt },
        ],
      });

      return completion.choices[0]?.message?.content || 'I apologize, I could not process your question.';
    } catch (error) {
      logger.error('Vendor assistant failed', { error, vendorId });
      return 'I apologize, I am unable to answer your question right now.';
    }
  }

  // FAQ bot - answers common questions
  static async faqBot(question: string) {
    const faqData = [
      {
        keywords: ['cost', 'price', 'pricing', 'fee', 'commission'],
        answer: 'Our platform is free for customers to browse and book. Vendors pay a small 5% commission only on completed bookings.',
      },
      {
        keywords: ['cancel', 'refund', 'cancellation'],
        answer: 'Cancellation policies vary by vendor. Most vendors allow free cancellation up to 48 hours before the event. Check the specific vendor\'s cancellation policy on their profile.',
      },
      {
        keywords: ['payment', 'pay', 'deposit'],
        answer: 'We accept all major credit cards and bank transfers. You can pay a deposit to secure your booking (typically 25-50%) and the remainder closer to the event date.',
      },
      {
        keywords: ['insurance', 'protection', 'guarantee'],
        answer: 'Yes! All bookings include our Satisfaction Guarantee. If a vendor cancels, we help you find a replacement at no extra cost.',
      },
      {
        keywords: ['contact', 'message', 'chat'],
        answer: 'You can message vendors directly through our platform once you\'ve sent a booking request. All communication is secure and monitored for quality.',
      },
    ];

    // Find matching FAQ
    const match = faqData.find(faq => 
      faq.keywords.some(keyword => question.toLowerCase().includes(keyword))
    );

    if (match) {
      return match.answer;
    }

    // If no match, use AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful FAQ assistant for an event vendor booking platform. Answer concisely and helpfully.',
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nIf you don't know the answer, suggest contacting support@eventvendor.com`,
        },
      ],
    });

    return completion.choices[0]?.message?.content || 'Please contact support@eventvendor.com for assistance.';
  }

  // Smart suggestions based on context
  private static generateSuggestions(context: any, message: string): string[] {
    const suggestions: string[] = [];

    if (!context.hasActiveBooking) {
      suggestions.push('🔍 Search for vendors');
    }

    if (context.recentSearches?.length > 0) {
      suggestions.push(`📅 Check ${context.recentSearches[0]} availability`);
    }

    if (context.hasPendingBookings) {
      suggestions.push('📋 View my pending bookings');
    }

    suggestions.push('❓ Ask a question');
    suggestions.push('💬 Contact support');

    return suggestions.slice(0, 3);
  }

  // Get conversation history
  private static async getConversationHistory(userId: string, limit: number) {
    return await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Save message
  private static async saveMessage(userId: string, role: string, content: string) {
    await prisma.chatMessage.create({
      data: {
        senderId: role === 'user' ? userId : 'ai-assistant',
        receiverId: role === 'assistant' ? userId : 'ai-assistant',
        message: content,
      },
    });
  }

  // Get user context
  private static async getUserContext(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          include: { vendor: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        aiRecommendations: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    return {
      name: user?.name,
      role: user?.role,
      hasActiveBooking: user?.bookings.some(b => ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(b.status)),
      hasPendingBookings: user?.bookings.some(b => b.status === 'PENDING'),
      recentSearches: user?.aiRecommendations.map(r => r.type),
      preferredCategories: user?.bookings.map(b => b.vendor.category).filter(Boolean),
    };
  }

  // Build system prompt
  private static buildSystemPrompt(context: any) {
    return `
      You are an AI assistant for Event Vendor Booking Platform.
      
      User Context:
      - Name: ${context.name}
      - Role: ${context.role}
      - Has Active Booking: ${context.hasActiveBooking}
      - Preferred Categories: ${context.preferredCategories?.join(', ') || 'None yet'}
      
      Your role:
      1. Help customers find and book vendors
      2. Answer questions about the platform
      3. Assist vendors with their dashboard
      4. Provide recommendations based on preferences
      
      Be friendly, professional, and helpful. If you don't know something, suggest contacting support.
    `;
  }

  // Detect if user message implies an action
  private static detectAction(message: string, response: string): any {
    const actions = [
      {
        type: 'SEARCH_VENDORS',
        keywords: ['find', 'search', 'looking for', 'need a'],
      },
      {
        type: 'VIEW_BOOKING',
        keywords: ['my booking', 'view booking', 'check booking'],
      },
      {
        type: 'SEND_MESSAGE',
        keywords: ['contact', 'message', 'reach out'],
      },
      {
        type: 'GET_PRICING',
        keywords: ['price', 'cost', 'how much', 'quote'],
      },
    ];

    const lowerMessage = message.toLowerCase();
    const detected = actions.find(action =>
      action.keywords.some(keyword => lowerMessage.includes(keyword))
    );

    return detected || null;
  }

  // Get recommended categories based on event type
  private static getRecommendedCategories(eventType: string): string {
    const categoryMap: Record<string, string> = {
      wedding: 'photographers, caterers, florists, DJs',
      corporate: 'caterers, AV equipment, event planners',
      birthday: 'entertainers, caterers, decorators',
      conference: 'AV equipment, caterers, venues',
      party: 'DJs, bartenders, caterers',
    };

    return categoryMap[eventType?.toLowerCase()] || 'various vendors';
  }

  // Get next steps in booking flow
  private static getNextSteps(currentStep: string): string[] {
    const flow: Record<string, string[]> = {
      start: ['Select event type', 'Browse categories'],
      category: ['View vendor profiles', 'Read reviews'],
      vendor_selected: ['Check availability', 'View pricing'],
      date_selected: ['Confirm availability', 'Select alternate dates'],
      availability_confirmed: ['Complete booking', 'Ask questions'],
      pricing: ['Proceed with booking', 'Negotiate price'],
      complete: ['Submit request', 'Save for later'],
    };

    return flow[currentStep] || ['Explore vendors'];
  }
}

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { EmailService } from './email';
import { logger } from './logger';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AIRecommendationService {
  // Get personalized vendor recommendations for a customer
  static async getVendorRecommendations(customerId: string, eventType?: string) {
    try {
      // Get customer's booking history and preferences
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
        include: {
          bookings: {
            include: { vendor: true },
          },
        },
      });

      // Get all available vendors
      const vendors = await prisma.user.findMany({
        where: {
          role: 'VENDOR',
          businessName: { not: null },
        },
        include: {
          reviews: true,
        },
      });

      // Use AI to analyze and recommend
      const prompt = this.buildRecommendationPrompt(customer, vendors, eventType);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert event planning AI that matches customers with perfect vendors based on their preferences, history, and event type.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const recommendation = completion.choices[0]?.message?.content;
      
      // Parse and rank vendor recommendations
      const rankedVendors = this.rankVendors(vendors, customer, recommendation);
      
      // Save recommendation to database
      await prisma.aIRecommendation.create({
        data: {
          userId: customerId,
          type: 'VENDOR_MATCH',
          content: recommendation || '',
          metadata: { eventType, vendors: rankedVendors.map(v => v.id) },
        },
      });

      return {
        recommendation,
        vendors: rankedVendors,
      };
    } catch (error) {
      logger.error('AI recommendation failed', { error, customerId });
      // Fallback to simple rating-based recommendations
      return this.getFallbackRecommendations();
    }
  }

  // Smart scheduling recommendations
  static async getSmartScheduling(vendorId: string, preferredDate?: string) {
    try {
      const vendor = await prisma.user.findUnique({
        where: { id: vendorId },
        include: {
          availability: true,
          bookings: {
            where: {
              status: { in: ['ACCEPTED', 'CONFIRMED'] },
            },
          },
        },
      });

      if (!vendor) throw new Error('Vendor not found');

      const prompt = this.buildSchedulingPrompt(vendor, preferredDate);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a scheduling optimization AI that analyzes vendor availability and suggests optimal booking times.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const suggestion = completion.choices[0]?.message?.content;
      
      return {
        suggestion,
        availableSlots: vendor.availability.filter(a => a.isAvailable),
        recommendedDates: this.parseRecommendedDates(suggestion),
      };
    } catch (error) {
      logger.error('Smart scheduling failed', { error, vendorId });
      return null;
    }
  }

  // Dynamic pricing recommendations
  static async getPricingRecommendation(vendorId: string, eventType: string, duration: number) {
    try {
      // Get market data
      const similarVendors = await prisma.user.findMany({
        where: {
          role: 'VENDOR',
          category: eventType,
        },
        include: {
          bookings: true,
        },
      });

      const prompt = this.buildPricingPrompt(similarVendors, eventType, duration);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a pricing strategy AI that recommends competitive pricing based on market analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return {
        recommendation: completion.choices[0]?.message?.content,
        marketRange: this.calculateMarketRange(similarVendors),
      };
    } catch (error) {
      logger.error('Pricing recommendation failed', { error, vendorId });
      return null;
    }
  }

  // Send weekly AI recommendations to customers
  static async sendWeeklyRecommendations() {
    try {
      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        take: 100, // Batch process
      });

      for (const customer of customers) {
        const { recommendation, vendors } = await this.getVendorRecommendations(customer.id);
        
        if (vendors.length > 0) {
          await EmailService.sendAIRecommendation(
            customer.email,
            customer.name,
            recommendation || 'Based on your preferences, here are some great vendor options!',
            vendors.map(v => ({
              name: v.businessName || v.name,
              category: v.category || 'General',
              rating: v.reviews.reduce((acc, r) => acc + r.rating, 0) / (v.reviews.length || 1),
            }))
          );
        }
      }

      logger.info('Weekly AI recommendations sent', { count: customers.length });
    } catch (error) {
      logger.error('Failed to send weekly recommendations', { error });
    }
  }

  // Build recommendation prompt
  private static buildRecommendationPrompt(customer: any, vendors: any[], eventType?: string) {
    return `
      Customer: ${customer.name}
      Event Type: ${eventType || 'Not specified'}
      Past Bookings: ${customer.bookings.length}
      Preferred Categories: ${customer.bookings.map((b: any) => b.vendor.category).join(', ')}

      Available Vendors:
      ${vendors.map(v => `
        - ${v.businessName} (${v.category})
          Rating: ${v.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / (v.reviews.length || 1)}/5
          Location: ${v.location || 'Not specified'}
          Description: ${v.description || 'N/A'}
      `).join('\n')}

      Please analyze and recommend the top 3 most suitable vendors with reasoning.
    `;
  }

  // Build scheduling prompt
  private static buildSchedulingPrompt(vendor: any, preferredDate?: string) {
    return `
      Vendor: ${vendor.businessName}
      Current Bookings: ${vendor.bookings.length}
      Available Dates: ${vendor.availability.filter((a: any) => a.isAvailable).map((a: any) => a.date).join(', ')}
      Customer Preferred Date: ${preferredDate || 'Not specified'}

      Suggest optimal booking dates considering:
      1. Vendor availability
      2. Booking patterns (avoid overbooking)
      3. Seasonal demand
      4. Customer preferences
    `;
  }

  // Build pricing prompt
  private static buildPricingPrompt(vendors: any[], eventType: string, duration: number) {
    return `
      Market Analysis for ${eventType} services (${duration} hours)
      Similar Vendors: ${vendors.length}
      Average Bookings: ${vendors.reduce((acc, v) => acc + v.bookings.length, 0) / vendors.length}

      Recommend competitive pricing strategy.
    `;
  }

  // Rank vendors based on AI recommendation
  private static rankVendors(vendors: any[], customer: any, recommendation?: string | null) {
    // Simple ranking algorithm - can be enhanced with ML
    return vendors
      .map(vendor => ({
        ...vendor,
        score: this.calculateVendorScore(vendor, customer),
      }))
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, 5);
  }

  // Calculate vendor match score
  private static calculateVendorScore(vendor: any, customer: any) {
    let score = 0;
    
    // Rating score (0-50)
    const avgRating = vendor.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / (vendor.reviews.length || 1);
    score += avgRating * 10;
    
    // Review count score (0-20)
    score += Math.min(vendor.reviews.length * 2, 20);
    
    // Category match bonus (0-30)
    const preferredCategories = customer.bookings.map((b: any) => b.vendor.category);
    if (preferredCategories.includes(vendor.category)) {
      score += 30;
    }
    
    return score;
  }

  // Parse recommended dates from AI response
  private static parseRecommendedDates(suggestion?: string | null): string[] {
    if (!suggestion) return [];
    
    // Extract dates using regex (simplified)
    const datePattern = /\b\d{4}-\d{2}-\d{2}\b/g;
    return suggestion.match(datePattern) || [];
  }

  // Calculate market price range
  private static calculateMarketRange(vendors: any[]) {
    const prices = vendors.map(v => parseFloat(v.pricingRange) || 0).filter(p => p > 0);
    if (prices.length === 0) return null;
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }

  // Fallback recommendations if AI fails
  private static async getFallbackRecommendations() {
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDOR' },
      include: { reviews: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      recommendation: 'Here are some popular vendors based on recent activity and ratings.',
      vendors: vendors.map(v => ({
        ...v,
        score: v.reviews.reduce((acc, r) => acc + r.rating, 0) / (v.reviews.length || 1),
      })).sort((a, b) => (b as any).score - (a as any).score),
    };
  }
}

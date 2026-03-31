'use client';

import { useState } from 'react';
import { bookingsApi } from '@/lib/api/bookings';
import { Vendor } from '@/types';
import { format } from 'date-fns';
import { Calendar, User, Mail, Phone, MessageSquare, CheckCircle } from 'lucide-react';

interface BookingFormProps {
  vendor: Vendor;
}

export function BookingForm({ vendor }: BookingFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const availableDates = vendor.availability?.filter(a => a.status === 'AVAILABLE') || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await bookingsApi.create({
        vendorId: vendor.id,
        ...formData,
      });
      setSubmitted(true);
    } catch (err) {
    const error = err as { response?: { data?: { error?: string } } };
    setError(error.response?.data?.error || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Request Submitted!</h3>
        <p className="text-gray-600 mb-6">
          {vendor.name} will review your request and get back to you soon.
        </p>
        <a href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h4 className="font-medium text-gray-900">{vendor.name}</h4>
        <p className="text-sm text-gray-500">{vendor.category}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <User className="inline h-4 w-4 mr-1" />
          Your Name *
        </label>
        <input
          type="text"
          required
          minLength={2}
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Mail className="inline h-4 w-4 mr-1" />
          Email Address *
        </label>
        <input
          type="email"
          required
          value={formData.customerEmail}
          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Phone className="inline h-4 w-4 mr-1" />
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.customerPhone}
          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Calendar className="inline h-4 w-4 mr-1" />
          Event Date *
        </label>
        {availableDates.length > 0 ? (
          <select
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a date</option>
            {availableDates.map((avail) => (
              <option key={avail.date} value={avail.date}>
                {format(new Date(avail.date), 'MMMM d, yyyy')}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="date"
            required
            min={format(new Date(), 'yyyy-MM-dd')}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <MessageSquare className="inline h-4 w-4 mr-1" />
          Message (Optional)
        </label>
        <textarea
          rows={4}
          maxLength={500}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Tell us about your event..."
        />
        <p className="text-xs text-gray-500 mt-1">{formData.message.length}/500 characters</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Submitting...' : 'Submit Booking Request'}
      </button>
    </form>
  );
}

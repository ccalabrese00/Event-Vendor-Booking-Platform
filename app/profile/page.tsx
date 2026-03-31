'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    description: '',
    category: '',
    location: '',
    website: '',
    pricingRange: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        businessName: data.businessName || '',
        description: data.description || '',
        category: data.category || '',
        location: data.location || '',
        website: data.website || '',
        pricingRange: data.pricingRange || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const isVendor = session.user?.role === 'VENDOR';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {isVendor && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select a category</option>
                  <option value="Photography">Photography</option>
                  <option value="Videography">Videography</option>
                  <option value="Catering">Catering</option>
                  <option value="DJ">DJ</option>
                  <option value="Florist">Florist</option>
                  <option value="Decorations">Decorations</option>
                  <option value="Venue">Venue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pricing Range</label>
                <input
                  type="text"
                  value={formData.pricingRange}
                  onChange={(e) => setFormData({ ...formData, pricingRange: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., $500 - $1000"
                />
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <span className="font-medium">Name:</span> {profile?.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {profile?.email}
            </div>
            <div>
              <span className="font-medium">Role:</span> {profile?.role}
            </div>
            {profile?.phone && (
              <div>
                <span className="font-medium">Phone:</span> {profile.phone}
              </div>
            )}

            {isVendor && (
              <>
                {profile?.businessName && (
                  <div>
                    <span className="font-medium">Business:</span> {profile.businessName}
                  </div>
                )}
                {profile?.category && (
                  <div>
                    <span className="font-medium">Category:</span> {profile.category}
                  </div>
                )}
                {profile?.location && (
                  <div>
                    <span className="font-medium">Location:</span> {profile.location}
                  </div>
                )}
                {profile?.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-gray-600">{profile.description}</p>
                  </div>
                )}
                {profile?.website && (
                  <div>
                    <span className="font-medium">Website:</span>{' '}
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile?.pricingRange && (
                  <div>
                    <span className="font-medium">Pricing:</span> {profile.pricingRange}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

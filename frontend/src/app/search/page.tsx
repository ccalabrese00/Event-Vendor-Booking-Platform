'use client';

import { useState } from 'react';
import { Vendor } from '@/types';
import { vendorApi } from '@/lib/api/vendor';
import { VendorSearch } from '@/components/customer/VendorSearch';
import { VendorCard } from '@/components/customer/VendorCard';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (results: Vendor[]) => {
    setVendors(results);
    setSearched(true);
  };

  // Initial load of all vendors
  useState(() => {
    vendorApi.search().then(handleSearch);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Find Event Vendors</h1>
        <p className="text-gray-600 mt-2">Search for DJs, photographers, caterers, and more</p>
      </div>

      <VendorSearch onSearch={handleSearch} />

      <div className="mt-8">
        {searched && vendors.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No vendors found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

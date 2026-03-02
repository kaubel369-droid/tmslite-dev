'use client';

import { useState } from 'react';
import { Package, Truck, Search, Plus } from 'lucide-react';

// Basic Type Definitions defining what we get back from the backend
type RateQuote = {
  carrier: string;
  scac: string;
  totalCost: number;
  transitDays: number;
  quoteId: string;
  customerCost: number; // Includes brokerage margin
};

export default function RateShop() {
  const [zipOrigin, setZipOrigin] = useState('30301');
  const [zipDest, setZipDest] = useState('75201');
  const [weight, setWeight] = useState('1500');
  const [freightClass, setFreightClass] = useState('65');

  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<RateQuote[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFetchRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQuotes([]);

    try {
      const response = await fetch('/api/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipment: {
            origin: { zip: zipOrigin },
            destination: { zip: zipDest },
            items: [
              { weight: parseFloat(weight), class: freightClass, pallets: 1 }
            ]
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred fetching quotes.');
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Fastest':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200">Fastest</span>;
      case 'Cheapest':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">Cheapest</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-5xl w-full">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Truck className="h-8 w-8 text-indigo-600" />
              TMSLite Rate Shop
            </h1>
            <p className="text-slate-500 mt-2">Live LTL API quoting and booking portal.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Settings Sidebar */}
          <div className="col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-400" />
              Shipment Details
            </h2>
            <form onSubmit={handleFetchRates} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ORIGIN ZIP</label>
                <input
                  type="text"
                  value={zipOrigin}
                  onChange={(e) => setZipOrigin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 30303"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">DESTINATION ZIP</label>
                <input
                  type="text"
                  value={zipDest}
                  onChange={(e) => setZipDest(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 90210"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WEIGHT (LBS)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NMFC CLASS</label>
                  <select
                    value={freightClass}
                    onChange={(e) => setFreightClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="50">50</option>
                    <option value="65">65</option>
                    <option value="85">85</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-pulse">Fetching Rates...</span>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Shop Rates
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Area */}
          <div className="col-span-1 md:col-span-2">
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-4">
                {error}
              </div>
            )}

            {quotes.length === 0 && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-full bg-white border border-slate-200 border-dashed rounded-xl p-12 text-slate-500">
                <Search className="h-10 w-10 text-slate-300 mb-3" />
                <p>Enter shipment parameters to see live LTL carrier rates.</p>
              </div>
            )}

            {quotes.length > 0 && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Carrier Quotes</h3>
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">{quotes.length} Results</span>
                </div>

                {/* High Density Table Implementation built with tailwind standard tags */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Carrier</th>
                        <th className="px-5 py-3 font-semibold text-center">Transit Days</th>
                        <th className="px-5 py-3 font-semibold text-right">Carrier Cost</th>
                        <th className="px-5 py-3 font-semibold text-right text-indigo-700">Broker Rate</th>
                        <th className="px-5 py-3 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotes.map((quote, idx) => {
                        const isCheapest = idx === 0;
                        const isFastest = Math.min(...quotes.map(q => q.transitDays)) === quote.transitDays;

                        return (
                          <tr key={quote.quoteId} className="hover:bg-indigo-50/30 transition-colors group">
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="font-medium text-slate-900">{quote.carrier}</div>
                              <div className="text-xs text-slate-500 flex gap-1 mt-1">
                                {isCheapest && <StatusBadge status="Cheapest" />}
                                {isFastest && <StatusBadge status="Fastest" />}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 h-7 w-7 rounded-sm font-medium">
                                {quote.transitDays}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right text-slate-500 line-through decoration-slate-300">
                              ${quote.totalCost.toFixed(2)}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-lg text-indigo-700">
                              ${quote.customerCost.toFixed(2)}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-md text-xs shadow-sm transition-all flex items-center gap-1 mx-auto focus:ring-2 focus:ring-indigo-100">
                                <Plus className="h-3.5 w-3.5" /> Book
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

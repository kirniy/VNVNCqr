import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AdminHeader from '../../components/AdminHeader';

export default function CheckDB() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [searchCode, setSearchCode] = useState('ANGAR-B0USW2-UPKOH8LFG5CUBF6');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const q = query(
        collection(db, 'invitations'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString() || 'N/A'
      }));
      
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchForCode = async () => {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('code', '==', searchCode)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setSearchResult({ notFound: true });
      } else {
        setSearchResult({
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
          createdAt: snapshot.docs[0].data().createdAt?.toDate?.()?.toLocaleString() || 'N/A'
        });
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResult({ error: error instanceof Error ? error.message : 'An error occurred' });
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Check</h1>
          
          {/* Search Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Search for Code</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter invitation code"
              />
              <button
                onClick={searchForCode}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
            
            {searchResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                {searchResult.notFound ? (
                  <p className="text-red-600">Code not found in database!</p>
                ) : searchResult.error ? (
                  <p className="text-red-600">Error: {searchResult.error}</p>
                ) : (
                  <div>
                    <p><strong>Found:</strong> {searchResult.code}</p>
                    <p><strong>Status:</strong> {searchResult.status}</p>
                    <p><strong>Email:</strong> {searchResult.email || 'N/A'}</p>
                    <p><strong>Created:</strong> {searchResult.createdAt}</p>
                    <p><strong>Metadata:</strong> {JSON.stringify(searchResult.metadata || {})}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Recent Invitations */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Invitations ({invitations.length})</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metadata
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inv.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inv.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          inv.status === 'active' ? 'bg-green-100 text-green-800' :
                          inv.status === 'redeemed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inv.createdAt}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <pre className="text-xs">{JSON.stringify(inv.metadata || {}, null, 2)}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {invitations.length === 0 && (
                <p className="text-center py-4 text-gray-500">No invitations found</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
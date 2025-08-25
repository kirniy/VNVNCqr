import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export default function DebugPage() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all invitations
      const invSnapshot = await getDocs(collection(db, 'invitations'));
      const invData = invSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _raw: JSON.stringify(doc.data(), null, 2)
      }));
      setInvitations(invData);

      // Load all batches
      const batchSnapshot = await getDocs(collection(db, 'batches'));
      const batchData = batchSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _raw: JSON.stringify(doc.data(), null, 2)
      }));
      setBatches(batchData);

      console.log('Invitations:', invData);
      console.log('Batches:', batchData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Data</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Invitations ({invitations.length})</h2>
        <div className="space-y-4">
          {invitations.map(inv => (
            <div key={inv.id} className="bg-gray-900 p-4 rounded-lg">
              <p className="font-mono text-sm">ID: {inv.id}</p>
              <p className="font-mono text-sm">Code: {inv.code}</p>
              <p className="font-mono text-sm text-yellow-400">Status: {inv.status}</p>
              <p className="font-mono text-sm">Batch ID: {inv.metadata?.batchId}</p>
              {inv.redeemedAt && (
                <p className="font-mono text-sm text-red-400">
                  Redeemed At: {inv.redeemedAt.toDate?.()?.toLocaleString() || inv.redeemedAt}
                </p>
              )}
              {inv.redeemedBy && (
                <p className="font-mono text-sm text-red-400">
                  Redeemed By: {JSON.stringify(inv.redeemedBy)}
                </p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-gray-500">Raw Data</summary>
                <pre className="text-xs mt-2 overflow-auto">{inv._raw}</pre>
              </details>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Batches ({batches.length})</h2>
        <div className="space-y-4">
          {batches.map(batch => (
            <div key={batch.id} className="bg-gray-900 p-4 rounded-lg">
              <p className="font-mono text-sm">ID: {batch.id}</p>
              <p className="font-mono text-sm">Name: {batch.name}</p>
              <p className="font-mono text-sm">Total: {batch.totalCount}</p>
              <p className="font-mono text-sm text-yellow-400">Redeemed: {batch.redeemedCount}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-gray-500">Raw Data</summary>
                <pre className="text-xs mt-2 overflow-auto">{batch._raw}</pre>
              </details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
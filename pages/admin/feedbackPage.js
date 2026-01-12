"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Star, CheckCircle, AlertTriangle, ThumbsUp, Filter } from 'lucide-react';

export default function AdminFeedback() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolve State
  const [resolvingId, setResolvingId] = useState(null);
  const [adminReply, setAdminReply] = useState({ status: 'Resolved', response: '' });

  // Fetch Data
  const fetchFeedback = async () => {
    try {
      const { data } = await API.get('/feedback');
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchFeedback();
  }, [user]);

  // Resolve Feedback
  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/feedback/${resolvingId}/resolve`, {
        adminResponse: adminReply.response,
        status: adminReply.status
      });
      alert('Response sent!');
      setResolvingId(null);
      setAdminReply({ status: 'Resolved', response: '' });
      fetchFeedback();
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading QMS...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quality Management (QMS)</h1>
        <p className="text-gray-500">Manage patient complaints and suggestions.</p>
      </div>

      <div className="mb-4">
        <h2 className="font-bold text-xl text-gray-800">All Tickets</h2>
      </div>
      
      {feedbacks.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300 text-gray-500">
          No tickets found.
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((item) => (
            <div key={item._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative">
              
              {/* Status Badge */}
              <div className="absolute top-5 right-5">
                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                  item.status === 'New' ? 'bg-blue-100 text-blue-700' : 
                  item.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                  item.status === 'Investigating' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Header Info */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                  item.type === 'Complaint' ? 'bg-red-500' : 
                  item.type === 'Suggestion' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {item.type === 'Complaint' ? <AlertTriangle className="w-5 h-5" /> : 
                   item.type === 'Suggestion' ? <Filter className="w-5 h-5" /> : <ThumbsUp className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.department}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()} • {item.type}
                    • Patient ID: {item.patient?.slice(-4)}
                  </p>
                </div>
              </div>
              
              {/* Stars & Message */}
              <div className="flex mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">"{item.message}"</p>
              
              {/* Admin Response Section */}
              {item.adminResponse && (
                <div className="mt-3 ml-4 border-l-2 border-green-500 pl-3">
                   <p className="text-xs font-bold text-green-700 uppercase mb-1">Hospital Response</p>
                   <p className="text-sm text-gray-600 italic">"{item.adminResponse}"</p>
                </div>
              )}

              {/* RESOLVE BUTTON */}
              {item.status !== 'Closed' && !resolvingId && (
                 <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => setResolvingId(item._id)}
                      className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Reply & Update
                    </button>
                 </div>
              )}

              {/* RESOLVE FORM */}
              {resolvingId === item._id && (
                <div className="mt-4 border-t pt-4 animate-in fade-in">
                  <h4 className="font-bold text-sm mb-2">Update Status & Reply</h4>
                  <div className="flex gap-2 mb-2">
                    {['Investigating', 'Resolved', 'Closed'].map(st => (
                      <button 
                        key={st}
                        onClick={() => setAdminReply({...adminReply, status: st})}
                        className={`px-3 py-1 text-xs rounded border ${
                          adminReply.status === st ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full p-2 border rounded text-sm mb-2"
                    placeholder="Write official response..."
                    value={adminReply.response}
                    onChange={(e) => setAdminReply({...adminReply, response: e.target.value})}
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setResolvingId(null)} className="px-3 py-1 text-sm text-gray-500">Cancel</button>
                    <button onClick={handleResolve} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Submit Update</button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
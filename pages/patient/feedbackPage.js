"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Star, MessageSquare, Send, CheckCircle, AlertTriangle, ThumbsUp, X, Filter } from 'lucide-react';

export default function FeedbackModule() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Patient Form State
  const [formData, setFormData] = useState({
    type: 'Complaint',
    department: 'Pharmacy',
    message: '',
    rating: 0
  });
  const [hover, setHover] = useState(0); // Star hover effect

  // Admin Resolve State
  const [resolvingId, setResolvingId] = useState(null);
  const [adminReply, setAdminReply] = useState({ status: 'Resolved', response: '' });

  // 1. Fetch Data
  const fetchFeedback = async () => {
    try {
      const { data } = await API.get('/feedback');
      
      // Client-side filter: Patients should only see THEIR OWN feedback
      // (Ideally, the backend should handle this filter, but we do it here based on your current route)
      if (user.role === 'patient') {
        const myFeedback = data.filter(item => item.patient?._id === user._id || item.patient === user._id);
        setFeedbacks(myFeedback);
      } else {
        setFeedbacks(data);
      }
    } catch (err) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchFeedback();
  }, [user]);

  // 2. Submit Feedback (Patient)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) return alert("Please select a star rating");

    try {
      await API.post('/feedback', formData);
      alert('Feedback Submitted Successfully!');
      setFormData({ type: 'Complaint', department: 'Pharmacy', message: '', rating: 0 }); // Reset
      fetchFeedback();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // 3. Resolve Feedback (Admin)
  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/api/feedback/${resolvingId}/resolve`, {
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
        <p className="text-gray-500">
          {user?.role === 'admin' ? "Manage patient complaints and suggestions." : "We value your feedback to improve our services."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: SUBMISSION FORM (Patients Only) --- */}
        {user?.role === 'patient' && (
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 sticky top-24">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" /> Submit Ticket
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Complaint', 'Suggestion', 'Appreciation'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, type})}
                        className={`text-xs py-2 rounded-lg border transition ${
                          formData.type === type 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Department</label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-gray-50 outline-none"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option>Pharmacy</option>
                    <option>Cleaning / Hygiene</option>
                    <option>Doctor Staff</option>
                    <option>Reception / Billing</option>
                    <option>Facilities (AC/Water)</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(formData.rating)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star className={`w-8 h-8 ${star <= (hover || formData.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Description</label>
                  <textarea 
                    rows="4"
                    className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Describe your issue or suggestion..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  ></textarea>
                </div>

                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Submit
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- RIGHT: FEEDBACK LIST (Everyone) --- */}
        <div className={`${user?.role === 'patient' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl text-gray-800">
               {user.role === 'admin' ? 'All Tickets' : 'My History'}
            </h2>
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
                        {user.role === 'admin' && ` • Patient ID: ${item.patient?.slice(-4)}`}
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

                  {/* ADMIN ACTION: RESOLVE BUTTON */}
                  {user.role === 'admin' && item.status !== 'Closed' && !resolvingId && (
                     <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => setResolvingId(item._id)}
                          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                          Reply & Update
                        </button>
                     </div>
                  )}

                  {/* ADMIN ACTION: RESOLVE FORM (Shows when clicked) */}
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
      </div>
    </div>
  );
}
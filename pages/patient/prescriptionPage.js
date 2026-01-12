"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { Pill, Calendar, User, Download, FileText, CheckCircle, Clock, Activity, FileBarChart } from 'lucide-react';

export default function MedicalRecords() {
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both Prescriptions and Lab Reports in parallel
        const [rxRes, reportRes] = await Promise.all([
          API.get('/records/prescriptions/my').catch(() => ({ data: [] })), 
          API.get('/records/reports/my').catch(() => ({ data: [] }))
        ]);
        
        // Sort both by newest first
        setPrescriptions(rxRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setReports(reportRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        
      } catch (err) {
        console.error("Failed to load records", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-500 mt-1">Access your complete health history.</p>
      </div>

      {/* --- TABS --- */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'prescriptions' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Pill className="w-4 h-4" /> Prescriptions
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-1">
            {prescriptions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'reports' 
            ? 'bg-white text-purple-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileBarChart className="w-4 h-4" /> Lab Reports
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-1">
            {reports.length}
          </span>
        </button>
      </div>

      {/* --- TAB CONTENT: PRESCRIPTIONS --- */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          {prescriptions.length === 0 ? (
            <EmptyState icon={Pill} title="No Prescriptions" desc="Your prescribed medications will appear here." />
          ) : (
            prescriptions.map((rx, index) => {
              const isRecent = (new Date() - new Date(rx.createdAt)) / (1000 * 60 * 60 * 24) < 7;
              return (
                <div key={rx._id || index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isRecent ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Dr. {rx.doctor?.name || 'Doctor'}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {rx.doctor?.specialization || 'General'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(rx.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    {isRecent ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Active Course
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">History</span>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rx.medicines.map((med, i) => (
                        <div key={i} className="p-4 rounded-xl border border-gray-100 bg-white flex items-start gap-3">
                          <div className="mt-1"><Pill className="w-5 h-5 text-purple-500" /></div>
                          <div>
                            <p className="font-bold text-gray-800">{med.name}</p>
                            <p className="text-sm text-blue-600 font-medium">{med.dosage}</p>
                            <p className="text-xs text-gray-500 mt-1">{med.frequency} • {med.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {rx.notes && (
                      <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                        <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Doctor's Note</p>
                          <p className="text-sm text-gray-700 italic">"{rx.notes}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- TAB CONTENT: LAB REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No Lab Reports" desc="Test results and imaging reports will appear here." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report) => (
                <div key={report._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{report.title}</h4>
                        <p className="text-sm text-gray-500">{report.department || 'Pathology'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      report.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status || 'Processing'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(report.date || Date.now()).toLocaleDateString()}
                    </div>
                    
                    {report.fileUrl ? (
                      <a href={report.fileUrl} target="_blank" className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 italic">File not ready</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple Helper Component for Empty States
function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
      <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500">{desc}</p>
    </div>
  );
}
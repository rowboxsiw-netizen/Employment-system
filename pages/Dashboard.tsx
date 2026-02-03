
import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Employee } from '../types';
import { 
  Plus, 
  Download, 
  FileDown, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Activity,
  Briefcase
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { analyzeEnrollmentForm } from '../geminiService';
import toast, { Toaster } from 'react-hot-toast';

const ITEMS_PER_PAGE = 8;

const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    email: '',
    role: '',
    department: 'Engineering',
    joinDate: new Date().toISOString().split('T')[0],
    salary: 0,
    status: 'Active'
  });

  useEffect(() => {
    const q = query(collection(db, 'employees'), orderBy('fullName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(emps);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      toast.error("Database connection failed.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = (emp.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id), formData);
        toast.success('Record updated');
      } else {
        await addDoc(collection(db, 'employees'), formData);
        toast.success('Employee enrolled');
      }
      closeModal();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Permanent removal?')) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        toast.success('Removed');
      } catch (err) {
        toast.error('Deletion error');
      }
    }
  };

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData(emp);
    } else {
      setEditingEmployee(null);
      setFormData({
        fullName: '',
        email: '',
        role: '',
        department: 'Engineering',
        joinDate: new Date().toISOString().split('T')[0],
        salary: 0,
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setIsScanning(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Name", "Email", "Dept", "Role", "Join Date", "Status"];
    const tableRows = filteredEmployees.map(emp => [
      emp.fullName, emp.email, emp.department, emp.role, emp.joinDate, emp.status
    ]);

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("Nexus EMS Workforce Analytics", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Official Report | Generated: ${new Date().toLocaleString()}`, 14, 30);

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 }
    });

    doc.save(`Workforce_Report_${Date.now()}.pdf`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const extracted = await analyzeEnrollmentForm(base64String);
        setFormData(prev => ({ ...prev, ...extracted }));
        toast.success('AI Data Extraction Successful');
      } catch (err) {
        toast.error('Extraction failed. Check key config.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 min-h-full">
      <Toaster position="top-right" />
      
      {/* Main Workforce Management */}
      <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Workforce Management</h1>
            <p className="text-slate-500 font-medium">Enterprise-grade employee operations console</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={exportPDF}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all font-bold text-sm shadow-sm"
            >
              <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
              Intelligence Report
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 font-bold text-sm active:scale-95"
            >
              <Plus size={18} />
              Enroll Employee
            </button>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Headcount', val: employees.length, color: 'indigo' },
            { label: 'Active Status', val: employees.filter(e => e.status === 'Active').length, color: 'emerald' },
            { label: 'Avg Base Pay', val: `$${Math.round(employees.reduce((acc, curr) => acc + (curr.salary || 0), 0) / (employees.length || 1)).toLocaleString()}`, color: 'blue' },
            { label: 'Diversity Depts', val: new Set(employees.map(e => e.department)).size, color: 'amber' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform`}></div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2 relative z-10">{stat.val}</h3>
            </div>
          ))}
        </div>

        {/* Advanced Workforce Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/30">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Lookup employee by profile ID or name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-3 py-1.5 flex items-center gap-2 text-slate-400">
                  <Filter size={16} />
                </div>
                <select 
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-transparent border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <option value="All">Global Units</option>
                  {['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Legal'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em]">
                  <th className="px-8 py-5">Full Profile</th>
                  <th className="px-8 py-5">Assignment</th>
                  <th className="px-8 py-5">Tenure</th>
                  <th className="px-8 py-5">Compensation</th>
                  <th className="px-8 py-5">Integrity</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-8"><div className="h-12 bg-slate-100 rounded-2xl w-full"></div></td>
                    </tr>
                  ))
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                          <Briefcase size={32} />
                        </div>
                        <p className="text-slate-400 font-bold">No workforce records match your criteria.</p>
                        <button onClick={() => {setSearchTerm(''); setDeptFilter('All');}} className="text-indigo-600 text-sm font-bold hover:underline underline-offset-4">Reset Parameters</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-200/50 transform group-hover:scale-110 transition-transform">
                            {emp.fullName?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</p>
                            <p className="text-xs text-slate-400 font-medium">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-800">{emp.role}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{emp.department}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-600">{new Date(emp.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Established</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">${(emp.salary || 0).toLocaleString()}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">Gross</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => openModal(emp)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:shadow-lg rounded-xl transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(emp.id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-600 hover:shadow-lg rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                Page <span className="text-indigo-600">{currentPage}</span> of <span className="text-indigo-600">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-2.5 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-2.5 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Analytics */}
      <div className="w-full xl:w-80 space-y-6">
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Activity className="text-indigo-400" />
            </div>
            <div>
              <h4 className="font-black text-lg">Nexus Pulse</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Recent Activity</p>
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            {paginatedEmployees.slice(0, 3).map((e, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xs font-black uppercase border border-white/10 group-hover:bg-white/20 transition-colors">
                    {e.fullName?.[0]}
                  </div>
                  {idx < 2 && <div className="absolute top-10 left-5 w-px h-10 bg-white/10"></div>}
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-400 mb-0.5">RECORD MODIFIED</p>
                  <p className="text-sm font-bold text-slate-200">{e.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Updated 10m ago by Admin</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={20} />
            Quick Forms
          </h4>
          <button 
            onClick={() => {
              const doc = new jsPDF();
              doc.text("Workplace Compliance Check", 14, 20);
              doc.save("Compliance_Form.pdf");
            }}
            className="w-full py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-left hover:border-indigo-500 group transition-all"
          >
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500">Compliance</p>
            <p className="text-sm font-bold text-slate-900">Ethics Audit Form</p>
          </button>
        </div>
      </div>

      {/* AI Scan Enrollment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingEmployee ? 'Secure Profile Update' : 'Workforce Enrollment'}
                  </h2>
                  <p className="text-slate-500 font-medium mt-2">Enter official record credentials manually or via AI Scan.</p>
                </div>
                {!editingEmployee && (
                  <label className="relative flex items-center gap-3 px-5 py-3 bg-indigo-50 text-indigo-700 rounded-2xl cursor-pointer hover:bg-indigo-100 transition-all border border-indigo-100 font-bold text-sm group active:scale-95">
                    {isScanning ? (
                      <div className="w-5 h-5 border-2 border-indigo-700/30 border-t-indigo-700 rounded-full animate-spin"></div>
                    ) : (
                      <BrainCircuit size={20} className="group-hover:rotate-12 transition-transform" />
                    )}
                    <span>AI Document Scan</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isScanning} />
                  </label>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Full Name</label>
                    <input 
                      type="text" required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="e.g. Alexander Pierce"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Corporate Email</label>
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="a.pierce@nexus.corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Job Specification</label>
                    <input 
                      type="text" required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="e.g. Principal Architect"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Strategic Unit</label>
                    <select 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold cursor-pointer"
                    >
                      {['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Legal'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Base Salary (USD)</label>
                    <input 
                      type="number" required
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Effective Join Date</label>
                    <input 
                      type="date" required
                      value={formData.joinDate}
                      onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all font-bold text-sm active:scale-95"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-sm shadow-xl shadow-indigo-100 active:scale-95"
                  >
                    {editingEmployee ? 'Commit Update' : 'Finalize Enrollment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

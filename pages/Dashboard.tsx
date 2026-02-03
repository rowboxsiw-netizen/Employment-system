
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
  ChevronRight
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
    });

    return () => unsubscribe();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            emp.email.toLowerCase().includes(searchTerm.toLowerCase());
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
        toast.success('Employee updated successfully');
      } else {
        await addDoc(collection(db, 'employees'), formData);
        toast.success('Employee added successfully');
      }
      closeModal();
    } catch (err) {
      toast.error('Failed to save employee');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        toast.success('Employee deleted');
      } catch (err) {
        toast.error('Failed to delete');
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
    const tableColumn = ["Full Name", "Email", "Department", "Role", "Join Date", "Status"];
    const tableRows = filteredEmployees.map(emp => [
      emp.fullName,
      emp.email,
      emp.department,
      emp.role,
      emp.joinDate,
      emp.status
    ]);

    doc.setFontSize(20);
    doc.text("Nexus EMS Workforce Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save("Nexus_Employee_Report.pdf");
  };

  const downloadBlankForm = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("EMPLOYEE ENROLLMENT FORM", 105, 30, { align: "center" });
    
    doc.setFontSize(12);
    const fields = ["FULL NAME", "EMAIL ADDRESS", "JOB ROLE / TITLE", "DEPARTMENT", "ANNUAL SALARY", "JOIN DATE (YYYY-MM-DD)"];
    
    let y = 50;
    fields.forEach(field => {
      doc.text(field, 20, y);
      doc.rect(20, y + 5, 170, 15);
      y += 30;
    });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Official HR Document - Nexus Systems Corp", 105, 280, { align: "center" });

    doc.save("Nexus_Blank_Enrollment_Form.pdf");
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
        toast.success('AI Scan Complete: Fields Pre-filled');
      } catch (err) {
        toast.error('AI Extraction failed. Please fill manually.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workforce Dashboard</h1>
          <p className="text-slate-500">Manage and track your global workforce in real-time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={downloadBlankForm}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
          >
            <FileDown size={18} />
            Blank Form
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
          >
            <Download size={18} />
            Export Data
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-medium text-sm"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Workforce</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{employees.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Active Members</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">
            {employees.filter(e => e.status === 'Active').length}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Avg. Salary</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">
            ${(employees.reduce((acc, curr) => acc + curr.salary, 0) / (employees.length || 1)).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Departments</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">
            {new Set(employees.map(e => e.department)).size}
          </h3>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select 
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Role & Dept</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold">Salary</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-10 bg-slate-100 rounded-lg"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No employees found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-indigo-600">
                          {emp.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.fullName}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{emp.role}</p>
                      <p className="text-xs text-slate-500">{emp.department}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(emp.joinDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">
                      ${emp.salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.status === 'Active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(emp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)}</span> of <span className="font-medium">{filteredEmployees.length}</span> employees
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === i + 1 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingEmployee ? 'Update Profile' : 'New Employee'}
                  </h2>
                  <p className="text-slate-500 text-sm">Official workforce record credentials.</p>
                </div>
                {!editingEmployee && (
                  <label className="relative flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all border border-indigo-100 font-medium text-sm group">
                    {isScanning ? (
                      <div className="w-5 h-5 border-2 border-indigo-700/30 border-t-indigo-700 rounded-full animate-spin"></div>
                    ) : (
                      <BrainCircuit size={18} className="group-hover:rotate-12 transition-transform" />
                    )}
                    <span>AI Scan Form</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isScanning} />
                  </label>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Work Email</label>
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Job Role</label>
                    <input 
                      type="text" required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Senior Backend Dev"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Department</label>
                    <select 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Annual Salary (USD)</label>
                    <input 
                      type="number" required
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Join Date</label>
                    <input 
                      type="date" required
                      value={formData.joinDate}
                      onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Employment Status</label>
                    <div className="flex gap-4">
                      {['Active', 'Inactive'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, status: s as any})}
                          className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                            formData.status === s 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-slate-500 border-slate-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100"
                  >
                    {editingEmployee ? 'Update Profile' : 'Save Employee'}
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

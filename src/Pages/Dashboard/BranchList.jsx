import React, { useState, useEffect } from "react";
import { db } from "../../Config/Firebaseconfig";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
import {
  Edit3, Trash2, Search, X, CheckCircle, 
  ChevronDown, Building2, MapPin, Hash, GitBranch,
  Globe, Activity, ShieldCheck, Power, PowerOff
} from "lucide-react";
import * as yup from "yup";

/* Yup Validation Schema for Editing */
const editBranchSchema = yup.object({
  branchName: yup
    .string()
    .trim()
    .min(3, "Branch name must be at least 3 characters")
    .required("Branch name is required"),
  address: yup
    .string()
    .trim()
    .min(10, "Detailed address is required")
    .required("Address is required"),
  type: yup
    .string()
    .oneOf(["Main", "Sub"])
    .required("Type is required"),
    status: yup.string().oneOf(["Active", "Inactive"]),
});

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [editingBranch, setEditingBranch] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "branches"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBranches(list);
    });
    return () => unsubscribe();
  }, []);

  const stats = {
    total: branches.length,
    main: branches.filter(b => b.type === "Main").length,
    sub: branches.filter(b => b.type === "Sub").length,
    active: branches.filter(b => b.status === "Active").length,
    inactive: branches.filter(b => b.status === "Inactive").length,
  };

  const toggleStatus = async (branch) => {
    const newStatus = branch.status === "Active" ? "Inactive" : "Active";
    
    if (branch.type === "Main" && newStatus === "Inactive") {
      if (!window.confirm("⚠️ Deactivating the Main HQ may restrict system-wide access. Continue?")) return;
    }

    try {
      await updateDoc(doc(db, "branches", branch.id), { status: newStatus });
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const handleEditClick = (branch) => {
    setEditingBranch(branch.id);
    setEditFormData(branch);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const validatedData = await editBranchSchema.validate(editFormData, { abortEarly: false });

      // Check if user is trying to promote to Main when a Main already exists
      if (validatedData.type === "Main") {
        const q = query(collection(db, "branches"), where("type", "==", "Main"));
        const snapshot = await getDocs(q);
        const existingMain = snapshot.docs.find(doc => doc.id !== editingBranch);
        
        if (existingMain) {
          alert("🚫 System Conflict: Another 'Main' branch already exists. Demote the current Main branch first.");
          return;
        }
      }

      await updateDoc(doc(db, "branches", editingBranch), validatedData);
      setEditingBranch(null);
      setEditErrors({});
    } catch (err) {
      if (err.inner) {
        const formatted = {};
        err.inner.forEach(e => formatted[e.path] = e.message);
        setEditErrors(formatted);
      }
    }
  };

  const handleDelete = async (id, type) => {
    const msg = type === "Main" 
      ? "Warning: Deleting the Main branch may disrupt the network. Proceed?" 
      : "Confirm removal of this branch node?";
    if (window.confirm(msg)) {
      await deleteDoc(doc(db, "branches", id));
    }
  };

  const filteredBranches = branches.filter(b => {
    const matchesSearch = b.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.branchCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || b.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 md:p-12 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Branch <span className="text-indigo-600">Registry</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Network Node Management</p>
        </div>

        <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="text-right border-r border-slate-100 pr-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Nodes</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
          <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-bold">MAIN: {stats.main}</div>
            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold">SUB: {stats.sub}</div>
          </div>
          <div className="flex gap-2">
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-bold">ONLINE: {stats.active}</div>
            <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-bold">OFFLINE: {stats.inactive}</div>
          </div>
          </div>
        </div>
      </div>

      {/* --- SEARCH & FILTERS --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            type="text" placeholder="Search by branch name or unique code..."
            className="w-full pl-14 pr-8 py-5 bg-white rounded-3xl border-none shadow-sm font-bold transition-all focus:ring-2 focus:ring-indigo-500/20"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <select
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full pl-6 pr-12 py-5 bg-white appearance-none rounded-3xl border-none shadow-sm font-black text-xs text-slate-600 cursor-pointer uppercase"
          >
            <option value="All">All Clusters</option>
            <option value="Main">Main HQ Only</option>
            <option value="Sub">Sub Branches</option>
          </select>
          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Branch Identity</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Hierarchy</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Operational Status</th>
                <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className={`hover:bg-indigo-50/20 transition-colors group ${branch.status === 'Inactive' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <td className="p-8">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{branch.branchName}</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                        <Hash size={10} /> {branch.branchCode}
                      </span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-start gap-2 max-w-xs">
                      <MapPin size={14} className="text-slate-300 mt-1 shrink-0" />
                      <span className="text-sm font-bold text-slate-500 leading-relaxed">{branch.address}</span>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      branch.type === 'Main' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {branch.type}
                    </span>
                  </td>
                  <td className="p-8 text-center">
                  <button 
                    onClick={() => toggleStatus(branch)}
                    className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-2xl transition-all font-black text-[10px] uppercase tracking-tighter shadow-sm border ${
                      branch.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                    }`}
                  >
                    {branch.status === 'Active' ? <Power size={12} /> : <PowerOff size={12} />}
                    {branch.status}
                  </button>
                </td>
                  <td className="p-8">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(branch)} className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:shadow-md rounded-2xl border border-slate-100 transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(branch.id, branch.type)} className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:shadow-md rounded-2xl border border-slate-100 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl my-auto animate-in fade-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-[3rem]">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight text-indigo-600 italic">Nexus<span className="text-slate-900">Node_Update</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">CODE: {editFormData.branchCode}</p>
              </div>
              <button onClick={() => setEditingBranch(null)} className="p-4 bg-white text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleUpdate} className="p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Building2 size={12} /> Branch Name</label>
                  <input 
                    type="text" 
                    value={editFormData.branchName} 
                    onChange={(e) => setEditFormData({ ...editFormData, branchName: e.target.value })} 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-indigo-500/20" 
                  />
                  {editErrors.branchName && <p className="text-rose-500 text-[10px] font-bold ml-2 uppercase">{editErrors.branchName}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Status</label>
                  <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><GitBranch size={12} /> Establishment Type</label>
                  <select 
                    value={editFormData.type} 
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })} 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm"
                  >
                    <option value="Sub">Sub Branch</option>
                    <option value="Main">Main Headquarters</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><MapPin size={12} /> Physical Address</label>
                  <textarea 
                    rows="3"
                    value={editFormData.address} 
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm resize-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {editErrors.address && <p className="text-rose-500 text-[10px] font-bold ml-2 uppercase">{editErrors.address}</p>}
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-600 shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
                <ShieldCheck size={22} /> Update Node Registry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchList;
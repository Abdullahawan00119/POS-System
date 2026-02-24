import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { db } from "../../Config/Firebaseconfig";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { 
  Building2, MapPin, GitBranch, Sparkles, 
  ChevronDown, Globe, ShieldCheck, Activity, 
  Hash
} from "lucide-react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

/* Yup Validation Schema */
const branchSchema = yup.object({
  branchName: yup
    .string()
    .trim()
    .min(3, "Branch name must be at least 3 characters")
    .required("Branch name is required"),

  branchCode: yup.string().required(),

  address: yup
    .string()
    .trim()
    .min(10, "Please provide a more detailed address")
    .required("Physical address is required"),

  type: yup
    .string()
    .oneOf(["Main", "Sub"], "Select a valid branch type")
    .required("Branch type is required"),
}).required();

const CreateBranch = () => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: { type: "Sub", branchCode: "" }
  });

  const branchName = watch("branchName") || "New Branch";
  const branchType = watch("type");
  const branchCode = watch("branchCode");

  // --- AUTO-GENERATOR FOR BRANCH CODE ---
  useEffect(() => {
    if (branchName && branchName.length >= 2) {
      const prefix = branchName.substring(0, 2).toUpperCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const typeCode = branchType === "Main" ? "M" : "S";
      setValue("branchCode", `NX-${prefix}-${randomSuffix}-${typeCode}`);
    }
  }, [branchName, branchType, setValue]);

  const onSubmit = async (data) => {
    try {
      // --- PREVENT MULTIPLE MAIN BRANCHES ---
      if (data.type === "Main") {
        const q = query(collection(db, "branches"), where("type", "==", "Main"));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          alert("🚫 Access Denied: A 'Main' branch already exists. Only one primary node is permitted in the Nexus.");
          return;
        }
      }

      const branchData = {
        ...data,
        status: "Active",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "branches"), branchData);
      reset({ type: "Sub" });
      alert("🏢 Branch Node Successfully Initialized");
    } catch (error) { 
      console.error("Deployment Error:", error); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">

        {/* --- HEADER BENTO BOX --- */}
        <div className="bg-white rounded-[2.5rem] p-8 mb-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100">
              <Building2 className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight italic">Nexus<span className="text-indigo-600">Network</span></h1>
              <p className="text-slate-400 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Multi-Location Management
              </p>
            </div>
          </div>
          <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl">
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-bold text-indigo-600">Enterprise Ready</div>
            <div className="px-4 py-2 text-sm font-bold text-slate-400 italic">v2.6 Node</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* --- LEFT: STATUS MODULE --- */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6">
                  <Activity className="text-indigo-100 group-hover:text-indigo-200 transition-colors" size={80} />
               </div>
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-tighter text-slate-400">Identity Preview</h3>
               
               <div className="relative z-10">
                 <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${
                   branchType === 'Main' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                 }`}>
                   {branchType} Unit
                 </div>
                 <h2 className="text-4xl font-black text-slate-800 break-words leading-tight">
                   {branchName}
                 </h2>
                 <p className="mt-4 text-slate-500 font-medium flex items-start gap-2">
                   <MapPin className="w-4 h-4 mt-1 shrink-0" />
                   {watch("address") || "Awaiting location coordinates..."}
                 </p>
               </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                  <Hash size={160} />
               </div>
               <h3 className="text-xs font-black mb-10 uppercase tracking-[0.3em] text-indigo-400">Generated Node ID</h3>
               
               <div className="relative z-10">
                 <div className="text-5xl font-mono font-black tracking-tighter text-white mb-2">
                   {branchCode || "NX-____"}
                 </div>
                 <div className="h-1 w-20 bg-indigo-500 rounded-full mb-6"></div>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">
                   Unique identifier automatically generated based on branch nomenclature and type.
                 </p>
               </div>
            </div>
          </div>

          {/* --- RIGHT: FORM MODULE --- */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* BRANCH NAME */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                    <input
                      {...register("branchName")}
                      placeholder="e.g. Downtown Flagship or North Hub"
                      className="w-full bg-slate-50 border-none p-5 pl-14 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  {errors.branchName && (
                    <p className="text-rose-500 text-xs mt-1 ml-1 font-semibold">{errors.branchName.message}</p>
                  )}
                </div>

                {/* HIDDEN CODE FIELD (Stored in state via watch/setValue) */}
                <input type="hidden" {...register("branchCode")} />

                {/* BRANCH TYPE */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Establishment Type</label>
                  <div className="relative group">
                    <GitBranch className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 z-10" size={18} />
                    <select
                      {...register("type")}
                      className="w-full appearance-none bg-slate-50 border-none p-5 pl-14 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer relative"
                    >
                      <option value="Sub">Sub Branch</option>
                      <option value="Main">Main Branch</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                  <textarea
                    {...register("address")}
                    rows="3"
                    placeholder="Enter the complete street address, building, and floor details..."
                    className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                  />
                  {errors.address && (
                    <p className="text-rose-500 text-xs mt-1 ml-1 font-semibold">{errors.address.message}</p>
                  )}
                </div>

              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 transition-all shadow-2xl shadow-indigo-200 uppercase tracking-widest flex items-center justify-center gap-3"
              >
                {isSubmitting ? "Provisioning..." : "Initialize Branch Node"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBranch;
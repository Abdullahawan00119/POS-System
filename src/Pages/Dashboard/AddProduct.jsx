import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { db } from "../../Config/Firebaseconfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  LucideBarcode, Camera, PackagePlus, DollarSign,
  Archive, Layers, Coffee, Smartphone, Utensils, Box, ChevronDown, Sparkles, TrendingUp,
  Bell
} from "lucide-react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

/* Yup Validation Schema */
const productSchema = yup.object({
  category: yup
    .string()
    .required("Category is required"),

  sku: yup
    .string()
    .trim()
    .required("SKU / Barcode is required"),

  name: yup
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .required("Product title is required"),

  costPrice: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" ? undefined : value
    )
    .typeError("Cost price must be a number")
    // .positive("Cost price must be greater than 0")
    .min(0, "Cost price cannot be negative")
    .required("Cost price is required"),

  sellingPrice: yup
    .number()
    .transform((value, originalValue) =>
      originalValue === "" ? undefined : value
    )
    .typeError("Selling price must be a number")
    .min(0, "Selling price cannot be negative")
    .required("Selling price is required")
    .test(
    "is-greater-than-cost",
    "Selling price must be greater than cost price",
    function (value) {
      const { costPrice } = this.parent;
      if (value === undefined || costPrice === undefined) return true;
      return value > costPrice;
    }
  ),

  stock: yup
    .number()
    .typeError("Stock must be a number")
    .integer("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .required("Initial stock is required"),

  notifyQuantity: yup
    .number()
    .typeError("Notify quantity must be a number")
    .integer("Notify quantity must be a whole number")
    .min(0, "Notify quantity cannot be negative")
    .required("Notify quantity is required")
    .max(
      yup.ref("stock"),
      "Notify quantity cannot be greater than available stock"
    ),
}).required();

const AddProduct = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { register, handleSubmit, reset, setFocus, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: { category: "General" }
  });

  const cost = watch("costPrice") || 0;
  const sell = watch("sellingPrice") || 0;
  const margin = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(1) : 0;

  const categories = [
    { name: "General", icon: <Box className="w-4 h-4" /> },
    { name: "Food", icon: <Utensils className="w-4 h-4" /> },
    { name: "Beverage", icon: <Coffee className="w-4 h-4" /> },
    { name: "Electronics", icon: <Smartphone className="w-4 h-4" /> },
  ];

  useEffect(() => {
    let scanner;
    if (isCameraOpen) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 150 } });
      scanner.render((decodedText) => {
        setValue("sku", decodedText);
        setIsCameraOpen(false);
        setFocus("name");
        scanner.clear();
      }, () => { });
    }
    return () => scanner?.clear();
  }, [isCameraOpen, setValue, setFocus]);

  const onSubmit = async (data) => {
    try {
      const productData = {
        ...data,
        sellingPrice: Number(data.sellingPrice),
        costPrice: Number(data.costPrice),
        stock: Number(data.stock),
        notifyQuantity: Number(data.stock),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "products"), productData);
      reset({ category: "General" });
      alert("✨ Product Sync Complete");
    } catch (error) { console.error(error); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">

        {/* --- HEADER BENTO BOX --- */}
        <div className="bg-white rounded-[2.5rem] p-8 mb-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100">
              <PackagePlus className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight italic">Nexus<span className="text-blue-600">Inventory</span></h1>
              <p className="text-slate-400 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> AI-Enhanced Product Entry
              </p>
            </div>
          </div>
          <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl">
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-bold text-blue-600">v2.6 Stable</div>
            <div className="px-4 py-2 text-sm font-bold text-slate-400">Cloud Synced</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* --- LEFT: SCANNER MODULE --- */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter">Capture Hub</h3>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(!isCameraOpen)}
                  className={`w-full py-5 rounded-[2rem] font-black transition-all duration-500 flex items-center justify-center gap-3 ${isCameraOpen ? "bg-rose-50 text-rose-600" : "bg-slate-900 text-white hover:bg-blue-600 shadow-2xl shadow-blue-200"
                    }`}
                >
                  <Camera className="w-5 h-5" />
                  {isCameraOpen ? "Deactivate Lens" : "Initialize Scanner"}
                </button>
              </div>
              {isCameraOpen && <div id="reader" className="m-4 rounded-[1.5rem] overflow-hidden border-4 border-slate-50"></div>}
            </div>

            {/* LIVE ANALYTICS PREVIEW */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <TrendingUp className="text-blue-400 mb-4" size={32} />
              <h4 className="text-xl font-bold mb-1">Profit Analysis</h4>
              <p className="text-slate-400 text-sm mb-6">Real-time margin calculation</p>
              <div className="text-5xl font-black text-white">{margin}%</div>
              <div className="mt-4 h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.min(margin, 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* --- RIGHT: FORM MODULE --- */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* CATEGORY DROPDOWN */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative group">
                    <select
                      {...register("category")}
                      className="w-full appearance-none bg-slate-50 border-none p-5 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                  </div>
                  
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* SKU */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Barcode</label>
                  <div className="relative">
                    <LucideBarcode className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                    <input
                      {...register("sku", { required: true })}
                      placeholder="Automatic ID..."
                      className="w-full bg-slate-50 border-none p-5 pl-14 rounded-2xl font-mono font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  {errors.sku && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">
                      {errors.sku.message}
                    </p>
                  )}
                </div>

                {/* NAME */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Title</label>
                  <input
                    {...register("name", { required: true })}
                    placeholder="e.g. Premium Wireless Audio X2"
                    className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all"
                  />

                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* COST */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cost (Investment)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="number" step="0.01"
                      min={0}
                      {...register("costPrice", { required: true })}
                      className="w-full bg-slate-50 border-none p-5 pl-12 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  {errors.costPrice && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">
                      {errors.costPrice.message}
                    </p>
                  )}
                </div>

                {/* SELLING */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Price (Market)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                    <input
                      type="number" step="0.01"
                      min={0}
                      {...register("sellingPrice", { required: true })}
                      className="w-full bg-green-50 border-none p-5 pl-12 rounded-2xl font-bold text-green-700 focus:ring-4 focus:ring-green-100 transition-all"
                    />
                  </div>

                  {errors.sellingPrice && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">
                      {errors.sellingPrice.message}
                    </p>
                  )}
                </div>

                {/* STOCK */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
                  <div className="relative">
                    <Archive className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="number"
                      min={0}
                      {...register("stock", { required: true })}
                      className="w-full bg-slate-50 border-none p-5 pl-12 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  {errors.stock && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">
                      {errors.stock.message}
                    </p>
                  )}
                </div>

                {/* NOTIFY QUANTITY */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Notify Quantity</label>
                  <div className="relative">
                    <Bell className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="number"
                      min={0}
                      {...register("notifyQuantity", { required: true })}
                      className="w-full bg-slate-50 border-none p-5 pl-12 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  
                  {errors.notifyQuantity && (
                    <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">
                      {errors.notifyQuantity.message}
                    </p>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-2xl shadow-blue-200 uppercase tracking-widest">
                Deploy Product to Inventory
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
import React from "react";
import { Routes, Route } from "react-router";
import SignUp from "../Auth/SignUp";
import Login from "../Auth/Login";
import { useAuthListener } from "../Hooks/useAuthListener.jsx";
import ProtectedRoutes from "../Components/ProtectedRoutes";
import Home from "../Pages/User/Home.jsx";
import AddProduct from "../Pages/Dashboard/AddProduct.jsx";
import DashboardLayout from "../Pages/Dashboard/DashboardLayout.jsx";
import Overview from "../Pages/Dashboard/Overview.jsx";
import Inventory from "../Pages/Dashboard/Inventory.jsx";
import CreateBranch from "../Pages/Dashboard/CreateBranch .jsx";

export default function Routepage() {
  useAuthListener(); // 🔑 top-level call

  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      {/* 🔑 NESTED ADMIN ROUTES */}
      <Route
        path="/dashboard"
        element={<ProtectedRoutes component={<DashboardLayout />} role={["admin"]} />}
      >
        {/* These paths become /dashboard and /dashboard/addproduct */}
        <Route index element={<Overview />} />
        <Route path="addproduct" element={<AddProduct />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="createbranch" element={<CreateBranch />} />
      </Route>
      <Route
        path="/"
        element={<ProtectedRoutes component={<Home />} role={["admin", "user"]} />}
      />
    </Routes>
  );
}

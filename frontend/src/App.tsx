import { Routes, Navigate, Route, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
import { Home } from "./pages/Home";
import PersistLogin from "./components/PersistLogin";
import Register from "./pages/auth/Register";
import Navbar from "./components/Navbar";
import StaffList from "./pages/admin/StaffList";
import DriverList from "./pages/admin/DriverList";
import DonorList from "./pages/admin/DonorList";
import NGOList from "./pages/admin/NGOList";
import PageWrapper from "./components/pageWrapper";
import { AnimatePresence } from "framer-motion";
import { ConfigProvider, theme } from "antd";
import { useUITheme } from "./Store";
import { useEffect } from "react";
import Profile from "./components/UserProfileCard";
import InventoryTable from "./pages/Donor/Inventory";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import OrderTable from "./pages/NGO/OrderList";
import ReportsDashboard from "./pages/admin/ReportsDashBoard";

function App() {
  const location = useLocation();
  const { defaultAlgorithm, darkAlgorithm } = theme;

  const darkMode = useUITheme((s) => s.darkMode);
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);
  return (
    <>
      <ConfigProvider
        theme={{
          algorithm: darkMode ? darkAlgorithm : defaultAlgorithm,
        }}
      >
        <Navbar />
        {/* AnimatePresence must be a direct parent of the routes you want to animate */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PersistLogin />}>
              <Route
                index
                element={
                  <PageWrapper>
                    <Home />
                  </PageWrapper>
                }
              />
              <Route path="auth">
                <Route
                  path="login"
                  element={
                    <PageWrapper>
                      <Login />
                    </PageWrapper>
                  }
                />
                <Route
                  path="register"
                  element={
                    <PageWrapper>
                      <Register />
                    </PageWrapper>
                  }
                />
              </Route>
              {/* Admin section */}
              <Route element={<AuthMiddleware></AuthMiddleware>}>
                <Route path="admin">
                  <Route
                    path="StaffList"
                    element={
                      <PageWrapper>
                        <StaffList />
                      </PageWrapper>
                    }
                  />
                  <Route
                    path="DriverList"
                    element={
                      <PageWrapper>
                        <DriverList />
                      </PageWrapper>
                    }
                  />
                  <Route
                    path="DonorList"
                    element={
                      <PageWrapper>
                        <DonorList />
                      </PageWrapper>
                    }
                  />
                  <Route
                    path="NGOList"
                    element={
                      <PageWrapper>
                        <NGOList />
                      </PageWrapper>
                    }
                  />
                </Route>
                <Route
                  path="profile"
                  element={
                    <PageWrapper>
                      <Profile />
                    </PageWrapper>
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <PageWrapper>
                      <InventoryTable />
                    </PageWrapper>
                  }
                />
                <Route
                  path="orderList"
                  element={
                    <PageWrapper>
                      <OrderTable />
                    </PageWrapper>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <PageWrapper>
                      <ReportsDashboard />
                    </PageWrapper>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </ConfigProvider>
    </>
  );
}

export default App;

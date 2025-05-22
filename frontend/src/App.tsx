import { Routes, Navigate, Route, useLocation } from "react-router-dom";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import User from "./pages/auth/LoggedInPage";
import PersistLogin from "./components/PersistLogin";
import Register from "./pages/auth/Register";
import Navbar from "./components/Navbar";
import StaffList from "./pages/admin/StaffList";
import DriverList from "./pages/admin/DriverList";
import DonorList from "./pages/admin/Donor";
import NGOList from "./pages/admin/NGOList";
import PageWrapper from "./components/pageWrapper";
import { AnimatePresence } from "framer-motion";
import { ConfigProvider, theme } from "antd";
import { useUITheme } from "./Store";
import { useEffect } from "react";

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
              <Route
                path="admin/StaffList"
                element={
                  <PageWrapper>
                    <StaffList />
                  </PageWrapper>
                }
              />
              <Route
                path="admin/DriverList"
                element={
                  <PageWrapper>
                    <DriverList />
                  </PageWrapper>
                }
              />
              <Route
                path="admin/DonorList"
                element={
                  <PageWrapper>
                    <DonorList />
                  </PageWrapper>
                }
              />
              <Route
                path="admin/NGOList"
                element={
                  <PageWrapper>
                    <NGOList />
                  </PageWrapper>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </ConfigProvider>
    </>
  );
}

export default App;

import { Routes, Navigate, Route } from "react-router-dom";
import AuthMiddleware from "./middlewares/AuthMiddleware";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import User from "./pages/auth/User";
import PersistLogin from "./components/PersistLogin";
import Register from "./pages/auth/Register";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<PersistLogin />}>
          <Route index element={<Home />}></Route>
          <Route path="/auth">
            <Route path="login" element={<Login />}></Route>
            <Route path="register" element={<Register />}></Route>
            <Route path="user" element={<AuthMiddleware />}>
              <Route index element={<User />}></Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" />}></Route>
      </Routes>
    </>
  );
}

export default App;

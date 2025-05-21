import { NavLink } from "react-router-dom";
import { Layout, Menu } from "antd";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";
import { useCallback } from "react";
import { useAuthStore } from "../Store";
import { Role } from "../constants/roles";

const { Header } = Layout;

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const role = useAuthStore((state) => state.currentUserRole);
  const logout = useLogout();

  const renderNavItems = useCallback(() => {
    if (role === Role.Admin) {
      return (
        <>
          <Menu.Item key="admin-home">
            <NavLink to="/admin/Home">Admin</NavLink>
          </Menu.Item>
          <Menu.Item key="staff-list">
            <NavLink to="/admin/StaffList">Manage Staff</NavLink>
          </Menu.Item>
        </>
      );
    }

    // Add other roles if needed here

    return null;
  }, [role]);

  return (
    <Layout>
      <Header style={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <Menu
          theme="dark"
          mode="horizontal"
          selectable={false}
          style={{ display: "flex", justifyContent: "start" }}
        >
          <Menu.Item key="home">
            <NavLink to="/">Home</NavLink>
          </Menu.Item>

          {isLoggedIn ? (
            <>
              {renderNavItems()}
              <Menu.Item key="logout">
                <NavLink to="/auth/logout" onClick={logout}>
                  Logout
                </NavLink>
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item key="login">
                <NavLink to="/auth/login">Login</NavLink>
              </Menu.Item>
              <Menu.Item key="register">
                <NavLink to="/auth/register">Register</NavLink>
              </Menu.Item>
            </>
          )}
        </Menu>
      </Header>
    </Layout>
  );
}

import { NavLink } from "react-router-dom";
import { Layout, Menu } from "antd";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";

const { Header } = Layout;

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const logout = useLogout();

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
              <Menu.Item key="user">
                <NavLink to="/auth/user">User</NavLink>
              </Menu.Item>
              <Menu.Item key="register">
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

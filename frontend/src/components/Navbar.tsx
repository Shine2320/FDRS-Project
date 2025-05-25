import { NavLink, useLocation } from "react-router-dom";
import { Layout, Menu, Switch, Typography } from "antd";
import { LogoutOutlined, MoonFilled, SunFilled } from "@ant-design/icons";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";
import { useCallback } from "react";
import { useAuthStore, useUITheme } from "../Store";
import { Role } from "../constants/roles";

const { Header } = Layout;
const { Text } = Typography;

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const role = useAuthStore((s) => s.currentUserRole);
  const logout = useLogout();
  const darkMode = useUITheme((s) => s.darkMode);
  const setDarkMode = useUITheme((s) => s.setDarkMode);

  // get current path for menu selection
  const location = useLocation();
  const currentPath = location.pathname;

  const renderNavItems = useCallback(() => {
    switch (role) {
      case Role.Donor:
        return [
          { key: "/profile", label: <NavLink to="/profile">Profile</NavLink> },
          {
            key: "/inventory",
            label: <NavLink to="/inventory">Inventory</NavLink>,
          },
          {
            key: "/orderList",
            label: <NavLink to="/orderList">Orders</NavLink>,
          },
        ];
      case Role.Ngo:
        return [
          { key: "/profile", label: <NavLink to="/profile">Profile</NavLink> },
          {
            key: "/inventory",
            label: <NavLink to="/inventory">Inventory</NavLink>,
          },
          {
            key: "/orderList",
            label: <NavLink to="/orderList">Orders</NavLink>,
          },
        ];
      case Role.Staff:
        return [
          { key: "/profile", label: <NavLink to="/profile">Profile</NavLink> },
          {
            key: "/inventory",
            label: <NavLink to="/inventory">Inventory</NavLink>,
          },
          {
            key: "/orderList",
            label: <NavLink to="/orderList">Orders</NavLink>,
          },
        ];
      case Role.Driver:
        return [
          { key: "/profile", label: <NavLink to="/profile">Profile</NavLink> },
          {
            key: "/orderList",
            label: <NavLink to="/orderList">Orders</NavLink>,
          },
        ];
      case Role.Admin:
        return [
          {
            key: "/admin/StaffList",
            label: <NavLink to="/admin/StaffList">Staff</NavLink>,
          },
          {
            key: "/admin/DriverList",
            label: <NavLink to="/admin/DriverList">Drivers</NavLink>,
          },
          {
            key: "/admin/DonorList",
            label: <NavLink to="/admin/DonorList">Donors</NavLink>,
          },
          {
            key: "/admin/NGOList",
            label: <NavLink to="/admin/NGOList">NGO</NavLink>,
          },
          {
            key: "/inventory",
            label: <NavLink to="/inventory">Inventory</NavLink>,
          },
          {
            key: "/orderList",
            label: <NavLink to="/orderList">Orders</NavLink>,
          },
          {
            key: "/reports",
            label: <NavLink to="/reports">Reports</NavLink>,
          },
        ];
      default:
        return [];
    }
  }, [role]);

  const commonItems = renderNavItems();
  const authItems = isLoggedIn
    ? [
        {
          key: "logout",
          label: (
            <Text onClick={logout} style={{ cursor: "pointer" }}>
              <LogoutOutlined /> Logout
            </Text>
          ),
        },
      ]
    : [
        {
          key: "/auth/login",
          label: <NavLink to="/auth/login">Login</NavLink>,
        },
        {
          key: "/auth/register",
          label: <NavLink to="/auth/register">Register</NavLink>,
        },
      ];

  // build menu items
  const menuItems = [
    { key: "/", label: <NavLink to="/">Home</NavLink> },
    ...commonItems,
    ...(!isLoggedIn ? authItems : []),
  ];

  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        transition: "background 0.3s",
        background: darkMode ? "#1f1f1f" : "#fff",
      }}
    >
      <div style={{ flex: "0 0 auto", marginRight: 24 }}>
        {isLoggedIn && authItems.find((i) => i.key === "logout")?.label}
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[currentPath]}
        style={{
          flex: "1 1 auto",
          justifyContent: "center",
          background: "transparent",
          borderBottom: "none",
        }}
        items={menuItems}
      />

      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Switch
          checked={darkMode}
          onChange={(chk) => setDarkMode(chk)}
          checkedChildren={<MoonFilled />}
          unCheckedChildren={<SunFilled />}
        />
      </div>
    </Header>
  );
}

import { NavLink } from "react-router-dom";
import { Layout, Menu, Switch, Typography } from "antd";
import {
  BulbOutlined,
  BulbFilled,
  LogoutOutlined,
  MoonFilled,
  SunFilled,
} from "@ant-design/icons";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";
import { useCallback, useState } from "react";
import { useAuthStore, useUITheme } from "../Store";
import { Role } from "../constants/roles";

const { Header } = Layout;
const { Text } = Typography;

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const role = useAuthStore((s) => s.currentUserRole);
  const logout = useLogout();
  // Zustand store for theme state
  const darkMode = useUITheme((s) => s.darkMode);
  const setDarkMode = useUITheme((s) => s.setDarkMode);

  const renderNavItems = useCallback(() => {
    if (role === Role.Admin) {
      return [
        {
          key: "staff-list",
          label: <NavLink to="/admin/StaffList">Staff</NavLink>,
        },
        {
          key: "driver-list",
          label: <NavLink to="/admin/DriverList">Drivers</NavLink>,
        },
        {
          key: "donor-list",
          label: <NavLink to="/admin/DonorList">Donors</NavLink>,
        },
        { key: "ngo-list", label: <NavLink to="/admin/NGOList">NGOs</NavLink> },
      ];
    }
    return [];
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
        { key: "login", label: <NavLink to="/auth/login">Login</NavLink> },
        {
          key: "register",
          label: <NavLink to="/auth/register">Register</NavLink>,
        },
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
      {/* LEFT: logout or empty spacer */}
      <div style={{ flex: "0 0 auto", marginRight: 24 }}>
        {isLoggedIn && authItems.find((i) => i.key === "logout")?.label}
      </div>

      {/* CENTER: main nav */}
      <Menu
        mode="horizontal"
        selectable={false}
        style={{
          flex: "1 1 auto",
          justifyContent: "center",
          background: "transparent",
          borderBottom: "none",
        }}
        items={[
          { key: "home", label: <NavLink to="/">Home</NavLink> },
          ...commonItems,
        ]}
      />

      {/* RIGHT: login/register OR empty, then theme toggle */}
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {!isLoggedIn &&
          authItems.map((i) => <span key={i.key}>{i.label}</span>)}
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

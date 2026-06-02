import { NavLink, useLocation } from "react-router-dom";
import {
  Badge,
  Button,
  Empty,
  Layout,
  List,
  Menu,
  Popover,
  Segmented,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  LogoutOutlined,
  MoonFilled,
  SunFilled,
} from "@ant-design/icons";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore, useUITheme } from "../Store";
import { Role } from "../constants/roles";
import useAxiosPrivate from "../hooks/usePrivate";

const { Header } = Layout;
const { Text } = Typography;
const NOTIFICATION_PREFERENCE_KEY = "notification-preference";
const URGENT_EVENTS = new Set([
  "order_created",
  "order_cancelled",
  "delivery_failed",
  "donation_available",
]);

const isUrgentNotification = (item: NotificationRecord) =>
  !item.is_read && URGENT_EVENTS.has(item.event_type);

type NotificationPreference = "Urgent" | "Summary" | "Silent";

type NotificationRecord = {
  notification_id: number;
  title: string;
  message: string;
  event_type: string;
  is_read: boolean;
  created_at: string;
};

const getStoredNotificationPreference = (): NotificationPreference => {
  const stored = window.localStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
  if (stored === "Urgent" || stored === "Summary" || stored === "Silent") {
    return stored;
  }
  return "Summary";
};

const getRoleIndicator = (role: Role) => {
  switch (role) {
    case Role.Donor:
      return { color: "green", label: "Donor" };
    case Role.Ngo:
      return { color: "blue", label: "NGO" };
    case Role.Staff:
      return { color: "purple", label: "Staff" };
    case Role.Admin:
      return { color: "red", label: "Admin" };
    case Role.Driver:
      return { color: "orange", label: "Driver" };
    default:
      return null;
  }
};

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const role = useAuthStore((s) => s.currentUserRole);
  const logout = useLogout();
  const darkMode = useUITheme((s) => s.darkMode);
  const setDarkMode = useUITheme((s) => s.setDarkMode);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference>(getStoredNotificationPreference);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // get current path for menu selection
  const location = useLocation();
  const currentPath = location.pathname;

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }

    setNotificationLoading(true);
    try {
      const response =
        await axiosPrivate.get<NotificationRecord[]>("/notifications/");
      setNotifications(response.data);
    } catch {
      message.error("Failed to load notifications");
    } finally {
      setNotificationLoading(false);
    }
  }, [axiosPrivate, isLoggedIn]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await axiosPrivate.patch(`/notifications/${id}/read/`);
        setNotifications((items) =>
          items.map((item) =>
            item.notification_id === id ? { ...item, is_read: true } : item
          )
        );
      } catch {
        message.error("Failed to update notification");
      }
    },
    [axiosPrivate]
  );

  useEffect(() => {
    window.localStorage.setItem(
      NOTIFICATION_PREFERENCE_KEY,
      notificationPreference
    );
  }, [notificationPreference]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (notificationOpen) {
      fetchNotifications();
    }
  }, [fetchNotifications, notificationOpen]);

  const filteredNotifications = useMemo(() => {
    if (notificationPreference !== "Urgent") {
      return notifications;
    }
    return notifications.filter(isUrgentNotification);
  }, [notificationPreference, notifications]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const urgentUnreadCount = notifications.filter(isUrgentNotification).length;
  const notificationBadgeCount =
    notificationPreference === "Silent"
      ? 0
      : notificationPreference === "Urgent"
        ? urgentUnreadCount
        : unreadCount;
  const roleIndicator = getRoleIndicator(role);

  const notificationContent = (
    <div style={{ width: "min(360px, calc(100vw - 32px))" }}>
      <Space
        direction="vertical"
        size={12}
        style={{ width: "100%" }}
      >
        <Segmented<NotificationPreference>
          block
          value={notificationPreference}
          options={["Urgent", "Summary", "Silent"]}
          onChange={(value) => setNotificationPreference(value)}
        />
        <div style={{ maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
          {filteredNotifications.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No notifications"
            />
          ) : (
            <List
              loading={notificationLoading}
              dataSource={filteredNotifications}
              renderItem={(item) => {
                const urgent = isUrgentNotification(item);

                return (
                  <List.Item
                    style={{
                      alignItems: "flex-start",
                      background:
                        notificationPreference !== "Silent" && !item.is_read
                          ? urgent
                            ? darkMode
                              ? "#3a1f1f"
                              : "#fff1f0"
                            : darkMode
                              ? "#1f2937"
                              : "#f6ffed"
                          : "transparent",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 6,
                    }}
                    actions={
                      item.is_read
                        ? []
                        : [
                            <Button
                              aria-label="Mark notification as read"
                              icon={<CheckOutlined />}
                              size="small"
                              type="text"
                              onClick={() => markAsRead(item.notification_id)}
                            />,
                          ]
                    }
                  >
                    <List.Item.Meta
                      title={
                        <Space size={6} wrap>
                          <Text strong={!item.is_read}>{item.title}</Text>
                          {urgent && notificationPreference !== "Silent" && (
                            <Tag color="red">Urgent</Tag>
                          )}
                          {!item.is_read &&
                            notificationPreference !== "Silent" && (
                              <Tag color="green">Unread</Tag>
                            )}
                        </Space>
                      }
                      description={
                        <Space
                          direction="vertical"
                          size={4}
                          style={{ width: "100%" }}
                        >
                          <Text
                            type="secondary"
                            style={{
                              display: "block",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            {item.message}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(item.created_at).toLocaleString()}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Space>
    </div>
  );

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
        {isLoggedIn && (
          <Space size={8} align="center">
            <Popover
              arrow
              open={notificationOpen}
              title="Notifications"
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              onOpenChange={setNotificationOpen}
            >
              <Badge
                count={notificationBadgeCount}
                size="small"
                offset={[-2, 4]}
              >
                <Button
                  aria-label="Notifications"
                  type="text"
                  shape="circle"
                  icon={<BellOutlined />}
                  style={{
                    color: darkMode ? "#fff" : "#1f1f1f",
                  }}
                />
              </Badge>
            </Popover>
            {roleIndicator && <Tag color={roleIndicator.color}>{roleIndicator.label}</Tag>}
          </Space>
        )}
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

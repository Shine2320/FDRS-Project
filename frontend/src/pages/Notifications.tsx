import { useEffect, useState } from "react";
import { Button, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import useAxiosPrivate from "../hooks/usePrivate";

type NotificationRecord = {
  notification_id: number;
  title: string;
  message: string;
  event_type: string;
  is_read: boolean;
  created_at: string;
};

export default function Notifications() {
  const axiosPrivate = useAxiosPrivate();
  const [data, setData] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivate.get<NotificationRecord[]>(
        "/notifications/"
      );
      setData(response.data);
    } catch {
      message.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axiosPrivate.patch(`/notifications/${id}/read/`);
      fetchNotifications();
    } catch {
      message.error("Failed to update notification");
    }
  };

  const columns: ColumnsType<NotificationRecord> = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Message", dataIndex: "message", key: "message" },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "is_read",
      key: "is_read",
      render: (value: boolean) => (value ? "Read" : "Unread"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        record.is_read ? null : (
          <Button onClick={() => markAsRead(record.notification_id)}>
            Mark Read
          </Button>
        ),
    },
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Table
        bordered={true}
        rowKey="notification_id"
        columns={columns}
        dataSource={data}
        loading={loading}
      />
    </div>
  );
}

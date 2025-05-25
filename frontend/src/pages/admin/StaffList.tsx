import React, { useState, useEffect } from "react";
import { Table, Space, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import useAuth from "../../hooks/useAuth";
import useAxiosPrivate from "../../hooks/usePrivate";

interface StaffMember {
  id: number;
  staff_id: string;
  name: string;
  email: string;
  contact_number: string;
  role: string;
  is_active: boolean;
  address: string;
}

const StaffList: React.FC = () => {
  const axiosPrivateInstance = useAxiosPrivate();
  const [loading, setLoading] = useState<boolean>(false);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const { accessToken } = useAuth();

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivateInstance.get("/staff/list/");
      setStaffData(response.data);
    } catch (error) {
      message.error("Failed to fetch staff data");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (record: StaffMember) => {
    try {
      const newStatus = !record.is_active;

      await axiosPrivateInstance.patch(`/${record.id}/update-status/`, {
        is_active: newStatus,
      });
      message.success(
        `Staff ${record.name} is now ${newStatus ? "active" : "disabled"}`
      );
      fetchStaffData(); // Refresh data
    } catch (error) {
      message.error("Failed to update status");
      console.error("Update status error:", error);
    }
  };

  const columns: ColumnsType<StaffMember> = [
    {
      title: "Staff ID",
      dataIndex: "staff_id",
      key: "staff_id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Contact",
      dataIndex: "contact_number",
      key: "contact_number",
    },
    {
      title: "address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive) => (isActive ? "Active" : "Disabled"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type={record.is_active ? "default" : "primary"}
            danger={record.is_active}
            onClick={() => toggleActiveStatus(record)}
          >
            {record.is_active ? "Disable" : "Activate"}
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (accessToken) fetchStaffData();
  }, [accessToken]);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Staff List</h1>
      <Table
        bordered={true}
        columns={columns}
        dataSource={staffData}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} items`,
        }}
      />
    </div>
  );
};

export default StaffList;

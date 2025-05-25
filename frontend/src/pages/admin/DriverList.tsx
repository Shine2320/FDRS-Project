import React, { useState, useEffect } from "react";
import { Table, Space, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import useAuth from "../../hooks/useAuth";
import useAxiosPrivate from "../../hooks/usePrivate";

interface DriverMember {
  id: number;
  driver_id: number;
  name: string;
  email: string;
  contact_number: string;
  address: string;
  vehicle: string;
  role: string;
  is_active: boolean;
}

const DriverList: React.FC<{
  isModal?: boolean;
  assignDriver?: (id: number) => {};
}> = ({ isModal, assignDriver }) => {
  const axiosPrivateInstance = useAxiosPrivate();
  const [loading, setLoading] = useState<boolean>(false);
  const [driverData, setDriverData] = useState<DriverMember[]>([]);
  const { accessToken } = useAuth();
  const baseUrl = "driver";
  const fetchDonorData = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivateInstance.get(`/${baseUrl}/list/`);
      setDriverData(response.data);
    } catch (error) {
      message.error("Failed to fetch driver data");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (record: DriverMember) => {
    try {
      const newStatus = !record.is_active;

      await axiosPrivateInstance.patch(`/${record.id}/update-status/`, {
        is_active: newStatus,
      });
      message.success(
        `Driver ${record.name} is now ${newStatus ? "active" : "disabled"}`
      );
      fetchDonorData(); // Refresh data
    } catch (error) {
      message.error("Failed to update status");
      console.error("Update status error:", error);
    }
  };

  const columns: ColumnsType<DriverMember> = [
    {
      title: "Driver ID",
      dataIndex: "driver_id",
      key: "driver_id",
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
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Vehicle No",
      dataIndex: "vehicle",
      key: "vehicle",
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
          {!isModal ? (
            <Button
              type={record.is_active ? "default" : "primary"}
              danger={record.is_active}
              onClick={() => toggleActiveStatus(record)}
            >
              {record.is_active ? "Disable" : "Activate"}
            </Button>
          ) : (
            <Button
              type={"primary"}
              onClick={() => assignDriver && assignDriver(record.driver_id)}
            >
              Assign
            </Button>
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (accessToken) fetchDonorData();
  }, [accessToken]);

  return (
    <div style={{ padding: isModal ? 5 : 24 }}>
      {!isModal && <h1>Driver List</h1>}
      <Table
        bordered={true}
        columns={columns}
        dataSource={driverData}
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

export default DriverList;

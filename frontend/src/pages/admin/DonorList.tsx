import React, { useState, useEffect } from "react";
import { Table, Space, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import useAuth from "../../hooks/useAuth";
import useAxiosPrivate from "../../hooks/usePrivate";

interface DonorMember {
  id: number;
  donor_id: string;
  name: string;
  email: string;
  contact_number: string;
  address: string;
  role: string;
  is_active: boolean;
}

const DonorList: React.FC = () => {
  const axiosPrivateInstance = useAxiosPrivate();
  const [loading, setLoading] = useState<boolean>(false);
  const [donorData, setDonorData] = useState<DonorMember[]>([]);
  const { accessToken } = useAuth();
  const baseUrl = "donor";
  const fetchDonorData = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivateInstance.get(`/${baseUrl}/list/`);
      setDonorData(response.data);
    } catch (error) {
      message.error("Failed to fetch donor data");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (record: DonorMember) => {
    try {
      const newStatus = !record.is_active;

      await axiosPrivateInstance.patch(`/${record.id}/update-status/`, {
        is_active: newStatus,
      });
      message.success(
        `Donor ${record.name} is now ${newStatus ? "active" : "disabled"}`
      );
      fetchDonorData(); // Refresh data
    } catch (error) {
      message.error("Failed to update status");
      console.error("Update status error:", error);
    }
  };

  const columns: ColumnsType<DonorMember> = [
    {
      title: "Donor ID",
      dataIndex: "donor_id",
      key: "donor_id",
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
    if (accessToken) fetchDonorData();
  }, [accessToken]);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Donor List</h1>
      <Table
        bordered={true}
        columns={columns}
        dataSource={donorData}
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

export default DonorList;

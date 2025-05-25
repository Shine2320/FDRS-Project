// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { Form, Input, Button, message, Card, Typography, Spin } from "antd";
import { Role } from "../constants/roles";
import { useAuthStore } from "../Store";
import useAxiosPrivate from "../hooks/usePrivate";

const { Title } = Typography;

export default function Profile() {
  const axiosPrivateInstance = useAxiosPrivate();
  const [form] = Form.useForm();
  const role = useAuthStore((state) => state.currentUserRole);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchUserData = async () => {
    setFetchLoading(true);
    let response: any;
    try {
      switch (role) {
        case Role.Donor:
          response = await axiosPrivateInstance.get("/donor/");
          break;
        case Role.Ngo:
          response = await axiosPrivateInstance.get("/ngo/");
          break;
        case Role.Driver:
          response = await axiosPrivateInstance.get("/driver/");
          break;
        case Role.Staff:
          response = await axiosPrivateInstance.get("/staff/");
          break;
        default:
          return;
      }
      if (response && response.data.length > 0) {
        const data = response.data[0];
        form.setFieldsValue({
          email: data.email,
          contact_number: data.contact_number.replace(/^\+91/, ""),
          address: data.address,
          ...(role === Role.Donor && { full_name: (data as any).name }),
          ...(role === Role.Ngo && {
            organization_name: (data as any).organization_name,
          }),
          ...(role === Role.Driver && {
            full_name: (data as any).name,
            vehicle_info: (data as any).vehicle,
          }),
          ...(role === Role.Staff && { full_name: (data as any).name }),
        });
      }
    } catch (error) {
      message.error("Failed to fetch user data");
      console.error("Fetch error:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (role !== undefined && role !== null) {
      fetchUserData();
    }
  }, [form, role]);

  const updateProfile = async () => {
    setUpdateLoading(true);
    const payload: any = {
      email: form.getFieldValue("email"),
      contact_number: "+91" + form.getFieldValue("contact_number"),
      address: form.getFieldValue("address"),
      ...(role === Role.Donor && { name: form.getFieldValue("full_name") }),
      ...(role === Role.Ngo && {
        organization_name: form.getFieldValue("organization_name"),
      }),
      ...(role === Role.Driver && {
        name: form.getFieldValue("full_name"),
        vehicle: form.getFieldValue("vehicle_info"),
      }),
      ...(role === Role.Staff && { name: form.getFieldValue("full_name") }),
    };
    try {
      switch (role) {
        case Role.Donor:
          await axiosPrivateInstance.put("/donor/", payload);
          break;
        case Role.Ngo:
          await axiosPrivateInstance.put("/ngo/", payload);
          break;
        case Role.Driver:
          await axiosPrivateInstance.put("/driver/", payload);
          break;
        case Role.Staff:
          await axiosPrivateInstance.put("/staff/", payload);
          break;
        default:
          return;
      }
      message.success("Profile updated");
    } catch (error) {
      message.error("Failed to update profile");
      console.error("Update error:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const onFinish = () => {
    updateProfile();
  };

  if (role == -1) {
    return <div>Please log in first.</div>;
  }

  return (
    <div style={{ height: "75%", display: "flex" }}>
      <Card className="blur-bg" style={{ width: 600, margin: "auto" }}>
        <Title level={3}> Profile</Title>
        {fetchLoading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="email" label="Email" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>

            <Form.Item
              name="contact_number"
              label="Contact Number"
              rules={[{ required: true }]}
            >
              <Input addonBefore="+91" maxLength={10} />
            </Form.Item>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            {role === Role.Donor && (
              <Form.Item
                name="full_name"
                label="Full Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            )}

            {role === Role.Ngo && (
              <Form.Item
                name="organization_name"
                label="Organization Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            )}

            {role === Role.Driver && (
              <>
                <Form.Item
                  name="full_name"
                  label="Full Name"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="vehicle_info"
                  label="Vehicle Code"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </>
            )}

            {role === Role.Staff && (
              <Form.Item
                name="full_name"
                label="Full Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={updateLoading}
              >
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}

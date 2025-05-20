import { useState } from "react";
import {
  Tabs,
  Form,
  Input,
  Button,
  Row,
  Col,
  Card,
  Typography,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ShopOutlined,
  PhoneOutlined,
  HomeOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "../../api/apiConfig";
import { useNavigate } from "react-router-dom";
import type { DonorFields, RegisterFormValues } from "../../types/register";
import { Role } from "../../constants/roles";

const { Title } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterFormValues, userType: Role) => {
    setLoading(true);
    try {
      let payload: any = {
        email: values.email,
        password: values.password,
        role: userType,
      };
      let baseUrl = "";
      switch (userType) {
        case Role.Donor:
          payload.donor = {
            name: (values as DonorFields).full_name,
            contact_number: "+91" + values.contact_number,
            address: (values as DonorFields).address,
          };
          baseUrl = "donor";
          break;
        case Role.Ngo:
          break;
        case Role.Staff:
          break;
        case Role.Driver:
          break;
        default:
          break;
      }
      await axiosInstance.post(baseUrl + "/register/", payload);
      message.success("Registration successful");
      navigate("/auth/login");
    } catch (err) {
      message.error("Registration failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const commonFields = (
    <>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, message: "Please enter your email" }]}
      >
        <Input prefix={<MailOutlined />} />
      </Form.Item>
      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: "Please enter your password" }]}
      >
        <Input.Password prefix={<LockOutlined />} />
      </Form.Item>
      <Form.Item
        name="contact_number"
        label="Contact Number"
        rules={[
          { required: true, message: "Please enter your Phone Number" },
          {
            pattern: /^[6-9]\d{9}$/,
            message: "Enter a valid 10-digit phone number",
          },
        ]}
      >
        <Input
          addonBefore="+91"
          maxLength={10}
          type="number"
          placeholder="Enter 10-digit phone number"
          prefix={<PhoneOutlined />}
        />
      </Form.Item>
    </>
  );

  const donorForm = (
    <Form layout="vertical" onFinish={(v) => handleSubmit(v, Role.Donor)}>
      {commonFields}
      <Form.Item
        name="full_name"
        label="Full Name"
        rules={[{ required: true, message: "Please enter your Full Name" }]}
      >
        <Input prefix={<UserOutlined />} />
      </Form.Item>
      <Form.Item
        name="address"
        label="Address"
        rules={[{ required: true, message: "Please enter your full name" }]}
      >
        <Input prefix={<HomeOutlined />} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Register as Donor
        </Button>
      </Form.Item>
    </Form>
  );

  const ngoForm = (
    <Form layout="vertical" onFinish={(v) => handleSubmit(v, Role.Ngo)}>
      {commonFields}
      <Form.Item
        name="organization_name"
        label="Organization Name"
        rules={[
          { required: true, message: "Please enter your Organization name" },
        ]}
      >
        <Input prefix={<ShopOutlined />} />
      </Form.Item>
      <Form.Item
        name="address"
        label="Address"
        rules={[{ required: true, message: "Please enter your full name" }]}
      >
        <Input prefix={<HomeOutlined />} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Register as NGO
        </Button>
      </Form.Item>
    </Form>
  );

  const staffForm = (
    <Form layout="vertical" onFinish={(v) => handleSubmit(v, Role.Staff)}>
      {commonFields}
      <Form.Item
        name="full_name"
        label="Full Name"
        rules={[{ required: true, message: "Please enter your Full Name" }]}
      >
        <Input prefix={<UserOutlined />} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Register as Staff
        </Button>
      </Form.Item>
    </Form>
  );
  const DriverForm = (
    <Form layout="vertical" onFinish={(v) => handleSubmit(v, Role.Driver)}>
      {commonFields}
      <Form.Item
        name="vehicle_info"
        label="Vehicle Code"
        rules={[{ required: true, message: "Please enter your Vehicle Code" }]}
      >
        <Input prefix={<CarOutlined />} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Register as Driver
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col xs={22} sm={16} md={12} lg={8}>
        <Card>
          <Title level={3} style={{ textAlign: "center" }}>
            Register
          </Title>
          <Tabs defaultActiveKey="1" centered>
            <Tabs.TabPane tab="Donor" key="1">
              {donorForm}
            </Tabs.TabPane>
            <Tabs.TabPane tab="NGO" key="2">
              {ngoForm}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Staff" key="3">
              {staffForm}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Driver" key="4">
              {DriverForm}
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Col>
    </Row>
  );
};

export default Register;

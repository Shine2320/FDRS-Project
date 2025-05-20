import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosInstance } from "../../api/apiConfig";
import useAuth from "../../hooks/useAuth";
import { Form, Input, Button, Typography, Row, Col, Space, Card } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text, Link } = Typography;

export default function Login() {
  const { setAccessToken, setIsLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "auth/token/",
        JSON.stringify(values),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      localStorage.clear();
      localStorage.setItem("refresh_token", response?.data?.refresh);
      setAccessToken(response?.data?.access_token);
      setIsLoggedIn(true);
      setLoading(false);

      navigate(fromLocation, { replace: true });
    } catch (error) {
      setLoading(false);
      console.error("Login failed:", error);
      // Optional: Add AntD message.error for feedback
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col xs={22} sm={16} md={12} lg={8}>
        <Card>
          <Space
            direction="vertical"
            style={{ width: "100%", textAlign: "center" }}
          >
            <LockOutlined style={{ fontSize: 40, color: "#1677ff" }} />
            <Title level={3}>Login</Title>
          </Space>

          <Form
            layout="vertical"
            name="login-form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
          >
            <Form.Item
              label="Email Address"
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Form.Item>

            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
              <Text>
                Don't have an account? <Link href="/register">Register</Link>
              </Text>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}

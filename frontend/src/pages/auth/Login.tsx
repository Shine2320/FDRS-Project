import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosInstance } from "../../api/apiConfig";
import useAuth from "../../hooks/useAuth";
import {
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Space,
  Card,
  Alert,
} from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../Store";

const { Title, Text, Link } = Typography;

export default function Login() {
  const { setAccessToken, setRefreshToken, setIsLoggedIn } = useAuth();
  const setCurrentUserRole = useAuthStore((state) => state.setCurrentUserRole);
  const setCurrentUserName = useAuthStore((state) => state.setCurrentUserName);
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setLoginError(null);
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
      if (response?.data?.access) {
        setLoginError(null);
        const decoded: any = jwtDecode(response.data.access);
        setCurrentUserRole(decoded.role);
        setCurrentUserName(decoded.name);
      }
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("isLoggedIn");
      localStorage.setItem("refresh_token", response?.data?.refresh);
      setAccessToken(response?.data?.access);
      setRefreshToken(response?.data?.refresh);
      setIsLoggedIn(true);
      setLoading(false);

      navigate(fromLocation, { replace: true });
    } catch {
      setLoading(false);
      setLoginError("Invalid email or password. Please try again.");
    }
  };

  return (
    <Row
      justify="center"
      align="middle"
      style={{
        minHeight: "100%",
      }}
    >
      <Col xs={22} sm={16} md={12} lg={8}>
        <Card className="blur-bg">
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
            {loginError && (
              <Alert
                type="error"
                message={loginError}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

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
                Don't have an account? <Link href="/auth/register">Register</Link>
              </Text>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}

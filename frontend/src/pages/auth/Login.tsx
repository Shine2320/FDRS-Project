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
  Modal,
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
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryForm] = Form.useForm();

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

  const handlePasswordReset = async () => {
    setRecoveryLoading(true);
    try {
      const values = await recoveryForm.validateFields();
      await axiosInstance.post("auth/password-reset/", values);
      recoveryForm.resetFields();
      setRecoveryOpen(false);
      setLoginError(null);
      Modal.success({
        title: "Password reset",
        content: "Your password has been reset. You can log in now.",
      });
    } catch (error: any) {
      if (error?.response?.data) {
        recoveryForm.setFields(
          Object.entries(error.response.data).map(([name, errors]) => ({
            name,
            errors: Array.isArray(errors)
              ? errors.map(String)
              : [String(errors)],
          }))
        );
      }
    } finally {
      setRecoveryLoading(false);
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

            <Form.Item style={{ textAlign: "right", marginBottom: 16 }}>
              <Link onClick={() => setRecoveryOpen(true)}>
                Forgot password?
              </Link>
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
      <Modal
        open={recoveryOpen}
        title="Reset password"
        okText="Reset Password"
        confirmLoading={recoveryLoading}
        onOk={handlePasswordReset}
        onCancel={() => {
          recoveryForm.resetFields();
          setRecoveryOpen(false);
        }}
      >
        <Form form={recoveryForm} layout="vertical">
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your email." },
              { type: "email", message: "Please enter a valid email." },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="new_password"
            rules={[
              { required: true, message: "Please enter your new password." },
              { min: 8, message: "Password must be at least 8 characters." },
            ]}
          >
            <Input.Password placeholder="New password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Please confirm your new password." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match."));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm password" />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}

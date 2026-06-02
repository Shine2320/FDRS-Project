import { useEffect, useState } from "react";
import {
  Button,
  Select,
  Row,
  Col,
  Card,
  Spin,
  Typography,
  message,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useAxiosPrivate from "../../hooks/usePrivate";

const { Title, Text } = Typography;

interface InventoryStatus {
  status: number;
  label: string;
  count: number;
}
interface OrderSummary {
  status: number;
  label: string;
  count: number;
}
interface DeliveryEfficiency {
  average_delivery_seconds: number;
}
interface UserActivity {
  role: number;
  label: string;
  orders_count: number;
}
interface ReportBatch {
  batch_key: string;
  generated_at: string;
}

// Color palette for bars
const BAR_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

export default function ReportsDashboard() {
  const axiosPrivate = useAxiosPrivate();
  const [batches, setBatches] = useState<ReportBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const [inventoryData, setInventoryData] = useState<InventoryStatus[]>([]);
  const [orderData, setOrderData] = useState<OrderSummary[]>([]);
  const [deliveryData, setDeliveryData] = useState<DeliveryEfficiency | null>(
    null
  );
  const [userData, setUserData] = useState<UserActivity[]>([]);

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await axiosPrivate.get<ReportBatch[]>(
        "/api/reports/batches/"
      );
      setBatches(res.data);
      if (!selectedBatch && res.data.length)
        setSelectedBatch(res.data[0].batch_key);
    } catch {
      message.error("Failed to load report batches");
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchReports = async (batchKey: string) => {
    setLoadingReports(true);
    try {
      const [inv, ord, del, usr] = await Promise.all([
        axiosPrivate.get<InventoryStatus[]>(
          `/api/reports/${batchKey}/inventory-status/`
        ),
        axiosPrivate.get<OrderSummary[]>(
          `/api/reports/${batchKey}/order-summary/`
        ),
        axiosPrivate.get<DeliveryEfficiency>(
          `/api/reports/${batchKey}/delivery-efficiency/`
        ),
        axiosPrivate.get<UserActivity[]>(
          `/api/reports/${batchKey}/user-activity/`
        ),
      ]);
      setInventoryData(inv.data);
      setOrderData(ord.data);
      setDeliveryData(del.data);
      setUserData(usr.data);
    } catch {
      message.error("Failed to fetch report data");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);
  useEffect(() => {
    if (selectedBatch) fetchReports(selectedBatch);
  }, [selectedBatch]);

  const generateReports = async () => {
    setLoadingReports(true);
    try {
      const res = await axiosPrivate.post<{ batch_key: string }>(
        "/api/reports/generate/"
      );
      message.success("Reports generated");
      await fetchBatches();
      setSelectedBatch(res.data.batch_key);
    } catch {
      message.error("Failed to generate reports");
    } finally {
      setLoadingReports(false);
    }
  };

  const exportReport = async (reportName: string) => {
    if (!selectedBatch) return;
    try {
      const response = await axiosPrivate.get(
        `/api/reports/${selectedBatch}/${reportName}/export/?format=csv`,
        { responseType: "blob" }
      );
      const href = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = href;
      link.download = `${reportName}-${selectedBatch}.csv`;
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      message.error("Failed to export report");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          {loadingBatches ? (
            <Spin />
          ) : batches.length ? (
            <Select
              value={selectedBatch!}
              onChange={setSelectedBatch}
              style={{ width: 240 }}
            >
              {batches.map((b) => (
                <Select.Option key={b.batch_key} value={b.batch_key}>
                  {new Date(b.generated_at).toLocaleString()}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <Text>No reports yet</Text>
          )}
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={generateReports}
            loading={loadingReports}
          >
            {batches.length ? "Regenerate Reports" : "Generate Reports"}
          </Button>
        </Col>
      </Row>

      {loadingReports || (loadingBatches && !batches.length) ? (
        <Spin />
      ) : (
        selectedBatch && (
          <Row gutter={[16, 16]}>
            {/* Inventory Status - Bar Chart */}
            <Col span={12}>
              <Card title="Inventory Status">
                <Button
                  style={{ marginBottom: 12 }}
                  onClick={() => exportReport("inventory-status")}
                >
                  Export CSV
                </Button>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={inventoryData} margin={{ bottom: 20 }}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Count" fill={BAR_COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Order Summary - Bar Chart */}
            <Col span={12}>
              <Card title="Order Summary">
                <Button
                  style={{ marginBottom: 12 }}
                  onClick={() => exportReport("order-summary")}
                >
                  Export CSV
                </Button>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={orderData} margin={{ bottom: 20 }}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Count" fill={BAR_COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Delivery Efficiency - Text Detail */}
            <Col span={12}>
              <Card title="Delivery Efficiency">
                <Button
                  style={{ marginBottom: 12 }}
                  onClick={() => exportReport("delivery-efficiency")}
                >
                  Export CSV
                </Button>
                <Title level={4} style={{ textAlign: "center" }}>
                  Avg Delivery Time:{" "}
                  {deliveryData?.average_delivery_seconds?.toFixed(0) || "--"}{" "}
                  seconds
                </Title>
              </Card>
            </Col>

            {/* User Activity - Bar Chart per NGO */}
            <Col span={12}>
              <Card title="Orders per NGO">
                <Button
                  style={{ marginBottom: 12 }}
                  onClick={() => exportReport("user-activity")}
                >
                  Export CSV
                </Button>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={userData} margin={{ bottom: 20 }}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="orders_count"
                      name="Orders"
                      fill={BAR_COLORS[2]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        )
      )}
    </div>
  );
}

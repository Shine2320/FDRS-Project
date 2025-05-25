import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Select,
  message,
  Space,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useAuthStore } from "../../Store";
import { Role } from "../../constants/roles";
import moment from "moment";
import useAxiosPrivate from "../../hooks/usePrivate";
import { isEmpty } from "lodash-es";
import OrderModal from "../NGO/OrderModal";

// Define TypeScript interfaces for inventory
export interface Inventory {
  inventory_id: number;
  donor_id: number;
  food_type: number;
  item_name: string;
  quantity: number;
  expiration_date: string; // ISO date string
  status: number;
}

const { Option } = Select;
const STATUS_OPTIONS = [
  { value: 0, label: "Available" },
  { value: 1, label: "Reserved" },
  { value: 2, label: "Expired" },
];
const FOOD_TYPES = [
  { value: 0, label: "Packed" },
  { value: 1, label: "Non-packed" },
];

export default function InventoryTable() {
  const axiosPrivateInstance = useAxiosPrivate();
  const [data, setData] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Inventory | null>(null);
  const [form] = Form.useForm();
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [currentInventory, setCurrentInventory] = useState<Inventory | null>(
    null
  );

  // get role from store
  const role = useAuthStore((state) => state.currentUserRole);
  // only allow add/edit for certain roles
  const canModify = [Role.Staff, Role.Donor, Role.Admin].includes(role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await axiosPrivateInstance.get<Inventory[]>(
        "/donor/inventory/"
      );
      setData(resp.data);
      // extract unique food types
    } catch (err) {
      message.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (record?: Inventory) => {
    if (!canModify) return;
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue({
        ...record,
        expiration_date: moment(record.expiration_date),
      });
    } else {
      setEditingRecord(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        expiration_date: values.expiration_date.format("YYYY-MM-DD"),
      };

      // Update local foodTypes if new

      if (editingRecord) {
        await axiosPrivateInstance.put(
          `/donor/inventory/${editingRecord.inventory_id}/`,
          payload
        );
        message.success("Inventory updated");
      } else {
        await axiosPrivateInstance.post("/donor/inventory/", payload);
        message.success("Inventory added");
      }

      setModalVisible(false);
      fetchData();
    } catch (err) {
      // errors are shown by form
    }
  };

  // common columns
  const baseColumns: ColumnsType<Inventory> = [
    {
      title: "ID",
      dataIndex: "inventory_id",
      key: "inventory_id",
      hidden: true,
    },
    {
      title: "Food Type",
      dataIndex: "food_type",
      key: "food_type",
      render: (food_type: number) => {
        const opt = FOOD_TYPES.find((o) => o.value === food_type);
        return opt ? opt.label : food_type;
      },
    },
    { title: "Item Name", dataIndex: "item_name", key: "item_name" },
    { title: "Location", dataIndex: "address", key: "address" },
    { title: "Contact No", dataIndex: "contact_number", key: "contact_number" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Expiration Date",
      dataIndex: "expiration_date",
      key: "expiration_date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: number) => {
        const opt = STATUS_OPTIONS.find((o) => o.value === status);
        return opt ? opt.label : status;
      },
    },
  ];

  // add actions column if user can modify
  const columns: ColumnsType<Inventory> = (() => {
    if (role === Role.Ngo) {
      return [
        ...baseColumns,
        {
          title: "Actions",
          key: "actions",
          render: (_text, record) => (
            <Button
              onClick={() => {
                setCurrentInventory(record);
                setOrderModalVisible(true);
              }}
            >
              Request
            </Button>
          ),
        },
      ];
    }
    if (canModify)
      return [
        ...baseColumns,
        {
          title: "Actions",
          key: "actions",
          render: (_text, record) => (
            <Space>
              <Button type="link" onClick={() => openModal(record)}>
                Edit
              </Button>
            </Space>
          ),
        },
      ];
    else return baseColumns;
  })();

  return (
    <div
      style={{
        height: "100%",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {canModify && (
        <Button
          type="primary"
          style={{ marginBottom: 16, width: "fit-content" }}
          onClick={() => openModal()}
        >
          Add Inventory
        </Button>
      )}

      <Table<Inventory>
        rowKey="inventory_id"
        columns={columns}
        dataSource={data}
        loading={loading}
        size="middle"
        bordered={true}
      />

      <Modal
        title={editingRecord ? "Edit Inventory" : "Add Inventory"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="food_type"
            label="Food Type"
            rules={[
              { required: true, message: "Please select or enter food type" },
            ]}
          >
            <Select>
              {FOOD_TYPES.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="item_name"
            label="Item Name"
            rules={[{ required: true, message: "Please input Item Name" }]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please input quantity" }]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="expiration_date"
            label="Expiration Date"
            rules={[{ required: true, message: "Please select date" }]}
          >
            <DatePicker
              disabledDate={(current) => {
                return current && current < moment().startOf("day");
              }}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            initialValue={0}
            rules={[{ required: true, message: "Please select status" }]}
          >
            {isEmpty(editingRecord) ? (
              <Select disabled>
                {STATUS_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            ) : (
              <Select>
                {STATUS_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        </Form>
      </Modal>
      {currentInventory !== null && (
        <OrderModal
          visible={orderModalVisible}
          inventory={currentInventory}
          onClose={(submitted) => {
            setOrderModalVisible(false);
            if (submitted) {
              fetchData();
            }
            setCurrentInventory(null);
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Modal, Form, InputNumber, message, Input, Select } from "antd";
import type { Inventory } from "../Donor/Inventory";
import useAxiosPrivate from "../../hooks/usePrivate";
import { useAuthStore } from "../../Store";
import { Role } from "../../constants/roles";

type OrderFields = {
  order_id: number;
  inventory_id: number;
  quantity: number;
  item_name: string;
  status: number;
};

type OrderModalProps = {
  visible: boolean;
  inventory: Inventory;
  onClose: (submitted?: boolean) => void;
  orderDetails?: OrderFields;
};

const STATUS_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Approved" },
  { value: 2, label: "Delivered" },
  { value: 3, label: "Cancelled" },
];

export default function OrderModal({
  visible,
  inventory,
  onClose,
  orderDetails,
}: OrderModalProps) {
  const role = useAuthStore((s) => s.currentUserRole);
  const axiosPrivate = useAxiosPrivate();
  const [form] = Form.useForm();

  // Loading state for the OK button
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();

      // Seed initialValues based on whether we're editing or creating
      const initial: Partial<OrderFields> = {
        inventory_id: inventory.inventory_id,
        quantity: 1,
        item_name: inventory.item_name,
        status: 0,
      };
      if (orderDetails) {
        Object.assign(initial, {
          inventory_id: orderDetails.inventory_id,
          quantity: orderDetails.quantity,
          item_name: orderDetails.item_name,
          status: orderDetails.status,
        });
      }

      form.setFieldsValue(initial);
    }
  }, [
    visible,
    inventory.inventory_id,
    inventory.item_name,
    orderDetails,
    form,
  ]);

  const handleOk = async () => {
    setConfirmLoading(true);
    try {
      const { item_name, ...values } = await form.validateFields();

      if (orderDetails) {
        // Edit existing order
        await axiosPrivate.patch(
          `/ngo/orders/${orderDetails.order_id}/`,
          values
        );
        message.success("Order updated successfully");
      } else {
        // Create new order
        await axiosPrivate.post("/ngo/orders/", { ...values, status: 0 });
        message.success("Order created successfully");
      }

      onClose(true);
    } catch (err: any) {
      message.error(
        orderDetails ? "Failed to update order" : "Failed to create order"
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={orderDetails ? "Edit Order" : "Place Order"}
      open={visible}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={() => onClose(false)}
      okText="Submit"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* hidden inventory_id */}
        <Form.Item name="inventory_id" hidden>
          <InputNumber />
        </Form.Item>

        <Form.Item
          name="item_name"
          label="Item Name"
          rules={[{ required: true, message: "Please enter item name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[
            { required: true, message: "Please enter quantity" },
            {
              type: "number",
              min: 1,
              message: "Quantity must be at least 1",
            },
            {
              type: "number",
              max: inventory.quantity,
              message: `Cannot exceed available stock (${inventory.quantity})`,
            },
          ]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        {/* Only Staff/Admin can edit status */}
        {[Role.Staff, Role.Admin].includes(role) && (
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select>
              {STATUS_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

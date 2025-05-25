import { useCallback, useEffect, useState } from "react";
import { Table, Modal, Button, Descriptions, message } from "antd";
import useAxiosPrivate from "../../hooks/usePrivate";
import { useAuthStore } from "../../Store";
import { Role } from "../../constants/roles";
import DriverList from "../admin/DriverList";

type OrderRecord = {
  order_id: number;
  inventory_id: number;
  item_name: string;
  quantity: number;
  created_on: string;
  status: number;
};

type DeliveryDetails = {
  donor_name: string;
  donor_address: string;
  donor_contact: string;
  donor_email: string;
  ngo_name: string;
  ngo_address: string;
  ngo_contact_number: string;
  ngo_email: string;
  driver_name: string;
  driver_vehicle: string;
  driver_contact: string;
  delivery_status: deliveryStatus;
  picked_up_time: string;
  delivery_time: string;
};

const statusMap = {
  0: "Pending",
  1: "Approved",
  2: "Delivered",
  3: "Cancelled",
};
const deliveryStatusMap = {
  0: "Pending",
  1: "In Transit",
  2: "Delivered",
  3: "Failed",
};
enum OrderStatus {
  PENDING = 0,
  APPROVED = 1,
  DELIVERED = 2,
  CANCELLED = 3,
  FAILED = 4,
}
enum deliveryStatus {
  PENDING = 0,
  IN_TRANSIT = 1,
  DELIVERED = 2,
  FAILED = 3,
}

export default function OrderTable() {
  const role = useAuthStore((s) => s.currentUserRole);
  const axiosPrivateInstance = useAxiosPrivate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [deliveryDetails, setDeliveryDetails] =
    useState<DeliveryDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openDrivers, setOpenDrivers] = useState(false);

  const fetchOrders = () => {
    axiosPrivateInstance
      .get("/ngo/orders/")
      .then((res) => setOrders(res.data))
      .catch(() => message.error("Failed to fetch orders."));
  };
  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const openDetails = async (record: OrderRecord) => {
    setLoading(true);
    try {
      const res = await axiosPrivateInstance.get(
        `/ngo/orders/${record.order_id}/`
      );
      setSelectedOrder(record);
      setDeliveryDetails(res.data);
      setIsModalOpen(true);
    } catch {
      message.error("Failed to fetch delivery details.");
    } finally {
      setLoading(false);
    }
  };
  const updateDeliveryStatus = async (status: deliveryStatus) => {
    setLoading(true);
    try {
      await axiosPrivateInstance.patch(
        `/driver/Delivery/${selectedOrder?.order_id}/`,
        { status }
      );
      fetchOrders();
      setIsModalOpen(false);
    } catch {
      message.error("Failed to fetch delivery details.");
    } finally {
      setLoading(false);
    }
  };
  const updateOrderStatus = async (status: number, driverId?: number) => {
    setLoading(true);
    try {
      await axiosPrivateInstance.patch(
        `/ngo/orders/${selectedOrder?.order_id}/`,
        driverId ? { status, driver_id: driverId } : { status }
      );
      fetchOrders();
      setIsModalOpen(false);
      setOpenDrivers(false);
    } catch {
      message.error("Failed to fetch delivery details.");
    } finally {
      setLoading(false);
    }
  };
  const assignDriver = async (driverId: number) => {
    updateOrderStatus(OrderStatus.APPROVED, driverId);
  };

  const ModalButtons = useCallback(() => {
    if (deliveryDetails) {
      if (role == Role.Driver) {
        if (deliveryDetails.delivery_status == deliveryStatus.PENDING) {
          return (
            <Button
              key="pickup"
              type="primary"
              onClick={() => {
                updateDeliveryStatus(deliveryStatus.IN_TRANSIT);
              }}
              loading={loading}
            >
              Picked Up
            </Button>
          );
        } else if (
          deliveryDetails.delivery_status == deliveryStatus.IN_TRANSIT
        ) {
          return (
            <>
              <Button
                key="deliver"
                type="primary"
                onClick={() => {
                  updateDeliveryStatus(deliveryStatus.DELIVERED);
                }}
                loading={loading}
              >
                Delivered
              </Button>
              <Button
                key="close"
                type="primary"
                onClick={() => {
                  updateDeliveryStatus(deliveryStatus.FAILED);
                }}
              >
                Failed
              </Button>
            </>
          );
        }
      } else if (
        selectedOrder?.status == OrderStatus.FAILED ||
        selectedOrder?.status == OrderStatus.DELIVERED ||
        selectedOrder?.status == OrderStatus.APPROVED ||
        selectedOrder?.status == OrderStatus.CANCELLED
      ) {
        return (
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setIsModalOpen(false);
            }}
          >
            Close
          </Button>
        );
      } else if (role == Role.Ngo) {
        if (
          selectedOrder?.status != OrderStatus.CANCELLED &&
          selectedOrder?.status != OrderStatus.FAILED
        ) {
          return (
            <Button
              key="close"
              type="primary"
              onClick={() => {
                updateOrderStatus(OrderStatus.CANCELLED);
              }}
            >
              Cancel Order
            </Button>
          );
        }
      } else if (role == Role.Staff || role == Role.Admin) {
        if (selectedOrder?.status == OrderStatus.PENDING) {
          return (
            <>
              <Button
                key="approve"
                type="primary"
                onClick={() => {
                  setOpenDrivers(true);
                }}
                loading={loading}
              >
                Approve Order
              </Button>{" "}
              <Button
                key="close"
                type="primary"
                onClick={() => {
                  updateOrderStatus(OrderStatus.CANCELLED);
                }}
              >
                Cancel Order
              </Button>
            </>
          );
        } else {
          return <></>;
        }
      }
    } else {
      return <></>;
    }
  }, [deliveryDetails, role, selectedOrder, loading]);
  return (
    <div style={{ padding: 24 }}>
      <Table
        dataSource={orders}
        rowKey="order_id"
        loading={!orders.length}
        columns={[
          {
            title: "Order ID",
            dataIndex: "order_id",
          },
          {
            title: "Item Name",
            dataIndex: "item_name",
          },
          {
            title: "Quantity",
            dataIndex: "quantity",
          },
          {
            title: "Craeted On",
            dataIndex: "created_on",
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (status: number) =>
              statusMap[status as keyof typeof statusMap],
          },
          {
            title: "Action",
            render: (_, record) => (
              <Button onClick={() => openDetails(record)}>Details</Button>
            ),
          },
        ]}
      />

      <Modal
        open={isModalOpen}
        title={openDrivers ? "Assign Driver" : "Order & Delivery Details"}
        onCancel={() => {
          setIsModalOpen(false);
          setOpenDrivers(false);
        }}
        footer={ModalButtons()}
        width={openDrivers ? "auto" : 800}
        confirmLoading={loading}
      >
        {openDrivers ? (
          <DriverList isModal={true} assignDriver={assignDriver} />
        ) : deliveryDetails ? (
          <>
            <Descriptions
              title="Donor Details"
              bordered
              size="small"
              column={2}
            >
              <Descriptions.Item label="Name">
                {deliveryDetails.donor_name}
              </Descriptions.Item>
              <Descriptions.Item label="Contact">
                {deliveryDetails.donor_contact}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {deliveryDetails.donor_email}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {deliveryDetails.donor_address}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="NGO Details"
              bordered
              size="small"
              column={2}
              style={{ marginTop: 24 }}
            >
              <Descriptions.Item label="Name">
                {deliveryDetails.ngo_name}
              </Descriptions.Item>
              <Descriptions.Item label="Contact">
                {deliveryDetails.ngo_contact_number}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {deliveryDetails.ngo_email}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {deliveryDetails.ngo_address}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="Delivery Details"
              bordered
              size="small"
              column={2}
              style={{ marginTop: 24 }}
            >
              <Descriptions.Item label="Driver">
                {deliveryDetails.driver_name}
              </Descriptions.Item>
              <Descriptions.Item label="Vehicle">
                {deliveryDetails.driver_vehicle}
              </Descriptions.Item>
              <Descriptions.Item label="Driver Contact">
                {deliveryDetails.driver_contact}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {
                  deliveryStatusMap[
                    deliveryDetails.delivery_status as keyof typeof deliveryStatusMap
                  ]
                }
              </Descriptions.Item>
              <Descriptions.Item label="Pickup Time">
                {deliveryDetails.picked_up_time}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Time">
                {deliveryDetails.delivery_time}
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <></>
        )}
      </Modal>
    </div>
  );
}

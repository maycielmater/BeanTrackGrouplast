
import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const Order = sequelize.define("Order", {
  orderNumber: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
    field: "order_number"
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM(
      "pending",
      "preparing",
      "ready",
      "completed",
      "cancelled"
    ),
    allowNull: false,
    defaultValue: "pending"
  },
  paymentStatus: {
    type: DataTypes.ENUM("unpaid", "paid", "unknown"),
    allowNull: false,
    defaultValue: "unpaid",
    field: "payment_status"
  },
  stockDeducted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "stock_deducted"
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: "orders"
});

export default Order;

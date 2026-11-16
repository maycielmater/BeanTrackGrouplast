import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const OrderItem = sequelize.define("OrderItem", {
  productName: { type: DataTypes.STRING(120), allowNull: false, field: "product_name" },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "unit_price" },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: "order_items" });

export default OrderItem;
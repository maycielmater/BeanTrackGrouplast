import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const Purchase = sequelize.define("Purchase", {
  referenceNo: { type: DataTypes.STRING(40), allowNull: false, unique: true, field: "reference_no" },
  quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  totalCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "total_cost" },
  status: { type: DataTypes.ENUM("received", "pending"), defaultValue: "received" },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: "purchases" });

export default Purchase;
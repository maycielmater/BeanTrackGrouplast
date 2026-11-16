import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const StockMovement = sequelize.define("StockMovement", {
  movementType: { type: DataTypes.ENUM("in", "out", "adjustment"), allowNull: false, field: "movement_type" },
  quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
  note: { type: DataTypes.STRING(255), allowNull: true }
}, { tableName: "stock_movements" });

export default StockMovement;
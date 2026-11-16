import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const Ingredient = sequelize.define("Ingredient", {
  name: { type: DataTypes.STRING(120), allowNull: false },
  unit: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "pcs" },
  quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
  reorderLevel: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0, field: "reorder_level" },
  costPerUnit: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: "cost_per_unit" }
}, { tableName: "ingredients" });

export default Ingredient;
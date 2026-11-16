import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const Recipe = sequelize.define("Recipe", {
  quantityUsed: { type: DataTypes.DECIMAL(12, 3), allowNull: false, field: "quantity_used" }
}, { tableName: "recipes" });

export default Recipe;
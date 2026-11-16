import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const Product = sequelize.define("Product", {
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  image: { type: DataTypes.STRING, allowNull: true },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true, field: "is_available" }
}, { tableName: "products" });

export default Product;
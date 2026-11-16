import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const Supplier = sequelize.define("Supplier", {
  name: { type: DataTypes.STRING(120), allowNull: false },
  contactPerson: { type: DataTypes.STRING(100), allowNull: true, field: "contact_person" },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: "suppliers" });

export default Supplier;
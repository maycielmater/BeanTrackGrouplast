import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const User = sequelize.define("User", {
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("admin", "customer"), defaultValue: "customer" }
}, { tableName: "users" });

export default User;
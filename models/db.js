import "dotenv/config";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "beantrack",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    define: { underscored: true }
  }
);

export default sequelize;
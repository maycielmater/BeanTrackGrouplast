import User from "./User.js";
import Product from "./Product.js";
import Ingredient from "./Ingredient.js";
import Recipe from "./Recipe.js";
import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import Supplier from "./Supplier.js";
import Purchase from "./Purchase.js";
import StockMovement from "./StockMovement.js";

Product.hasMany(Recipe, { foreignKey: "productId", onDelete: "CASCADE" });
Recipe.belongsTo(Product, { foreignKey: "productId" });
Ingredient.hasMany(Recipe, { foreignKey: "ingredientId", onDelete: "CASCADE" });
Recipe.belongsTo(Ingredient, { foreignKey: "ingredientId" });
Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(Product, { foreignKey: "productId", constraints: false });
Supplier.hasMany(Purchase, { foreignKey: "supplierId" });
Purchase.belongsTo(Supplier, { foreignKey: "supplierId" });
Ingredient.hasMany(Purchase, { foreignKey: "ingredientId" });
Purchase.belongsTo(Ingredient, { foreignKey: "ingredientId" });
Ingredient.hasMany(StockMovement, { foreignKey: "ingredientId" });
StockMovement.belongsTo(Ingredient, { foreignKey: "ingredientId" });

export { User, Product, Ingredient, Recipe, Order, OrderItem, Supplier, Purchase, StockMovement };
import express from "express";
import { showLogin, showRegister, register, login, logout } from "../controllers/authController.js";
import {
  kiosk,
  placeOrder,
  orderConfirmation,
  listOrders,
  updateOrderStatus,
  confirmPayment
} from "../controllers/orderingController.js";import {
  inventoryPage,
  addIngredient,
  adjustStock,
  recipesPage,
  addRecipe,
  deleteRecipe,
  stockMovementPage
} from "../controllers/inventoryController.js";import { purchasingPage, addSupplier, addPurchase } from "../controllers/purchasingController.js";
import { dashboard, productsPage, addProduct, toggleProduct } from "../controllers/dashboardController.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { salesReports } from "../controllers/reportsController.js";

const router = express.Router();

router.get("/", kiosk);
router.get("/kiosk", kiosk);
router.post("/orders", placeOrder);
router.get("/order-confirmation/:id", orderConfirmation);

router.get("/login", showLogin);
router.post("/login", login);
router.get("/register", showRegister);
router.post("/register", register);
router.post("/logout", logout);

router.get("/admin", isAuthenticated, isAdmin, dashboard);
router.get("/products", isAuthenticated, isAdmin, productsPage);
router.post("/products", isAuthenticated, isAdmin, upload.single("image"), addProduct);
router.post("/products/:id/toggle", isAuthenticated, isAdmin, toggleProduct);

router.get("/orders", isAuthenticated, isAdmin, listOrders);
router.post("/orders/:id/status", isAuthenticated, isAdmin, updateOrderStatus);
router.post("/orders/:id/payment", isAuthenticated, isAdmin, confirmPayment);
router.get("/reports", isAuthenticated, isAdmin, salesReports);

router.get("/inventory", isAuthenticated, isAdmin, inventoryPage);
router.post("/inventory", isAuthenticated, isAdmin, addIngredient);
router.post("/inventory/:id/adjust", isAuthenticated, isAdmin, adjustStock);
router.get("/stock-history", isAuthenticated, isAdmin, stockMovementPage);

router.get("/recipes", isAuthenticated, isAdmin, recipesPage);
router.post("/recipes", isAuthenticated, isAdmin, addRecipe);
router.post("/recipes/:id/delete", isAuthenticated, isAdmin, deleteRecipe);

router.get("/purchasing", isAuthenticated, isAdmin, purchasingPage);
router.post("/suppliers", isAuthenticated, isAdmin, addSupplier);
router.post("/purchases", isAuthenticated, isAdmin, addPurchase);

export default router;
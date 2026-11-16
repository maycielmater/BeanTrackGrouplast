
import { Op } from "sequelize";
import sequelize from "../models/db.js";

import Product from "../models/Product.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Recipe from "../models/Recipe.js";
import Ingredient from "../models/Ingredient.js";
import StockMovement from "../models/StockMovement.js";

// ==========================================
// CUSTOMER KIOSK
// ==========================================

export async function kiosk(req, res) {
  try {
    const products = await Product.findAll({
      where: { isAvailable: true },
      order: [["name", "ASC"]]
    });

    res.render("kiosk", {
      title: "Order coffee",
      products,
      notice: req.session.notice
    });

    delete req.session.notice;
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load products.");
  }
}

// ==========================================
// PLACE CUSTOMER ORDER
// NO STOCK DEDUCTION YET
// ==========================================

export async function placeOrder(req, res) {
  const quantities = req.body.quantity || {};

  const selectedItems = Object.entries(quantities)
    .map(([key, quantity]) => ({
      id: key.replace("product_", ""),
      quantity: Number(quantity)
    }))
    .filter(item => item.quantity > 0);

  if (!selectedItems.length) {
    req.session.notice = "Please select at least one product.";
    return res.redirect("/kiosk");
  }

  if (selectedItems.some(item =>
    !/^\d+$/.test(item.id) ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > 20
  )) {
    req.session.notice = "Please enter a valid quantity between 1 and 20.";
    return res.redirect("/kiosk");
  }

  const transaction = await sequelize.transaction();

  try {
    const ids = selectedItems.map(item => Number(item.id));

    const products = await Product.findAll({
      where: {
        id: { [Op.in]: ids },
        isAvailable: true
      },
      transaction
    });

    if (products.length !== ids.length) {
      throw new Error("One or more products are unavailable.");
    }

    let total = 0;

    const order = await Order.create({
      orderNumber: `BT-${Date.now()}`,
      customerName: (req.body.customerName || "Walk-in Customer")
        .trim()
        .slice(0, 100),
      status: "pending",
      paymentStatus: "unpaid",
      stockDeducted: false
    }, { transaction });

    for (const product of products) {
      const selected = selectedItems.find(
        item => Number(item.id) === Number(product.id)
      );

      if (!selected) continue;

      const subtotal = Number(product.price) * selected.quantity;
      total += subtotal;

      await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        quantity: selected.quantity,
        unitPrice: product.price,
        subtotal
      }, { transaction });
    }

    order.total = total;
    await order.save({ transaction });

    await transaction.commit();

    return res.redirect(`/order-confirmation/${order.id}`);

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error(error);
    req.session.notice = error.message || "Unable to place order.";
    return res.redirect("/kiosk");
  }
}

// ==========================================
// CUSTOMER ORDER CONFIRMATION
// ==========================================

export async function orderConfirmation(req, res) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [OrderItem]
    });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    res.render("order-confirmation", {
      title: "Order Confirmation",
      order
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load order confirmation.");
  }
}

// ==========================================
// ADMIN ORDER MANAGEMENT
// ==========================================

export async function listOrders(req, res) {
  try {
    const orders = await Order.findAll({
      include: [OrderItem],
      order: [["createdAt", "DESC"]],
      limit: 100
    });

    res.render("orders", {
      title: "Orders",
      orders,
      notice: req.session.notice
    });

    delete req.session.notice;

  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load orders.");
  }
}

// ==========================================
// CASHIER CONFIRMS PAYMENT
// DEDUCT INGREDIENTS ONLY ONCE
// ==========================================

export async function confirmPayment(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "cancelled") {
      throw new Error("Cannot pay a cancelled order.");
    }

    if (order.paymentStatus === "paid") {
      throw new Error("This order is already marked as paid.");
    }

    // Deduct ingredients only if not yet deducted.
    if (!order.stockDeducted) {
      const items = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction
      });

      const requiredIngredients = new Map();

      for (const item of items) {
        const recipes = await Recipe.findAll({
          where: { productId: item.productId },
          transaction
        });

        for (const recipe of recipes) {
          const needed =
            Number(recipe.quantityUsed) * Number(item.quantity);

          const ingredientId = Number(recipe.ingredientId);

          requiredIngredients.set(
            ingredientId,
            (requiredIngredients.get(ingredientId) || 0) + needed
          );
        }
      }

      // Check all ingredient stocks first.
      const ingredientsToDeduct = [];

      for (const [ingredientId, needed] of requiredIngredients) {
        const ingredient = await Ingredient.findByPk(ingredientId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!ingredient) {
          throw new Error("An ingredient in the recipe was not found.");
        }

        if (Number(ingredient.quantity) < needed) {
          throw new Error(`Insufficient stock for ${ingredient.name}.`);
        }

        ingredientsToDeduct.push({ ingredient, needed });
      }

      // Deduct after all stock checks pass.
      for (const { ingredient, needed } of ingredientsToDeduct) {
        ingredient.quantity = Number(ingredient.quantity) - needed;
        await ingredient.save({ transaction });

        await StockMovement.create({
          ingredientId: ingredient.id,
          movementType: "out",
          quantity: needed,
          note: `Used for order ${order.orderNumber}`
        }, { transaction });
      }

      order.stockDeducted = true;
    }

    order.paymentStatus = "paid";
    order.status = "preparing";

    await order.save({ transaction });
    await transaction.commit();

    req.session.notice =
      "Payment confirmed. Order is now being prepared.";

    return res.redirect("/orders");

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error(error);
    req.session.notice = error.message || "Unable to confirm payment.";

    return res.redirect("/orders");
  }
}

// ==========================================
// UPDATE ORDER STATUS AND CANCEL ORDER
// ==========================================

export async function updateOrderStatus(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const allowedStatuses = [
      "ready",
      "completed",
      "cancelled"
    ];

    const newStatus = req.body.status;

    if (!allowedStatuses.includes(newStatus)) {
      throw new Error("Invalid order status.");
    }

    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "cancelled") {
      throw new Error("This order has already been cancelled.");
    }

    if (newStatus !== "cancelled") {
      if (order.paymentStatus !== "paid") {
        throw new Error("Payment must be confirmed first.");
      }

      if (
        newStatus === "ready" &&
        order.status !== "preparing"
      ) {
        throw new Error("Only preparing orders can be marked ready.");
      }

      if (
        newStatus === "completed" &&
        order.status !== "ready"
      ) {
        throw new Error("Only ready orders can be completed.");
      }
    }

    // Restore stock only if it was previously deducted.
    if (newStatus === "cancelled" && order.stockDeducted) {
      const movements = await StockMovement.findAll({
        where: {
          movementType: "out",
          note: `Used for order ${order.orderNumber}`
        },
        transaction
      });

      for (const movement of movements) {
        const ingredient = await Ingredient.findByPk(
          movement.ingredientId,
          {
            transaction,
            lock: transaction.LOCK.UPDATE
          }
        );

        if (!ingredient) {
          throw new Error("An ingredient from this order was not found.");
        }

        const restoredQuantity = Number(movement.quantity);

        ingredient.quantity =
          Number(ingredient.quantity) + restoredQuantity;

        await ingredient.save({ transaction });

        await StockMovement.create({
          ingredientId: ingredient.id,
          movementType: "in",
          quantity: restoredQuantity,
          note: `Restored for cancelled order ${order.orderNumber}`
        }, { transaction });
      }

      order.stockDeducted = false;
    }

    order.status = newStatus;
    await order.save({ transaction });

    await transaction.commit();

    req.session.notice =
      newStatus === "cancelled"
        ? "Order cancelled. Deducted ingredients have been restored."
        : "Order status updated successfully.";

    return res.redirect("/orders");

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error(error);
    req.session.notice = error.message || "Unable to update order status.";

    return res.redirect("/orders");
  }
}

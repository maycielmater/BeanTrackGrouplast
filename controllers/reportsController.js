import { Op } from "sequelize";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";

export async function salesReports(req, res) {
  const now = new Date();

  // Start of today
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // Start of this week (Monday)
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceMonday
  );

  // Start of this month
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  // Only paid orders that are not cancelled
  const orders = await Order.findAll({
    where: {
      paymentStatus: "paid",
      status: {
        [Op.ne]: "cancelled"
      }
    },
    attributes: ["id", "total", "status", "createdAt"],
    raw: true
  });

  const getOrdersSince = (startDate) =>
    orders.filter(order => new Date(order.createdAt) >= startDate);

  const dailyOrders = getOrdersSince(startOfDay);
  const weeklyOrders = getOrdersSince(startOfWeek);
  const monthlyOrders = getOrdersSince(startOfMonth);

  const getSales = (orderList) =>
    orderList.reduce(
      (total, order) => total + Number(order.total),
      0
    );

  // Get order items for eligible paid orders
  const orderIds = orders.map(order => order.id);

  const orderItems = orderIds.length
    ? await OrderItem.findAll({
        where: {
          orderId: {
            [Op.in]: orderIds
          }
        },
        raw: true
      })
    : [];

  // Top-selling products this month
  const monthlyOrderIds = new Set(
    monthlyOrders.map(order => order.id)
  );

  const productSales = {};

  for (const item of orderItems) {
    if (!monthlyOrderIds.has(item.orderId)) continue;

    const name = item.productName;
    productSales[name] = (productSales[name] || 0) + Number(item.quantity);
  }

  const bestSellingProducts = Object.entries(productSales)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const completedOrders = monthlyOrders.filter(
    order => order.status === "completed"
  ).length;

  const formatMoney = amount =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP"
    }).format(amount);

  res.render("reports", {
    title: "Sales Reports",
    dailySales: formatMoney(getSales(dailyOrders)),
    weeklySales: formatMoney(getSales(weeklyOrders)),
    monthlySales: formatMoney(getSales(monthlyOrders)),
    dailyOrderCount: dailyOrders.length,
    weeklyOrderCount: weeklyOrders.length,
    monthlyOrderCount: monthlyOrders.length,
    completedOrders,
    bestSellingProducts
  });
}

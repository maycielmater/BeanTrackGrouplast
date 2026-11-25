
import Product from "../models/Product.js";
import Ingredient from "../models/Ingredient.js";
import Order from "../models/Order.js";
import Purchase from "../models/Purchase.js";

export async function dashboard(req, res) {
  const [
    productCount,
    ingredientCount,
    orderCount,
    purchaseCount,
    ingredients
  ] = await Promise.all([
    Product.count(),
    Ingredient.count(),
    Order.count(),
    Purchase.count(),
    Ingredient.findAll({
      order: [["name", "ASC"]]
    })
  ]);

  const outOfStock = ingredients.filter(
    i => Number(i.quantity) <= 0
  );

  const lowStock = ingredients.filter(
    i =>
      Number(i.quantity) > 0 &&
      Number(i.quantity) <= Number(i.reorderLevel)
  );

  res.render("dashboard", {
    title: "Admin dashboard",
    productCount,
    ingredientCount,
    orderCount,
    purchaseCount,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStock: lowStock.slice(0, 8),
    outOfStock: outOfStock.slice(0, 8)
  });
}

export async function productsPage(req, res) {
  const products = await Product.findAll({
    order: [["createdAt", "DESC"]]
  });

  res.render("products", {
    title: "Products",
    products
  });
}

export async function addProduct(req, res) {
  const { name, description, price, category } = req.body;

  const allowedCategories = [
    "Coffee",
    "Non-Coffee",
    "Milk Tea",
    "Cookies",
    "Snacks"
  ];

  if (
    !name ||
    !(Number(price) >= 0) ||
    !allowedCategories.includes(category)
  ) {
    req.session.notice = "Enter a product name, valid price, and category.";
    return res.redirect("/products");
  }

  await Product.create({
    name,
    description,
    category,
    price,
    image: req.file ? `/uploads/${req.file.filename}` : null
  });

  req.session.notice = "Product added successfully.";
  res.redirect("/products");
}
export async function toggleProduct(req, res) {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return res.status(404).send("Product not found.");
  }

  product.isAvailable = !product.isAvailable;
  await product.save();

  req.session.notice = "Product availability updated.";
  res.redirect("/products");
}

import Supplier from "../models/Supplier.js";
import Ingredient from "../models/Ingredient.js";
import Purchase from "../models/Purchase.js";
import StockMovement from "../models/StockMovement.js";
import sequelize from "../models/db.js";

export async function purchasingPage(req, res) {
  const [suppliers, ingredients, purchases] = await Promise.all([
    Supplier.findAll({ order: [["name", "ASC"]] }),
    Ingredient.findAll({ order: [["name", "ASC"]] }),
    Purchase.findAll({ include: [Supplier, Ingredient], order: [["createdAt", "DESC"]], limit: 100 })
  ]);
  res.render("purchasing", { title: "Purchasing", suppliers, ingredients, purchases });
}
export async function addSupplier(req, res) {
  const { name, contactPerson, phone, email, address } = req.body;
  if (!name) { req.session.notice = "Supplier name is required."; return res.redirect("/purchasing"); }
  await Supplier.create({ name, contactPerson, phone, email, address });
  req.session.notice = "Supplier added.";
  res.redirect("/purchasing");
}
export async function addPurchase(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { supplierId, ingredientId, quantity, totalCost, notes } = req.body;
    const qty = Number(quantity);
    const cost = Number(totalCost);
    if (!(qty > 0) || !(cost >= 0)) throw new Error("Enter a valid quantity and total cost.");
    const ingredient = await Ingredient.findByPk(ingredientId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!ingredient) throw new Error("Ingredient not found.");
    const purchase = await Purchase.create({
      referenceNo: `PO-${Date.now()}`, supplierId: supplierId || null, ingredientId,
      quantity: qty, totalCost: cost, notes, status: "received"
    }, { transaction });
    ingredient.quantity = Number(ingredient.quantity) + qty;
    await ingredient.save({ transaction });
    await StockMovement.create({
      ingredientId, movementType: "in", quantity: qty,
      note: `Purchase ${purchase.referenceNo}`
    }, { transaction });
    await transaction.commit();
    req.session.notice = "Purchase recorded and inventory stock updated.";
    res.redirect("/purchasing");
  } catch (error) {
    await transaction.rollback();
    req.session.notice = error.message || "Unable to record purchase.";
    res.redirect("/purchasing");
  }
}
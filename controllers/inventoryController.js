
import { Op } from "sequelize";
import sequelize from "../models/db.js";
import Ingredient from "../models/Ingredient.js";
import Product from "../models/Product.js";
import Recipe from "../models/Recipe.js";
import StockMovement from "../models/StockMovement.js";

// INVENTORY PAGE
export async function inventoryPage(req, res) {
  const ingredients = await Ingredient.findAll({
    order: [["name", "ASC"]]
  });

  const updatedIngredients = ingredients.map(ingredient => {
    const quantity = Number(ingredient.quantity);
    const reorderLevel = Number(ingredient.reorderLevel);

    let stockStatus = "In Stock";

    if (quantity <= 0) {
      stockStatus = "Out of Stock";
    } else if (quantity <= reorderLevel) {
      stockStatus = "Low Stock";
    }

    ingredient.stockStatus = stockStatus;
    return ingredient;
  });

  res.render("inventory", {
    title: "Inventory",
    ingredients: updatedIngredients
  });
}

// ADD INGREDIENT
export async function addIngredient(req, res) {
  try {
    const {
      name,
      unit,
      quantity,
      reorderLevel,
      costPerUnit
    } = req.body;

    const ingredientName = String(name || "").trim();
    const ingredientUnit = String(unit || "").trim() || "pcs";

    const openingQuantity = Number(quantity);
    const reorder = Number(reorderLevel ?? 0);
    const cost = Number(costPerUnit ?? 0);

    if (
      !ingredientName ||
      !Number.isFinite(openingQuantity) ||
      openingQuantity < 0 ||
      !Number.isFinite(reorder) ||
      reorder < 0 ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      req.session.notice = "Please enter valid ingredient information.";
      return res.redirect("/inventory");
    }

    if (ingredientName.length > 120 || ingredientUnit.length > 30) {
      req.session.notice = "Ingredient name or unit is too long.";
      return res.redirect("/inventory");
    }

    const existingIngredient = await Ingredient.findOne({
      where: {
        name: {
          [Op.eq]: ingredientName
        }
      }
    });

    if (existingIngredient) {
      req.session.notice = "This ingredient already exists.";
      return res.redirect("/inventory");
    }

    await sequelize.transaction(async (transaction) => {
      const ingredient = await Ingredient.create({
        name: ingredientName,
        unit: ingredientUnit,
        quantity: openingQuantity,
        reorderLevel: reorder,
        costPerUnit: cost
      }, { transaction });

      if (openingQuantity > 0) {
        await StockMovement.create({
          ingredientId: ingredient.id,
          movementType: "in",
          quantity: openingQuantity,
          note: "Initial stock"
        }, { transaction });
      }
    });

    req.session.notice = "Ingredient added successfully.";

  } catch (error) {
    console.error("Add ingredient error:", error);
    req.session.notice = "Unable to add ingredient. Please try again.";
  }

  res.redirect("/inventory");
}

// ADJUST STOCK
export async function adjustStock(req, res) {
  try {
    const amount = Number(req.body.quantity);
    const type = req.body.movementType;
    const note = String(req.body.note || "").trim();

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !["in", "out"].includes(type)
    ) {
      req.session.notice = "Please enter a valid stock quantity and movement type.";
      return res.redirect("/inventory");
    }

    if (note.length > 255) {
      req.session.notice = "Stock adjustment note must not exceed 255 characters.";
      return res.redirect("/inventory");
    }

    await sequelize.transaction(async (transaction) => {
      const ingredient = await Ingredient.findByPk(
        req.params.id,
        { transaction, lock: transaction.LOCK.UPDATE }
      );

      if (!ingredient) {
        throw new Error("INGREDIENT_NOT_FOUND");
      }

      const currentQuantity = Number(ingredient.quantity);

      if (type === "out" && currentQuantity < amount) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const newQuantity = type === "in"
        ? currentQuantity + amount
        : currentQuantity - amount;

      ingredient.quantity = newQuantity;

      await ingredient.save({ transaction });

      await StockMovement.create({
        ingredientId: ingredient.id,
        movementType: type,
        quantity: amount,
        note: note || "Manual stock adjustment"
      }, { transaction });
    });

    req.session.notice = "Stock updated successfully.";

  } catch (error) {
    console.error("Stock adjustment error:", error);

    if (error.message === "INGREDIENT_NOT_FOUND") {
      return res.status(404).send("Ingredient not found.");
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      req.session.notice = "Not enough stock for this deduction.";
    } else {
      req.session.notice = "Unable to update stock. Please try again.";
    }
  }

  res.redirect("/inventory");
}

// PRODUCT RECIPES PAGE
export async function recipesPage(req, res) {
  const products = await Product.findAll({
    include: [{
      model: Recipe,
      include: [Ingredient]
    }],
    order: [["name", "ASC"]]
  });

  const ingredients = await Ingredient.findAll({
    order: [["name", "ASC"]]
  });

  res.render("recipes", {
    title: "Product recipes",
    products,
    ingredients
  });
}

// ADD RECIPE INGREDIENT
export async function addRecipe(req, res) {
  try {
    const productId = Number(req.body.productId);
    const ingredientId = Number(req.body.ingredientId);
    const quantityUsed = Number(req.body.quantityUsed);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(ingredientId) ||
      ingredientId <= 0 ||
      !Number.isFinite(quantityUsed) ||
      quantityUsed <= 0
    ) {
      req.session.notice = "Please enter valid recipe information.";
      return res.redirect("/recipes");
    }

    const product = await Product.findByPk(productId);
    const ingredient = await Ingredient.findByPk(ingredientId);

    if (!product || !ingredient) {
      req.session.notice = "Selected product or ingredient does not exist.";
      return res.redirect("/recipes");
    }

    const existingRecipe = await Recipe.findOne({
      where: {
        productId,
        ingredientId
      }
    });

    if (existingRecipe) {
      req.session.notice = "This ingredient is already included in the product recipe.";
      return res.redirect("/recipes");
    }

    await Recipe.create({
      productId,
      ingredientId,
      quantityUsed
    });

    req.session.notice = "Recipe ingredient added successfully.";

  } catch (error) {
    console.error("Add recipe error:", error);
    req.session.notice = "Unable to add recipe ingredient.";
  }

  res.redirect("/recipes");
}

// DELETE RECIPE INGREDIENT
export async function deleteRecipe(req, res) {
  try {
    const recipe = await Recipe.findByPk(req.params.id);

    if (!recipe) {
      req.session.notice = "Recipe entry not found.";
      return res.redirect("/recipes");
    }

    await recipe.destroy();

    req.session.notice = "Recipe ingredient removed successfully.";

  } catch (error) {
    console.error("Delete recipe error:", error);
    req.session.notice = "Unable to remove recipe ingredient.";
  }

  res.redirect("/recipes");
}


// STOCK MOVEMENT HISTORY
export async function stockMovementPage(req, res) {
  try {
    const movements = await StockMovement.findAll({
      include: [{
        model: Ingredient,
        attributes: ["name", "unit"]
      }],
      order: [["createdAt", "DESC"]],
      limit: 100
    });

    res.render("stock-history", {
      title: "Stock Movement History",
      movements
    });

  } catch (error) {
    console.error("Stock history error:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Unable to load stock movement history."
    });
  }
}

import { Router } from "express";

import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
  patchRecipe,
} from "../state/database.js";
import { sendError } from "../utils/http.js";
import type { RecipeInput } from "../types/domain.js";

export const recipesRouter = Router();

recipesRouter.get("/recipes", (_req, res) => {
  res.json({ recipes: listRecipes() });
});

recipesRouter.post("/recipes", (req, res) => {
  const body = req.body as RecipeInput;
  if (!body?.name || !body?.base) {
    return sendError(res, 422, {
      error: "VALIDATION_ERROR",
      details: {
        name: body?.name ? undefined : "NAME_REQUIRED",
        base: body?.base ? undefined : "BASE_REQUIRED",
      },
    });
  }
  const recipe = createRecipe({
    name: body.name,
    base: body.base,
    additions: body.additions ?? [],
    season: body.season ?? null,
    tastingNotes: body.tastingNotes ?? null,
  });
  res
    .status(201)
    .location(`/recipes/${recipe.slug}`)
    .json(recipe);
});

recipesRouter.get("/recipes/:slug", (req, res) => {
  const recipe = getRecipe(req.params.slug);
  if (!recipe) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: "Recipe not found" });
  }
  res.json(recipe);
});

recipesRouter.patch("/recipes/:slug", (req, res) => {
  try {
    const recipe = patchRecipe(req.params.slug, req.body ?? {});
    if (!recipe) {
      return sendError(res, 404, { error: "NOT_FOUND", reason: "Recipe not found" });
    }
    res.json(recipe);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("unsupported_property")) {
      const [, property] = error.message.split(":");
      return sendError(res, 400, { error: "UNSUPPORTED_KEY", reason: property ?? "unknown" });
    }
    throw error;
  }
});

recipesRouter.delete("/recipes/:slug", (req, res) => {
  const removed = deleteRecipe(req.params.slug);
  if (!removed) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: "Recipe not found" });
  }
  res.status(204).send();
});

import { Router } from "express";
import { HistoryModel } from "../models/history.js";
import { CreateTaskHistorySchema } from "common";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const data = CreateTaskHistorySchema.parse(req.body);
    const created = await HistoryModel.create(data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

/**
 * @param {CreateTaskHistorySchema} req
 * @param {import('express').Response} res
 */
router.put("/:historyId", async (req, res, next) => {
  try {
    const historyId = Number(req.params.historyId);
    const { statusId } = req.body;
    if (isNaN(historyId) || typeof statusId !== "number") {
      return res.status(400).json({ error: "Invalid historyId or statusId" });
    }
    const updated = await HistoryModel.update(historyId, statusId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;

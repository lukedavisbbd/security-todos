import express from "express";
import { statusService } from "../services/status-service.js";
import { z } from "zod";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const statuses = await statusService.getAllStatuses();
    res.json(statuses);
  } catch (error) {
    console.error("Error getting all statuses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = await statusService.getStatusById(id);
    if (!status) {
      res.status(404).json({ message: "Status not found" });
    } else {
      res.json(status);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newStatus = await statusService.createStatus(req.body);
    res.status(201).json(newStatus);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(500).json({ message: "Internal server error" });
      console.log("Error creating status:", error);
    }
  }
});

export default router;

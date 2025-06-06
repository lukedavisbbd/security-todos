import express from "express";
import { statusService } from "../services/status-service.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Apply rate limiting to all status routes
const statusRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests, please try again later." },
});

router.use(statusRateLimiter);

router.get("/", async (req, res, next) => {
  try {
    const statuses = await statusService.getAllStatuses();
    res.json(statuses);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = await statusService.getStatusById(id);

    if (!status) {
      res.status(404).json({ message: "Status not found" });
    } else {
      res.json(status);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const newStatus = await statusService.createStatus(req.body);
    res.status(201).json(newStatus);
  } catch (error) {
    next(error);
  }
});

export default router;

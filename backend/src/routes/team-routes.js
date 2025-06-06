import express from "express";
import { teamService } from "../services/team-service.js";
import rateLimit from "express-rate-limit";
import { authenticated } from "../middleware/auth-middleware.js";
import { AppError } from "common";

const router = express.Router();

// Apply rate limiting to all team routes
const teamRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests, please try again later." },
});

router.use(authenticated);
router.use(teamRateLimiter);


router.get("/", async (req, res, next) => {
  try {
    const teams = await teamService.getAllTeams();
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

// Get teams owned by the current user
router.get("/my-teams", async (req, res, next) => {
  try {
    const userId = req.jwtContents.user.userId;
    const teams = await teamService.getTeamsByOwnerId(userId);
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const team = await teamService.getTeamById(id);

    if (!team) {
      res.status(404).json({ message: "Team not found" });
    } else {
      res.json(team);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @param {import('../index.js').AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
router.post("/", async (req, res, next) => {
  try {
    const userId = req.jwtContents.user.userId;
    const teamData = {
      ...req.body,
      teamOwnerId: userId,
    };

    const newTeam = await teamService.createTeam(teamData);
    res.status(201).json(newTeam);
  } catch (error) {
    next(error);
  }
});


router.patch("/:id", async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { teamName } = req.body;
    const userId = req.jwtContents.user.userId;

    if (!teamName) {
      throw new AppError("Team name is required", 'bad_request', 400);
    }

    const updatedTeam = await teamService.updateTeamName(
      teamId,
      teamName,
      userId
    );
    res.json(updatedTeam);
  } catch (error) {
      next(error);
    }
});

export default router;

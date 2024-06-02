import { Router } from "express";
import { healthcheck } from "../api/healthcheck.controller.js";


const router=Router()

router.route("/").get(healthcheck)

export default router
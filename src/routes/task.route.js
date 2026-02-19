import { createtask, getTasks, updatetasks, deletetasks } from "../controllers/task.controller.js";
import express from 'express';
import upload from '../middleware/upload.middleware.js';
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();


router.use(protect);
router.route('/create').post(upload.array('attachment', 5), createtask);
router.route('/gettasks').get(getTasks);
router.route('/updatetasks/:id').patch(updatetasks);
router.route('/deletetasks/:id').delete(deletetasks);
export default router;
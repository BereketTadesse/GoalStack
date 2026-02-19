import {createtask,getTasks,updatetasks,deletetasks} from "../controllers/task.controller.js";
import express from 'express';
import upload from '../middleware/upload.middleware.js';
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();


router.use(protect);
router.route('/create').post(protect,upload.array('attachment',5),createtask);
router.route('/gettasks').get(protect,getTasks);
router.route('/updatetasks/:id').patch(protect,updatetasks);
router.route('/deletetasks/:id').delete(protect,deletetasks);
export default router;
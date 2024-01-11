import express from 'express';
import { xlxsController } from 'controllers/admin';

const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({});

const upload = multer({ storage });

router.post('/xlsx', upload.single('xlsxFile'), xlxsController.uploadxlsx);

module.exports = router;

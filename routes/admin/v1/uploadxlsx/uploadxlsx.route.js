import express from 'express';
import { xlxsController } from 'controllers/admin';

const router = express.Router();
const multer = require('multer');

const upload = multer();

router.post('/xlsx', upload.single('uploaded_file'), xlxsController.uploadxlsx);

module.exports = router;

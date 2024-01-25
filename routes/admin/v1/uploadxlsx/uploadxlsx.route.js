import express from 'express';
import { xlxsController } from 'controllers/admin';
import auth from '../../../../middlewares/auth';

const router = express.Router();
const multer = require('multer');

const upload = multer();

router.post('/xlsx', auth('admin'), upload.single('uploaded_file'), xlxsController.uploadxlsx);

module.exports = router;

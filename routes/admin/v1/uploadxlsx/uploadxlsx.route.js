import express from 'express';
import { xlxsController } from 'controllers/admin';
import auth from '../../../../middlewares/auth';

const router = express.Router();
const multer = require('multer');

const upload = multer();

router.post('/xlsx', auth(['admin']), upload.single('uploaded_file'), xlxsController.uploadxlsx);

router.post('/upload-vendors', auth(['admin']), xlxsController.uploadVendors);

router.post('/send-mail-xlsx', xlxsController.sendFromXlsx);

router.get('/email-campaigns', xlxsController.getAllCampaigns);

router.get('/email-campaigns/:id', xlxsController.getCampaignById);

router.post('/send-mail-all-users', xlxsController.sendMailToAllUsers);

module.exports = router;

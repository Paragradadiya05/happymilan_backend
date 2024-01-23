import express from 'express';
import { searchController } from 'controllers/user';
import auth from 'middlewares/auth';
import { searchValidation } from '../../../../validations/user';
import validate from '../../../../middlewares/validate';

const router = express();

router.get('/getbyage', auth(), validate(searchValidation.searchAge), searchController.getByAge);

module.exports = router;

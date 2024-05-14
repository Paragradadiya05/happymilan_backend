import express from 'express';
import { searchController } from 'controllers/user';
import auth from 'middlewares/auth';
import validate from 'middlewares/validate';
import { searchValidation } from 'validations/user';

const router = express();

router.post('/search-user', auth(), validate(searchValidation.searchUser), searchController.searchUser);

module.exports = router;

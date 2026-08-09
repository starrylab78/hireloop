import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';

const router = Router();

router.get('/:slug', companyController.getCompanyProfile);

export default router;

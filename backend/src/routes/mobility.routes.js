const { Router } = require('express');
const { mobilitySearchController } = require('../controllers');
const { validateQuery, mobilitySearchSchema } = require('../middleware/validation');

const router = Router();

router.get(
  '/mobility/options/search',
  validateQuery(mobilitySearchSchema),
  mobilitySearchController.searchOptions.bind(mobilitySearchController),
);

module.exports = router;

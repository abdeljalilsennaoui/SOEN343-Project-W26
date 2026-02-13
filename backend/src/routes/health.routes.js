const { Router } = require('express');
const { healthController } = require('../controllers');

const router = Router();

router.get('/health', healthController.getHealth.bind(healthController));

module.exports = router;

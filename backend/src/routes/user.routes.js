const { Router } = require('express');
const userController = require('../controllers/UserController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/users/register', userController.register.bind(userController));
router.get('/users/me', requireAuth, userController.getMe.bind(userController));

module.exports = router;

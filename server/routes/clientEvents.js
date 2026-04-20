const express = require('express');
const router = express.Router();
const { protect, admin, client } = require('../middleware/auth');
const {
    getMyClientEventsDashboard,
    createClientEventRequest,
    requestClientEventEdit,
    getClientEventRequestsForAdmin,
    reviewClientEventRequest
} = require('../controllers/clientEventController');

router.get('/my', protect, client, getMyClientEventsDashboard);
router.post('/', protect, client, createClientEventRequest);
router.put('/:eventId/request-edit', protect, client, requestClientEventEdit);
router.get('/requests', protect, admin, getClientEventRequestsForAdmin);
router.post('/requests/:requestId/review', protect, admin, reviewClientEventRequest);
router.patch('/requests/:requestId/review', protect, admin, reviewClientEventRequest);

module.exports = router;

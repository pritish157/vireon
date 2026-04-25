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
const { validate } = require('../middleware/validate');
const {
    adminClientRequestsQuerySchema,
    createClientEventSchema,
    requestClientEventEditSchema,
    reviewClientEventRequestSchema
} = require('../validators/clientEventValidators');

router.get('/my', protect, client, getMyClientEventsDashboard);
router.post('/', protect, client, validate(createClientEventSchema), createClientEventRequest);
router.put('/:eventId/request-edit', protect, client, validate(requestClientEventEditSchema), requestClientEventEdit);
router.get('/requests', protect, admin, validate(adminClientRequestsQuerySchema), getClientEventRequestsForAdmin);
router.post('/requests/:requestId/review', protect, admin, validate(reviewClientEventRequestSchema), reviewClientEventRequest);
router.patch('/requests/:requestId/review', protect, admin, validate(reviewClientEventRequestSchema), reviewClientEventRequest);

module.exports = router;

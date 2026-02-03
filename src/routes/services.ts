import { Hono } from 'hono';
import { ServicesController } from '../controllers/services.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const serviceRoutes = new Hono();

serviceRoutes.get('/', ServicesController.getAllServices);
serviceRoutes.get('/:id', ServicesController.getServiceById);
serviceRoutes.post('/', authMiddleware, ServicesController.createService);
serviceRoutes.patch('/:id', authMiddleware, ServicesController.updateService);
serviceRoutes.delete('/:id', authMiddleware, ServicesController.deleteService);

// Crops
serviceRoutes.get('/crops/all', ServicesController.getAllCrops);
serviceRoutes.post('/crops', authMiddleware, ServicesController.createCrop);
serviceRoutes.post('/crops/link', authMiddleware, ServicesController.linkCropToService);
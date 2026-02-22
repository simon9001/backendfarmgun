import { Hono } from 'hono';
import { PartnersController } from '../controllers/partners.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
export const partnerRoutes = new Hono();
// Public routes
partnerRoutes.get('/active', PartnersController.getActivePartners);
partnerRoutes.get('/featured', PartnersController.getFeaturedPartners);
partnerRoutes.post('/interest', PartnersController.submitInterest);
// Admin routes (all protected by authMiddleware)
partnerRoutes.get('/admin/all', authMiddleware, PartnersController.getAllPartners);
partnerRoutes.post('/', authMiddleware, PartnersController.createPartner);
partnerRoutes.patch('/:id', authMiddleware, PartnersController.updatePartner);
partnerRoutes.delete('/:id', authMiddleware, PartnersController.deletePartner);
//# sourceMappingURL=partners.js.map
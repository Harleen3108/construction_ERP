import { Router } from 'express';
import { upload } from '../config/cloudinary';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);

router.post('/single', upload.single('file'), (req, res) => {
  const f: any = req.file;
  if (!f) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({
    success: true,
    data: { url: f.path, publicId: f.filename, originalName: f.originalname, size: f.size },
  });
});

router.post('/multiple', upload.array('files', 10), (req, res) => {
  const files: any[] = (req.files as any) || [];
  const data = files.map((f) => ({
    url: f.path, publicId: f.filename, originalName: f.originalname, size: f.size,
  }));
  res.json({ success: true, count: data.length, data });
});

export default router;

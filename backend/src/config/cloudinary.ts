import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = (req.body?.folder as string) || 'constructor_erp';
    return {
      folder: `constructor_erp/${folder}`,
      resource_type: 'auto',
      public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

export default cloudinary;

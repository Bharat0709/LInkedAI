const { bucket } = require('../config/firebaseConfig');
const AppError = require('./appError');

class FileUploadService {
  async uploadProfilePicture(organizationId, file) {
    try {
      const fileName = `profilePictures/${organizationId}_${Date.now()}_${file.originalname}`;
      const firebaseFile = bucket.file(fileName);

      const blobStream = firebaseFile.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', error => {
          reject(new AppError('Failed to upload profile picture.', 500));
        });

        blobStream.on('finish', async () => {
          try {
            await firebaseFile.makePublic();
            const profilePictureUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`;
            resolve(profilePictureUrl);
          } catch (error) {
            reject(new AppError('Failed to make file public.', 500));
          }
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      throw new AppError('File upload failed.', 500);
    }
  }

  async deleteFile(fileName) {
    try {
      const file = bucket.file(fileName);
      await file.delete();
      return true;
    } catch (error) {
      throw new AppError('Failed to delete file.', 500);
    }
  }

  validateFile(file) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024;

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.', 400);
    }

    if (file.size > maxFileSize) {
      throw new AppError('File size too large. Maximum size is 5MB.', 400);
    }

    return true;
  }
}

module.exports = new FileUploadService();

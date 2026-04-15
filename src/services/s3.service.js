const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/* ---------- UPLOAD FILE ---------- */
const uploadFile = async ({ buffer, fileName, contentType }) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  return getFileUrl(fileName);
};

/* ---------- GET FILE URL ---------- */
const getFileUrl = (fileName) => {
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

/* ---------- DELETE FILE ---------- */
const deleteFile = async (fileName) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  });

  await s3.send(command);
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
};
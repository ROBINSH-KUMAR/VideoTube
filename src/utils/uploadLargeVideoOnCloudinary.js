import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadLargeVideoOnCloudinary = (localFilePath) => {
  return new Promise((resolve, reject) => {
    if (!localFilePath) {
      return resolve(null);
    }

    console.log("Uploading:", localFilePath);
    console.log(
      "File exists before upload:",
      fs.existsSync(localFilePath)
    );

    const uploadStream = cloudinary.uploader.upload_large(
      localFilePath,
      {
        resource_type: "video",
        chunk_size: 6000000,
      },
      (error, result) => {
        if (error) {
          console.log("Cloudinary large video upload error:", error);
          return reject(error);
        }

        console.log("Cloudinary final response:", result);
        console.log(
          "File exists after upload:",
          fs.existsSync(localFilePath)
        );

        resolve(result);
      }
    );
  });
};

export default uploadLargeVideoOnCloudinary;
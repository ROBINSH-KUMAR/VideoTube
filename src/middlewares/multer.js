// import multer from "multer";
// import crypto from "crypto"

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/temp')
//   },
//   filename: function (req, file, cb) {
//     crypto.randomBytes(16, function (err, raw) {
//       if (err) return cb(err)
//       cb(null, file.originalname + '-' + raw.toString('hex'))
//     })
//   }
// })

// export const upload = multer({ storage: storage })

import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, "../../public/temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },

  filename: function (req, file, cb) {
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);

      const uniqueName = `${raw.toString("hex")}-${file.originalname}`;

      cb(null, uniqueName);
    });
  },
});

export const upload = multer({
  storage,
});
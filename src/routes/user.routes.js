import { Router } from "express";
import { registerUser,loginUser,logoutUser, refreshAccessToken,publishVideo } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/authentication.middlewares.js";

const router = Router();

router.route('/register').post(upload.fields([
  {
    name: 'avatar',
    maxCount:1
  },
    {
    name: 'coverImage',
    maxCount:1
  }
]),registerUser)



router.route('/login').post(loginUser)

//secured routes
router.route('/publish-video').post(upload.fields([
  {
    name: 'video',
    maxCount:1
  },
    {
    name: 'thumbnail',
    maxCount:1
  }
]),verifyJWT,publishVideo)
router.route('/logout').post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)






export default router;
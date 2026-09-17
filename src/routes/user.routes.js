import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  //auth
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  //video
  publishVideo,
  togglePublishStatus,
  getAllVideos,
  incrementVideoViews,
  //user
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  //channel
  getUserChannelProfile,
  //watch history
  addToWatchHistory,
  getWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
  //likes
  likeVideo,
  unlikeVideo,
  //subscription
  toggleSubscription,
  getMySubscribers,
  getChannelSubscribers,
  getMySubscriptions,
  getChannelSubscriptions
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/authentication.middlewares.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // maximum 10 attempts
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});


// ====================
// Authentication
// ====================
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/login").post(loginLimiter, loginUser);

// ====================
// Account && secured routes
// ====================

router.route("/change-password").patch(
  verifyJWT,
  changeCurrentPassword
);  

router.route("/current-user").get(
  verifyJWT,
  getCurrentUser
);

router.route("/update-account").patch(
  verifyJWT,
  updateAccountDetails
);

router.route("/avatar").patch(
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
);

router.route("/cover-image").patch(
  verifyJWT,
  upload.single("coverImage"),
  updateUserCoverImage
);

// ====================
// Channel
// ====================
router.route("/channel/:ownerId").get(
  verifyJWT,
  getUserChannelProfile
);

// ====================
// Videos
// ====================

router.route("/videos").get(
  getAllVideos
);

router.route("/publish-video").post(
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  publishVideo,
);

router.route("/videos/:videoId/publish").patch(
  verifyJWT,
  togglePublishStatus
);

router.route("/videos/:videoId/view").patch(
  verifyJWT,
  incrementVideoViews
);


// ====================
// Watch History
// ====================

router.route("/watch-history").get(
  verifyJWT,
  getWatchHistory
);

router.route("/watch-history/:videoId").post(
  verifyJWT,
  addToWatchHistory
);

router.route("/watch-history/:videoId").delete(
  verifyJWT,
  removeFromWatchHistory
);

router.route("/watch-history").delete(
  verifyJWT,
  clearWatchHistory
);


// ====================
// Likes
// ====================

router.route("/videos/:videoId/like")
  .post(verifyJWT, likeVideo)
  .delete(verifyJWT, unlikeVideo);

// ====================
// Subscription
// ====================

router
    .route("/toggle/video/:videoId")
    .post(verifyJWT, toggleSubscription);

router
    .route("/toggle/channel/:ownerId")
    .post(verifyJWT, toggleSubscription);

router
    .route("/my-subscribers")
    .get(verifyJWT, getMySubscribers);

router
    .route("/my-subscriptions")
    .get(verifyJWT, getMySubscriptions);


// Specific channel subscriptions
router
    .route("/channel/:ownerId/subscribers")
    .get(verifyJWT, getChannelSubscribers);

router
    .route("/channel/:ownerId/subscriptions")
    .get(verifyJWT, getChannelSubscriptions);

    export default router;

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.js";
import { Video } from "../models/video.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { options } from "../constants.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while refresh and access token",
    );
  }
};

// Authentication Controllers

export const registerUser = asyncHandler(async (req, res) => {
  const { userName, fullName, email, password } = req.body;
  // if(fullName===""){
  //   throw new ApiError(400,"fullName is required")
  // }
  if (
    [fullName, userName, email, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar is required");
  }
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(401, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  const cretedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!cretedUser) {
    throw new ApiError(500, "somthing went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, cretedUser, "user registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refreshToken");
  }
});

// video Controllers

export const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Video upload failed");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not the owner of this video");
  }

  video.isPublished = !video.isPublished;

  await video.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isPublished: video.isPublished,
      },
      video.isPublished
        ? "Video published successfully"
        : "Video unpublished successfully"
    )
  );
});

export const getAllVideos = asyncHandler(async (req, res) => {
  const skip = Math.max(Number(req.query.skip) || 0, 0);

  const requestedLimit = Number(req.query.limit) || 40;
  const limit = Math.min(Math.max(requestedLimit, 1), 40);
  const videos = await Video.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("owner", "fullName userName avatar");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos, hasMore: videos.length === limit },
        "All videos fetched successfully",
      ),
    );
});

export const incrementVideoViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true },
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { views: video.views },
        "Video views updated successfully",
      ),
    );
});

// Account Controllers

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "currnet user fetched successfully"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fileds are requiered");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.file?.path;
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);

  if (!avatar.url) {
    throw new ApiError(500, "Avatar file is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "AvatarImage updated successfully"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalFilePath = req.file?.path;
  if (!coverImageLocalFilePath) {
    throw new ApiError(400, "coverImagee file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

  if (!coverImage.url) {
    throw new ApiError(500, "coverImage file is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

// Channel Controllers

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    // Get videos owned by this user
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
        avatar: 1,
        email: 1,
        videos: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetch successfully"));
});

// Watch History Controllers

export const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await User.findByIdAndUpdate(req.user._id, [
    {
      $set: {
        watchHistory: {
          $concatArrays: [
            [video._id],
            {
              $filter: {
                input: "$watchHistory",
                as: "video",
                cond: {
                  $ne: ["$$video", video._id],
                },
              },
            },
          ],
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video added to watch history"));
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { watchHistory: user[0]?.watchHistory || [] },
        "Watch history fetched successfully",
      ),
    );
});

export const removeFromWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        watchHistory: videoId,
      },
    }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Video removed from watch history"
    )
  );
});

export const clearWatchHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        watchHistory: [],
      },
    }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Watch history cleared successfully"
    )
  );
});

// Like/Unlike Video Controllers

export const likeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const video = await Video.findById(videoId).session(session);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const user = await User.findById(req.user._id).session(session);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const alreadyLiked = user.likedVideos.some(
      (id) => id.toString() === videoId
    );

    if (alreadyLiked) {
      throw new ApiError(400, "Video already liked");
    }

    user.likedVideos.push(video._id);
    video.likes += 1;

    await user.save({ session });
    await video.save({ session });

    await session.commitTransaction();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          likes: video.likes,
          isLiked: true,
        },
        "Video liked successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

export const unlikeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const video = await Video.findById(videoId).session(session);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const user = await User.findById(req.user._id).session(session);

    const alreadyLiked = user.likedVideos.some(
      (id) => id.toString() === videoId
    );

    if (!alreadyLiked) {
      throw new ApiError(400, "Video is not liked");
    }

    user.likedVideos.pull(video._id);
    await user.save({ session });

    video.likes = Math.max(video.likes - 1, 0);
    await video.save({ session });

    await session.commitTransaction();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          likes: video.likes,
          isLiked: false,
        },
        "Video unliked successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});
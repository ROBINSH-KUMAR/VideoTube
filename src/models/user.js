import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: [true, "Avatar is required"],
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return null;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  const accessToken = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
      userName: this.userName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
  );
  return accessToken;
};
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    { userId: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
  );
  return refreshToken;
};

export const User = mongoose.model("User", userSchema);

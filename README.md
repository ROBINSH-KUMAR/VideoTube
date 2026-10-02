# 🎬 Streamo Backend

A production-oriented REST API backend for **Streamo**, a YouTube-inspired video streaming platform.

Streamo provides secure authentication, video management, Cloudinary-based media storage, likes, subscriptions, watch history, user profiles, and protected API endpoints.

The backend is built with **Node.js, Express.js, MongoDB, Mongoose, JWT, Cloudinary, and Multer**.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Access token + refresh token architecture
* HTTP-only cookies for token storage
* Protected routes using JWT middleware
* Logout functionality
* Refresh access tokens
* Password hashing with bcrypt
* Owner-based authorization for protected resources

### 👤 User Management

* Create user accounts
* Update user profile
* Upload avatar and cover image
* Get user profile
* Get videos uploaded by a user
* Watch history management
* Liked videos management

### 🎥 Video Management

* Upload videos
* Upload video thumbnails
* Store media on Cloudinary
* Publish/unpublish videos
* Get all published videos
* Get a single video
* Delete videos
* Owner-only video deletion
* Pagination support
* Video view tracking
* Video owner information using MongoDB population

### ❤️ Likes

* Like/unlike videos
* Prevent duplicate likes
* Maintain liked videos inside the user relationship

### 📺 Subscriptions

* Subscribe/unsubscribe from channels
* Get channel subscribers
* Get channels subscribed to by the current user

### 🕒 Watch History

* Add videos to watch history
* Get watch history
* Remove individual history items
* Clear watch history

### ☁️ Cloudinary Integration

* Video uploads
* Thumbnail uploads
* Large video upload support
* Cloudinary public ID tracking
* Media cleanup when videos are deleted

### 🗄️ Database

* MongoDB Atlas
* Mongoose ODM
* Structured schemas and relationships
* MongoDB transactions for important operations
* Indexed/query-friendly data access

---

# 🛠️ Tech Stack

| Technology | Purpose                   |
| ---------- | ------------------------- |
| Node.js    | JavaScript runtime        |
| Express.js | REST API framework        |
| MongoDB    | Database                  |
| Mongoose   | MongoDB ODM               |
| JWT        | Authentication            |
| bcrypt     | Password hashing          |
| Cloudinary | Video/image storage       |
| Multer     | Multipart file uploads    |
| dotenv     | Environment configuration |
| JavaScript | Backend language          |

---

# 📁 Project Structure

```text
VideoTube/
│
├── public/
│   └── temp/
│
├── src/
│   │
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── video.controller.js
│   │   ├── like.controller.js
│   │   ├── subscription.controller.js
│   │   └── ...
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── video.model.js
│   │   ├── like.model.js
│   │   └── subscription.model.js
│   │
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── video.routes.js
│   │   ├── like.routes.js
│   │   └── subscription.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   │
│   ├── db/
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── cloudinary.js
│   │   ├── asyncHandler.js
│   │   └── ApiError.js
│   │
│   ├── app.js
│   └── index.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

> Folder and file names may differ slightly depending on the current project structure.

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd VideoTube
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=8000

MONGODB_URI=your_mongodb_connection_string
DB_NAME=YouTube

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Never commit your `.env` file to GitHub.**

Add it to `.gitignore`:

```gitignore
.env
public/temp/
node_modules/
```

---

# ▶️ Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The API will run on:

```text
http://localhost:8000
```

---

# 🔐 Authentication Flow

Streamo uses an **access token + refresh token** authentication architecture.

```text
User
 │
 │ Login
 ▼
POST /users/login
 │
 ├── Access Token
 │
 └── Refresh Token
       │
       ▼
    HTTP-only Cookie
```

For protected requests:

```text
Client
  │
  │ Access Token
  ▼
verifyJWT Middleware
  │
  ├── Invalid → 401 Unauthorized
  │
  └── Valid
        │
        ▼
    Controller
```

The JWT middleware checks the access token from the authentication cookie/header and attaches the authenticated user to the request.

---

# 📡 API Endpoints

## 👤 User Routes

### Register

```http
POST /api/v1/users/register
```

Creates a new user.

### Login

```http
POST /api/v1/users/login
```

Authenticates the user and issues authentication tokens.

### Logout

```http
POST /api/v1/users/logout
```

Logs out the authenticated user.

### Refresh Access Token

```http
POST /api/v1/users/refresh-token
```

Generates a new access token using the refresh token.

### Get Current User

```http
GET /api/v1/users/current-user
```

Requires authentication.

---

# 🎥 Video Routes

### Upload Video

```http
POST /api/v1/videos
```

Requires authentication.

Uses `multipart/form-data`.

Example fields:

```text
videoFile
thumbnail
title
description
duration
```

The uploaded media is processed and stored using Cloudinary.

---

### Get All Videos

```http
GET /api/v1/videos
```

Returns published videos.

Supports pagination.

Example:

```http
GET /api/v1/videos?page=1&limit=20
```

---

### Get Video

```http
GET /api/v1/videos/:videoId
```

Returns a specific video.

---

### Publish / Unpublish Video

```http
PATCH /api/v1/videos/:videoId/publish
```

Only the video owner can change its publishing status.

---

### Delete Video

```http
DELETE /api/v1/videos/:videoId
```

Only the video owner can delete the video.

Deletion performs cleanup of:

```text
Cloudinary video
        ↓
Cloudinary thumbnail
        ↓
MongoDB video document
        ↓
User references
```

Important database operations can be performed using a MongoDB transaction to maintain consistency.

---

# ❤️ Like System

### Toggle Video Like

```http
POST /api/v1/likes/toggle/video/:videoId
```

Toggles the authenticated user's like state.

```text
Not liked
   │
   └── Like → Liked

Liked
   │
   └── Unlike → Not liked
```

Duplicate likes are prevented.

---

# 📺 Subscription System

### Toggle Channel Subscription

```http
POST /api/v1/subscriptions/toggle/channel/:ownerId
```

Subscribe or unsubscribe from a channel.

### Get Subscribers

```http
GET /api/v1/subscriptions/channel/:channelId
```

Returns users subscribed to a channel.

### Get Subscribed Channels

```http
GET /api/v1/subscriptions/subscribed
```

Returns channels followed by the authenticated user.

---

# 🕒 Watch History

### Add Video to History

```http
POST /api/v1/users/history/:videoId
```

### Get Watch History

```http
GET /api/v1/users/history
```

### Remove History Item

```http
DELETE /api/v1/users/history/:videoId
```

### Clear Watch History

```http
DELETE /api/v1/users/history
```

---

# ☁️ Media Upload Architecture

Streamo uses **Multer + Cloudinary** for media uploads.

```text
Client
   │
   │ multipart/form-data
   ▼
Multer
   │
   │ temporary file
   ▼
Local temporary storage
   │
   ▼
Cloudinary
   │
   ├── Video
   │
   └── Thumbnail
   │
   ▼
MongoDB
   │
   ├── video URL
   ├── thumbnail URL
   ├── video public ID
   └── thumbnail public ID
```

Large video files are uploaded using Cloudinary's large-file upload functionality.

---

# 🛡️ Authorization

Authentication and authorization are separate concepts in Streamo.

### Authentication

> "Who are you?"

Handled using JWT.

### Authorization

> "Are you allowed to perform this operation?"

For example, a user may only delete a video if they own it.

```text
Request
   │
   ▼
JWT Verification
   │
   ▼
Authenticated User
   │
   ▼
Check Video Owner
   │
   ├── Owner → Continue
   │
   └── Not Owner → Forbidden
```

---

# 📄 Example API Response

A successful API response follows a consistent structure.

```json
{
  "statusCode": 200,
  "data": {
    "_id": "video_id",
    "title": "My First Video",
    "description": "A demo video",
    "videoFile": "https://...",
    "thumbnail": "https://...",
    "owner": {
      "_id": "user_id",
      "userName": "robinsh",
      "fullName": "Robinsh Kumar",
      "avatar": "https://..."
    }
  },
  "message": "Video fetched successfully",
  "success": true
}
```

---

# 🧠 Backend Concepts Used

This project demonstrates several real-world backend concepts:

* REST API design
* Middleware
* JWT authentication
* HTTP-only cookies
* Access/refresh token architecture
* Password hashing
* File uploads
* Cloud storage
* MongoDB relationships
* Mongoose population
* Pagination
* Authorization
* Transactions
* Atomic database operations
* Error handling
* Async request handling
* Resource cleanup
* API validation
* Environment variables
* Database indexing
* Protected routes

---

# 🔄 Video Deletion Flow

One of the important backend workflows is video deletion.

```text
DELETE /videos/:videoId
             │
             ▼
       Verify JWT
             │
             ▼
       Validate video ID
             │
             ▼
       Find video
             │
             ▼
       Check ownership
             │
             ▼
   Delete Cloudinary media
             │
             ▼
      MongoDB Transaction
             │
       ┌─────┴─────┐
       ▼           ▼
 Delete Video   Remove references
       │           │
       └─────┬─────┘
             ▼
          Commit
```

If an important database operation fails, the transaction can roll back the database changes.

---

# 🗃️ Main Data Models

## User

```text
User
 ├── userName
 ├── email
 ├── fullName
 ├── password
 ├── avatar
 ├── coverImage
 ├── watchHistory
 └── likedVideos
```

## Video

```text
Video
 ├── title
 ├── description
 ├── videoFile
 ├── thumbnail
 ├── duration
 ├── views
 ├── isPublished
 ├── owner
 ├── videoPublicId
 └── thumbnailPublicId
```

## Subscription

```text
Subscription
 ├── subscriber
 └── channel
```

---

# 🧪 Testing

API endpoints can be tested using tools such as:

* Postman
* Postman Desktop Agent
* Thunder Client

Example:

```http
POST http://localhost:8000/api/v1/users/login
```

Then use the authentication cookie/token for protected endpoints.

---

# 🔒 Security Considerations

The backend includes several security practices:

* Password hashing with bcrypt
* JWT authentication
* HTTP-only authentication cookies
* Protected routes
* Owner authorization
* Environment variables for secrets
* Input validation
* File upload handling
* Cloudinary media management

Secrets such as:

```text
MongoDB credentials
JWT secrets
Cloudinary API credentials
```

should never be committed to the repository.

---

# 📈 Future Improvements

Potential improvements for Streamo include:

* Google OAuth authentication
* Redis caching
* Redis-based rate limiting
* Video transcoding
* Adaptive bitrate streaming
* Background job processing
* Message queues
* Search optimization
* Elasticsearch/OpenSearch
* Recommendation system
* Real-time notifications
* Online/offline presence
* Live streaming
* Video analytics
* Docker deployment
* CI/CD pipeline
* Centralized logging and monitoring

---

# 🌐 Frontend

Streamo has a separate React frontend that consumes this REST API.

```text
Streamo Frontend
       │
       │ Axios
       ▼
Streamo Backend
       │
   ┌───┴────┐
   ▼        ▼
MongoDB  Cloudinary
```

---

# 👨‍💻 Author

**Robinsh Kumar**

Backend / Full-Stack Developer

Built with:

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
Cloudinary
Multer
```

---

## ⭐ Project Goal

Streamo was built to go beyond basic CRUD and demonstrate how a real-world video platform backend can handle:

**authentication → authorization → media uploads → database relationships → likes → subscriptions → watch history → ownership → transactions → cloud storage.**

If you find the project useful, consider giving the repository a ⭐.

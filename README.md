# Podnest YouTube Agent

A full-stack application for generating YouTube video scripts and managing video production workflows with AI assistance.

## Project Structure

- `backend/` - Node.js/Express backend server
- `frontend/` - Next.js 14 frontend application

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Cloud Project with Drive API enabled
- N8N instance (for webhook integrations)

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend/` directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure your `.env` file with the following:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: Backend server port (default: 5000)
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google service account JSON file
   - `GOOGLE_DRIVE_VIEW_URL`: Google Drive view URL
   - `GOOGLE_DRIVE_DOWNLOAD_URL`: Google Drive download URL
   - `DRIVE_FOLDER_IMAGES`: Google Drive folder ID for images
   - `DRIVE_FOLDER_AUDIO`: Google Drive folder ID for audio
   - `DRIVE_FOLDER_VIDEO`: Google Drive folder ID for videos
   - `DRIVE_FOLDER_THUMBNAIL`: Google Drive folder ID for thumbnails
   - `N8N_WEBHOOK_BASE`: Your N8N webhook base URL

5. Place your Google service account JSON file in `backend/keys/drive-service-account.json`

6. Start the backend server:
```bash
npm start
```

### 2. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `frontend/` directory (copy from `.env.example`):
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file with the following:
   - `NEXT_PUBLIC_API_BASE_URL`: Backend API URL (e.g., http://localhost:5000)
   - `NEXT_PUBLIC_N8N_WEBHOOK_BASE`: Your N8N webhook base URL
   - `NEXT_PUBLIC_GOOGLE_DRIVE_DOWNLOAD_URL`: Google Drive download URL

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Common Issues and Solutions

### Error: "MONGODB_URI not set in .env"
- Make sure you've created a `.env` file in the `backend/` directory
- Verify that `MONGODB_URI` is set in the `.env` file

### Error: "Cannot find module 'node-fetch'"
- Run `npm install` in the `backend/` directory to install missing dependencies

### Error: "Failed to fetch" in frontend
- Make sure the backend server is running
- Verify `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` matches your backend URL
- Check CORS settings in the backend

### Error: "Google Drive API error"
- Verify your Google service account JSON file is in the correct location
- Check that the service account has access to the specified Drive folders
- Ensure the Drive API is enabled in your Google Cloud Project

## Development

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Google APIs (Drive)
- Multer (file uploads)

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## License

ISC


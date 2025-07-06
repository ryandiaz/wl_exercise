# ImageGen Backend Server

A Node.js TypeScript Express server with image and favorites endpoints.

## Quick Start

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/` - Server health check

### Image Endpoints
- **GET** `/image` - Get image information
- **POST** `/image` - Generate/process image
  ```json
  {
    "prompt": "your image prompt",
    "style": "artistic",
    "size": "512x512"
  }
  ```

### Favorites Endpoints
- **GET** `/favorites` - Get all favorites
- **POST** `/favorites` - Add to favorites
  ```json
  {
    "imageId": "image123",
    "name": "My favorite image"
  }
  ```
- **DELETE** `/favorites/:id` - Remove from favorites

## Server Details
- **Port**: 3000 (or PORT environment variable)
- **CORS**: Enabled for all origins
- **Body Parsing**: JSON and URL-encoded supported

## Development
- TypeScript source files in `src/`
- Compiled JavaScript output in `dist/`
- Watch mode: `npm run watch` 
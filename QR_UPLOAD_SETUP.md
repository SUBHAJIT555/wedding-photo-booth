# QR Code Image Upload Setup

This document explains the image upload system implemented for QR code generation.

## Overview

Instead of encoding large base64 image data directly in QR codes (which exceeds QR code capacity), images are now uploaded to the server and short URLs are generated for QR encoding.

## Architecture

### Server Components

1. **`public/upload-image.php`** - Upload endpoint
   - Accepts base64 image data via POST
   - Validates image type, size, and dimensions
   - Saves to `uploads/YYYY/MM/` directory structure
   - Returns full URL and short URL
   - Creates mapping in `link-map.json`

2. **`public/i.php`** - Short link resolver
   - Maps short IDs (16-char hex) to full image paths
   - Serves images directly with proper caching headers
   - Example: `/i/abc123def4567890` → serves the image

3. **`public/uploads/.htaccess`** - Security
   - Prevents PHP execution in uploads directory
   - Sets proper MIME types
   - Configures caching headers

### Client Components

1. **`src/utils/uploadImage.js`** - Upload utility
   - Handles image upload to server
   - Returns URL and short URL

2. **`src/pages/Capture.jsx`** - Updated submit flow
   - Uploads image on submit
   - Navigates with URL instead of base64

3. **`src/pages/Preview.jsx`** - URL handling
   - Uses short URL for QR codes
   - Falls back to base64 for backward compatibility

4. **`src/component/QRModal.jsx`** - QR code display
   - Handles URLs (preferred) and base64 (fallback)
   - Shows copy URL button for URLs

## File Structure

```
public/
├── upload-image.php      # Upload endpoint
├── i.php                 # Short link resolver
├── link-map.json         # ID → path mapping (auto-generated)
└── uploads/
    ├── .htaccess        # Security rules
    └── YYYY/
        └── MM/
            └── {id}.{ext}  # Uploaded images
```

## Configuration

### Environment Variables

Make sure `VITE_API_URL` is set in your `.env` file:

```env
VITE_API_URL=https://yourdomain.com
```

### PHP Configuration

Ensure your PHP settings allow uploads:

```ini
upload_max_filesize = 20M
post_max_size = 20M
memory_limit = 128M
max_execution_time = 30
```

### Web Server Permissions

The `uploads/` directory must be writable by the web server:

```bash
chmod -R 775 public/uploads/
chown -R www-data:www-data public/uploads/
```

## Security Features

1. **File Type Validation** - Only JPEG, PNG, GIF, WebP allowed
2. **Size Limits** - Maximum 20MB per image
3. **Dimension Limits** - Maximum 10,000px per dimension
4. **MIME Type Verification** - Validates actual image headers
5. **Unique Filenames** - Uses random hex IDs
6. **No PHP Execution** - `.htaccess` prevents PHP in uploads
7. **CORS Headers** - Configured for your React app

## Usage Flow

1. User captures/edits image in Capture page
2. On submit, image is uploaded to server via `upload-image.php`
3. Server returns:
   - Full URL: `https://domain.com/uploads/2025/11/abc123.png`
   - Short URL: `https://domain.com/i/abc123`
4. Preview page uses short URL for QR code
5. QR code contains short URL (much smaller than base64)
6. When scanned, `/i/{id}` resolves to the full image

## Testing

1. **Upload Test**: Capture an image and verify it uploads successfully
2. **QR Test**: Generate QR code and scan it - should load the image
3. **Short Link Test**: Visit `/i/{id}` directly - should serve the image
4. **Error Handling**: Try uploading invalid files - should reject properly

## Troubleshooting

### Upload Fails
- Check PHP error logs
- Verify `uploads/` directory permissions
- Check `upload_max_filesize` and `post_max_size` in PHP

### QR Code Doesn't Work
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Ensure short URL is being used (not base64)

### Images Not Loading
- Check file permissions in `uploads/`
- Verify `.htaccess` is not blocking requests
- Check web server error logs

## Future Improvements

- [ ] Add authentication/API keys for uploads
- [ ] Implement rate limiting
- [ ] Add image optimization/compression
- [ ] Set up CDN for better performance
- [ ] Add cleanup job for old images
- [ ] Implement database instead of JSON file for link mapping


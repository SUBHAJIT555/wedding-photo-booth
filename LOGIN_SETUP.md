# Login System Setup Guide

This guide explains how to set up and use the admin login system for your photo booth application.

## Overview

The application now requires admin login to access. All routes are protected except `/i/:id` (for viewing shared images via QR code).

## Features

- ✅ **Single Admin Account** - One username/password combination
- ✅ **Server-Side Authentication** - Credentials stored securely on server (not in public directory)
- ✅ **Session-Based** - PHP sessions for secure authentication
- ✅ **No Database Required** - Simple file-based configuration
- ✅ **Protected Routes** - All app routes require authentication
- ✅ **Public Image Viewing** - QR code image links work without login

## Default Credentials

**⚠️ IMPORTANT: Change these immediately after setup!**

- **Username:** `admin`
- **Password:** `admin123`

## Setup Instructions

### Step 1: Change Admin Credentials

1. Open `config/auth_config.php` (outside public directory)

2. Change the username:
   ```php
   'username' => 'your_username_here',
   ```

3. Generate a secure password hash:
   ```bash
   php -r "echo password_hash('your_password_here', PASSWORD_BCRYPT);"
   ```

4. Update the password hash in the config:
   ```php
   'password' => '$2y$10$...your_generated_hash_here...',
   ```

### Step 2: Set File Permissions

Make sure the config file is not publicly accessible:

```bash
chmod 640 config/auth_config.php
chown www-data:www-data config/auth_config.php
```

### Step 3: Test Login

1. Start your development server
2. Visit the app - you should see the login page
3. Enter your credentials
4. You should be redirected to the home page

## File Structure

```
wedding-photo-booth/
├── config/
│   └── auth_config.php          # Admin credentials (SECURE - not in public)
├── public/
│   └── auth.php                 # Authentication endpoint
└── src/
    ├── pages/
    │   └── Login.jsx            # Login page
    ├── component/
    │   └── ProtectedRoute.jsx   # Route protection
    └── utils/
        └── auth.js              # Auth utilities
```

## How It Works

### Authentication Flow

1. User visits any protected route
2. `ProtectedRoute` component checks authentication
3. If not authenticated → shows login page
4. User enters credentials → sent to `auth.php`
5. Server validates credentials → creates PHP session
6. User gains access to the app
7. Session expires after 8 hours (configurable)

### Session Management

- Uses PHP sessions (server-side)
- Session stored in cookies (secure, httpOnly)
- Session timeout: 8 hours (configurable in `auth_config.php`)
- Session verified on each route access

### Security Features

- ✅ Passwords hashed with bcrypt
- ✅ Credentials stored outside public directory
- ✅ Session-based authentication (no tokens in URL)
- ✅ Server-side validation
- ✅ Failed login attempts logged
- ✅ Session timeout protection

## Configuration Options

### Change Session Timeout

Edit `config/auth_config.php`:

```php
'session_timeout' => 8 * 60 * 60, // 8 hours in seconds
```

### Change Username

```php
'username' => 'your_username',
```

### Change Password

1. Generate hash:
   ```bash
   php -r "echo password_hash('new_password', PASSWORD_BCRYPT);"
   ```

2. Update config:
   ```php
   'password' => '$2y$10$...new_hash...',
   ```

## Public Routes

The following route is **public** (no login required):
- `/i/:id` - View shared images via QR code

All other routes require authentication.

## Logout

To add a logout button, you can use:

```javascript
import { logout } from '../utils/auth';

// In your component
<button onClick={logout}>Logout</button>
```

## Troubleshooting

### "Invalid username or password"

- Check that credentials in `config/auth_config.php` are correct
- Verify password hash was generated correctly
- Check PHP error logs for issues

### Login page keeps appearing

- Check browser console for errors
- Verify `auth.php` is accessible
- Check that PHP sessions are working
- Clear browser cookies and try again

### Session expires too quickly

- Increase `session_timeout` in `config/auth_config.php`
- Check server session settings

### Can't access config file

- Make sure `config/` directory exists
- Check file permissions (should be 640)
- Verify web server can read the file

### "Failed to connect to server"

- Check that `VITE_API_URL` is set correctly in `.env`
- Verify `auth.php` is accessible
- Check CORS settings if using different domains

## Security Best Practices

1. ✅ **Change default credentials immediately**
2. ✅ **Use strong passwords** - At least 12 characters, mix of letters, numbers, symbols
3. ✅ **Keep config file secure** - Outside public directory, proper permissions
4. ✅ **Use HTTPS in production** - Encrypts credentials and sessions
5. ✅ **Monitor login attempts** - Check PHP error logs for failed attempts
6. ✅ **Regular password rotation** - Change password periodically
7. ✅ **Limit session timeout** - Don't make it too long

## Production Deployment

1. **Change credentials** before going live
2. **Set proper file permissions**:
   ```bash
   chmod 640 config/auth_config.php
   chown www-data:www-data config/auth_config.php
   ```
3. **Use HTTPS** - Essential for secure authentication
4. **Configure PHP sessions** properly in `php.ini`
5. **Set up log monitoring** for failed login attempts
6. **Backup config file** securely (encrypted)

## Example: Changing Password

```bash
# 1. Generate new password hash
php -r "echo password_hash('MyNewSecurePassword123!', PASSWORD_BCRYPT);"

# Output: $2y$10$abcdefghijklmnopqrstuvwxyz...

# 2. Update config/auth_config.php
'password' => '$2y$10$abcdefghijklmnopqrstuvwxyz...',

# 3. Test login with new password
```

## Support

If you encounter issues:
1. Check PHP error logs
2. Check browser console for errors
3. Verify file permissions
4. Test `auth.php` endpoint directly
5. Check session configuration in PHP




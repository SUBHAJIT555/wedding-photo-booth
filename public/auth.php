<?php
/**
 * Authentication Endpoint
 * Handles login and session management
 * Credentials stored securely on server (not in public directory)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Start session
session_start();

function respond(int $statusCode, bool $success, string $message, ?array $data = null): void
{
    http_response_code($statusCode);
    echo json_encode([
        'statusCode' => $statusCode,
        'success' => $success,
        'message' => $message,
        'data' => $data,
    ]);
    exit();
}

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(200, true, 'OK', null);
}

// Load credentials from config (outside public directory for security)
$configFile = __DIR__ . '/../config/auth_config.php';

// If config file doesn't exist, create default one
if (!file_exists($configFile)) {
    // Create directory if it doesn't exist
    $configDir = dirname($configFile);
    if (!is_dir($configDir)) {
        mkdir($configDir, 0750, true);
    }

    // Create default config
    $defaultConfig = "<?php\n";
    $defaultConfig .= "// Admin Credentials\n";
    $defaultConfig .= "// Change these credentials immediately!\n";
    $defaultConfig .= "return [\n";
    $defaultConfig .= "    'username' => 'admin',\n";
    $defaultConfig .= "    'password' => password_hash('admin123', PASSWORD_BCRYPT),\n"; // Default: admin/admin123
    $defaultConfig .= "    'session_timeout' => 8 * 60 * 60, // 8 hours in seconds\n";
    $defaultConfig .= "];\n";

    file_put_contents($configFile, $defaultConfig);
    chmod($configFile, 0640); // Readable by owner and group only
}

$config = require $configFile;

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Login request
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        respond(400, false, 'Invalid JSON payload');
    }

    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        respond(400, false, 'Username and password are required');
    }

    // Verify credentials
    if ($username === $config['username'] && password_verify($password, $config['password'])) {
        // Set session
        $_SESSION['authenticated'] = true;
        $_SESSION['username'] = $username;
        $_SESSION['login_time'] = time();

        respond(200, true, 'Login successful', [
            'username' => $username,
            'session_id' => session_id(),
        ]);
    } else {
        // Log failed attempt
        error_log("Failed login attempt for username: " . $username . " from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        respond(401, false, 'Invalid username or password');
    }

} elseif ($method === 'GET') {
    // Check authentication status
    if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
        // Check session timeout
        $loginTime = $_SESSION['login_time'] ?? 0;
        $timeout = $config['session_timeout'] ?? (8 * 60 * 60);

        if ((time() - $loginTime) > $timeout) {
            // Session expired
            session_destroy();
            respond(401, false, 'Session expired');
        } else {
            respond(200, true, 'Authenticated', [
                'username' => $_SESSION['username'] ?? 'admin',
                'authenticated' => true,
            ]);
        }
    } else {
        respond(401, false, 'Not authenticated');
    }

} elseif ($method === 'DELETE') {
    // Logout request
    session_destroy();
    respond(200, true, 'Logged out successfully');

} else {
    respond(405, false, 'Method not allowed');
}




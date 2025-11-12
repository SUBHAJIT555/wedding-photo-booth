<?php
/**
 * Image Upload Endpoint
 * Accepts base64 image data and saves it to public/uploads/
 * Returns a short URL for QR code generation
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

function respond(int $statusCode, bool $success, string $message, ?array $data = null): void {
    http_response_code($statusCode);
    echo json_encode([
        'statusCode' => $statusCode,
        'success'    => $success,
        'message'    => $message,
        'data'       => $data,
    ]);
    exit();
}

function debug_log(string $msg): void {
    file_put_contents(__DIR__ . '/debug.log', "[" . date('c') . "] $msg\n", FILE_APPEND);
}

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(200, true, 'OK', null);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed');
}

// Read JSON body
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!is_array($data)) {
    respond(400, false, 'Invalid JSON payload');
}

$imageBase64 = $data['image'] ?? null;

if (!$imageBase64 || trim($imageBase64) === '') {
    respond(400, false, 'image field is required');
}

// Extract base64 data (remove data:image/...;base64, prefix if present)
$base64 = preg_replace('#^data:image/\w+;base64,#i', '', $imageBase64);
$decoded = base64_decode($base64, true);

if ($decoded === false) {
    respond(400, false, 'Invalid base64 image data');
}

// Validate image size (max 20MB)
$maxSize = 20 * 1024 * 1024; // 20MB
if (strlen($decoded) > $maxSize) {
    respond(400, false, 'Image too large. Maximum size is 20MB');
}

// Validate it's actually an image by checking MIME type
$imageInfo = @getimagesizefromstring($decoded);
if ($imageInfo === false) {
    respond(400, false, 'Invalid image format');
}

$mimeType = $imageInfo['mime'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($mimeType, $allowedTypes, true)) {
    respond(400, false, 'Unsupported image type. Allowed: JPEG, PNG, GIF, WebP');
}

// Get dimensions
$width = $imageInfo[0];
$height = $imageInfo[1];

// Validate dimensions (reject absurdly large images)
$maxDimension = 10000; // 10k pixels
if ($width > $maxDimension || $height > $maxDimension) {
    respond(400, false, 'Image dimensions too large');
}

// Determine file extension from MIME type
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
];
$ext = $extensions[$mimeType] ?? 'png';

// Create dated directory structure: uploads/YYYY/MM/
$year = date('Y');
$month = date('m');
$uploadDir = __DIR__ . "/uploads/{$year}/{$month}/";

if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
    respond(500, false, 'Failed to create upload directory');
}

// Generate unique filename (UUID-like)
$uniqueId = bin2hex(random_bytes(8)); // 16 char hex
$filename = "{$uniqueId}.{$ext}";
$filePath = $uploadDir . $filename;

// Write file
if (file_put_contents($filePath, $decoded) === false) {
    respond(500, false, 'Failed to save image');
}

// Set proper permissions (readable by web server)
chmod($filePath, 0644);

// Generate URLs
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

// Full URL
$fullUrl = "{$scheme}{$host}/uploads/{$year}/{$month}/{$filename}";

// Short URL (for QR codes)
$shortUrl = "{$scheme}{$host}/i/{$uniqueId}";

// Save short link mapping (simple JSON file for now)
$linkMapFile = __DIR__ . '/link-map.json';
$linkMap = [];
if (file_exists($linkMapFile)) {
    $linkMap = json_decode(file_get_contents($linkMapFile), true) ?? [];
}
$linkMap[$uniqueId] = [
    'path' => "/uploads/{$year}/{$month}/{$filename}",
    'created' => time(),
];
file_put_contents($linkMapFile, json_encode($linkMap, JSON_PRETTY_PRINT));

// Return response
respond(200, true, 'Image uploaded successfully', [
    'url' => $fullUrl,
    'shortUrl' => $shortUrl,
    'id' => $uniqueId,
    'width' => $width,
    'height' => $height,
    'size' => strlen($decoded),
    'mimeType' => $mimeType,
]);


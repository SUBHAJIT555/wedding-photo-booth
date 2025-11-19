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

// ---------- DEBUG HELPERS ----------

function debug_log(string $msg): void {
    $file = __DIR__ . '/upload-image-debug.log';
    $line = '[' . date('c') . '] ' . $msg . PHP_EOL;
    @file_put_contents($file, $line, FILE_APPEND);
}

function respond(int $statusCode, bool $success, string $message, ?array $data = null): void {
    debug_log("Respond: status={$statusCode}, success=" . ($success ? 'true' : 'false') . ", message=\"{$message}\"");
    http_response_code($statusCode);
    echo json_encode([
        'statusCode' => $statusCode,
        'success'    => $success,
        'message'    => $message,
        'data'       => $data,
    ]);
    exit();
}

// ---------- START REQUEST LOG ----------

debug_log('----------------------------------------');
debug_log('New request to upload-image.php');
debug_log('Method: ' . ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN'));
debug_log('Remote addr: ' . ($_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN'));
debug_log('HTTPS: ' . (!empty($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : 'off'));

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    debug_log('Handling OPTIONS preflight');
    respond(200, true, 'OK', null);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    debug_log('Non-POST method received, returning 405');
    respond(405, false, 'Method not allowed');
}

// Read JSON body
$raw = file_get_contents("php://input");
debug_log('Raw body length: ' . strlen($raw));

$data = json_decode($raw, true);
if (!is_array($data)) {
    debug_log('json_decode failed: ' . json_last_error_msg());
    respond(400, false, 'Invalid JSON payload');
}

debug_log('JSON decoded successfully, keys: ' . implode(',', array_keys($data)));

$imageBase64 = $data['image'] ?? null;

if (!$imageBase64 || trim($imageBase64) === '') {
    debug_log('Missing "image" field in payload');
    respond(400, false, 'image field is required');
}

// Extract base64 data (remove data:image/...;base64, prefix if present)
$base64 = preg_replace('#^data:image/\w+;base64,#i', '', $imageBase64);
debug_log('Base64 string length after prefix strip: ' . strlen($base64));

$decoded = base64_decode($base64, true);

if ($decoded === false) {
    debug_log('base64_decode returned false');
    respond(400, false, 'Invalid base64 image data');
}

$decodedLen = strlen($decoded);
debug_log('Decoded binary length: ' . $decodedLen);

// Validate image size (max 20MB)
$maxSize = 20 * 1024 * 1024; // 20MB
if ($decodedLen > $maxSize) {
    debug_log("Image too large: {$decodedLen} bytes (limit {$maxSize})");
    respond(400, false, 'Image too large. Maximum size is 20MB');
}

// Validate it's actually an image by checking MIME type
$imageInfo = @getimagesizefromstring($decoded);
if ($imageInfo === false) {
    debug_log('getimagesizefromstring failed');
    respond(400, false, 'Invalid image format');
}

$mimeType = $imageInfo['mime'] ?? 'unknown';
$width    = $imageInfo[0] ?? 0;
$height   = $imageInfo[1] ?? 0;

debug_log("Image info - mime: {$mimeType}, width: {$width}, height: {$height}");

$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($mimeType, $allowedTypes, true)) {
    debug_log("Unsupported image type: {$mimeType}");
    respond(400, false, 'Unsupported image type. Allowed: JPEG, PNG, GIF, WebP');
}

// Validate dimensions (reject absurdly large images)
$maxDimension = 10000; // 10k pixels
if ($width > $maxDimension || $height > $maxDimension) {
    debug_log("Image dimensions too large: width={$width}, height={$height}");
    respond(400, false, 'Image dimensions too large');
}

// Determine file extension from MIME type
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
    'image/webp' => 'webp',
];
$ext = $extensions[$mimeType] ?? 'png';
debug_log("Using extension: {$ext}");

// Create dated directory structure: uploads/YYYY/MM/
$year      = date('Y');
$month     = date('m');
$uploadDir = __DIR__ . "/uploads/{$year}/{$month}/";

debug_log("Upload dir: {$uploadDir}");

if (!is_dir($uploadDir)) {
    debug_log('Upload dir does not exist, attempting mkdir');
    if (!mkdir($uploadDir, 0775, true)) {
        debug_log('mkdir failed for upload dir');
        respond(500, false, 'Failed to create upload directory');
    }
    debug_log('Upload dir created successfully');
}

// Generate unique filename (UUID-like)
$uniqueId = bin2hex(random_bytes(8)); // 16 char hex
$filename = "{$uniqueId}.{$ext}";
$filePath = $uploadDir . $filename;

debug_log("Generated filename: {$filename}");
debug_log("Full file path: {$filePath}");

// Write file
if (file_put_contents($filePath, $decoded) === false) {
    debug_log('file_put_contents failed');
    respond(500, false, 'Failed to save image');
}

debug_log('File written successfully');

@chmod($filePath, 0644);
debug_log('chmod 0644 applied to file');

// Generate URLs
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$host   = $_SERVER['HTTP_HOST'] ?? 'localhost';

$fullUrl  = "{$scheme}{$host}/uploads/{$year}/{$month}/{$filename}";
$shortUrl = "{$scheme}{$host}/i/{$uniqueId}";

debug_log("Full URL: {$fullUrl}");
debug_log("Short URL: {$shortUrl}");

// Save short link mapping (simple JSON file for now)
$linkMapFile = __DIR__ . '/link-map.json';
$linkMap     = [];

if (file_exists($linkMapFile)) {
    $existing = file_get_contents($linkMapFile);
    debug_log('Existing link-map.json size: ' . strlen($existing));
    $linkMap = json_decode($existing, true) ?? [];
}

$linkMap[$uniqueId] = [
    'path'    => "/uploads/{$year}/{$month}/{$filename}",
    'created' => time(),
];

if (file_put_contents($linkMapFile, json_encode($linkMap, JSON_PRETTY_PRINT)) === false) {
    debug_log('Failed to write link-map.json');
    // Not fatal for the upload itself, but log it
} else {
    debug_log('link-map.json updated');
}

// Final response
debug_log('Upload completed successfully, sending JSON response');

respond(200, true, 'Image uploaded successfully', [
    'url'      => $fullUrl,
    'shortUrl' => $shortUrl,
    'id'       => $uniqueId,
    'width'    => $width,
    'height'   => $height,
    'size'     => $decodedLen,
    'mimeType' => $mimeType,
]);


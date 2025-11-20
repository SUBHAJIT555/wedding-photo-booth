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

function debug_log(string $msg): void
{
    $file = __DIR__ . '/upload-image-debug.log';
    $line = '[' . date('c') . '] ' . $msg . PHP_EOL;
    @file_put_contents($file, $line, FILE_APPEND);
}

function respond(int $statusCode, bool $success, string $message, ?array $data = null): void
{
    debug_log("Respond: status={$statusCode}, success=" . ($success ? 'true' : 'false') . ", message=\"{$message}\"");
    http_response_code($statusCode);
    echo json_encode([
        'statusCode' => $statusCode,
        'success' => $success,
        'message' => $message,
        'data' => $data,
    ]);
    exit();
}

function compress_image(string $binary, int $quality = 85): string
{
    $image = imagecreatefromstring($binary);
    if (!$image) {
        throw new Exception("Failed to create image from string");
    }

    // Convert everything to JPG
    ob_start();
    imagejpeg($image, null, $quality);
    $compressed = ob_get_clean();

    imagedestroy($image);
    return $compressed;
}


// ---------- START REQUEST LOG ----------

debug_log('----------------------------------------');
debug_log('New request to upload-image.php');
debug_log('Method: ' . ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN'));
debug_log('Remote addr: ' . ($_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN'));
debug_log('HTTPS: ' . (!empty($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : 'off'));

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(200, true, 'OK');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed');
}

// Read JSON body
$raw = file_get_contents("php://input");
debug_log('Raw body length: ' . strlen($raw));

$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, false, 'Invalid JSON payload');
}

$imageBase64 = $data['image'] ?? null;

if (!$imageBase64 || trim($imageBase64) === '') {
    respond(400, false, 'image field is required');
}

// Extract base64 part
$base64 = preg_replace('#^data:image/\w+;base64,#i', '', $imageBase64);
debug_log('Base64 length (stripped): ' . strlen($base64));

$decoded = base64_decode($base64, true);

if ($decoded === false) {
    respond(400, false, 'Invalid base64 image data');
}

$decodedLen = strlen($decoded);
debug_log("Decoded binary length: {$decodedLen}");

// Validate image
if ($decodedLen > 20 * 1024 * 1024) {
    respond(400, false, 'Image too large (max 20MB)');
}

$imageInfo = @getimagesizefromstring($decoded);
if ($imageInfo === false) {
    respond(400, false, 'Invalid image format');
}

$mimeType = $imageInfo['mime'] ?? 'unknown';
$width = $imageInfo[0] ?? 0;
$height = $imageInfo[1] ?? 0;

debug_log("Image info: mime={$mimeType}, width={$width}, height={$height}");

if ($width > 10000 || $height > 10000) {
    respond(400, false, 'Image dimensions too large');
}

// ---------- APPLY COMPRESSION ----------
try {
    debug_log("Starting compression...");
    $decoded = compress_image($decoded, 85);
    $decodedLen = strlen($decoded);
    debug_log("Compression successful. New size: {$decodedLen} bytes");
} catch (Exception $e) {
    debug_log("Compression failed: " . $e->getMessage());
}

// Always save as JPG
$ext = 'jpg';


// ---------- SAVE IMAGE TO DISK ----------

$year = date('Y');
$month = date('m');
$uploadDir = __DIR__ . "/uploads/{$year}/{$month}/";

debug_log("Upload dir: {$uploadDir}");

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0775, true)) {
        respond(500, false, 'Failed to create upload directory');
    }
}

$uniqueId = bin2hex(random_bytes(8));
$filename = "{$uniqueId}.{$ext}";
$filePath = $uploadDir . $filename;

debug_log("Saving file: {$filePath}");

if (file_put_contents($filePath, $decoded) === false) {
    respond(500, false, 'Failed to save image');
}

@chmod($filePath, 0644);


// ---------- GENERATE URLS ----------
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    ? 'https://' : 'http://';

$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

$fullUrl = "{$scheme}{$host}/uploads/{$year}/{$month}/{$filename}";
$shortUrl = "{$scheme}{$host}/i/{$uniqueId}";

debug_log("Full URL: {$fullUrl}");
debug_log("Short URL: {$shortUrl}");


// ---------- SAVE SHORT LINK MAP ----------
$linkMapFile = __DIR__ . '/link-map.json';
$linkMap = [];

if (file_exists($linkMapFile)) {
    $existing = file_get_contents($linkMapFile);
    $linkMap = json_decode($existing, true) ?? [];
}

$linkMap[$uniqueId] = [
    'path' => "/uploads/{$year}/{$month}/{$filename}",
    'created' => time(),
];

file_put_contents($linkMapFile, json_encode($linkMap, JSON_PRETTY_PRINT));

debug_log("Upload completed successfully");


// ---------- RESPONSE ----------
respond(200, true, 'Image uploaded successfully', [
    'url' => $fullUrl,
    'shortUrl' => $shortUrl,
    'id' => $uniqueId,
    'width' => $width,
    'height' => $height,
    'size' => $decodedLen,
    'mimeType' => 'image/jpeg',
]);

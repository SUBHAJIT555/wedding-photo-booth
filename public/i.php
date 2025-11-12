<?php
/**
 * Short Link Resolver
 * Maps short IDs to full image paths
 * GET /i/{id} -> redirects to or serves the image
 */

// Get the ID from the path
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

// Find 'i' in the path and get the next segment as ID
$id = null;
for ($i = 0; $i < count($pathParts) - 1; $i++) {
    if ($pathParts[$i] === 'i' && isset($pathParts[$i + 1])) {
        $id = $pathParts[$i + 1];
        break;
    }
}

// Also try query parameter as fallback
if (!$id && isset($_GET['id'])) {
    $id = $_GET['id'];
}

if (!$id || !preg_match('/^[a-f0-9]{16}$/i', $id)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid or missing image ID']);
    exit();
}

// Load link map
$linkMapFile = __DIR__ . '/link-map.json';
if (!file_exists($linkMapFile)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Image not found']);
    exit();
}

$linkMap = json_decode(file_get_contents($linkMapFile), true);
if (!isset($linkMap[$id])) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Image not found']);
    exit();
}

$imagePath = __DIR__ . $linkMap[$id]['path'];

if (!file_exists($imagePath)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Image file not found']);
    exit();
}

// Determine MIME type
$mimeType = mime_content_type($imagePath);
if (!$mimeType) {
    $mimeType = 'image/png'; // fallback
}

// Set headers for caching and CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: {$mimeType}");
header("Cache-Control: public, max-age=31536000, immutable");
header("ETag: \"" . md5_file($imagePath) . "\"");

// Handle conditional requests
if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
    $etag = trim($_SERVER['HTTP_IF_NONE_MATCH'], '"');
    if ($etag === md5_file($imagePath)) {
        http_response_code(304);
        exit();
    }
}

// Option 1: Redirect to full URL (better for SEO, but adds a redirect)
// $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
// $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
// $fullUrl = $scheme . $host . $linkMap[$id]['path'];
// header("Location: {$fullUrl}", true, 301);
// exit();

// Option 2: Serve directly (faster, no redirect)
readfile($imagePath);
exit();


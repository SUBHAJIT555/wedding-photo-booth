<?php
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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(200, true, 'OK', null);
}

// Read JSON body instead of $_POST
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!is_array($data)) {
    respond(400, false, 'Invalid JSON payload');
}

$avatarId = $data['avatar_id'] ?? null;
$sourceBase64 = $data['source'] ?? null;

if (!$avatarId || trim($avatarId) === '' || !$sourceBase64 || trim($sourceBase64) === '') {
    respond(400, false, 'source and avatar_id are required');
}

// Avatar map
$avatarMap = [
    "female1" => "female-01.png",
    "female2" => "female-02.png",
    "female3" => "female-03.png",
    "female4" => "female-04.png",
    "female5" => "female-05.png",
    "female6" => "female-06.png",
    "male1"   => "male-01.png",
    "male2"   => "male-02.png",
    "male3"   => "male-03.png",
    "male4"   => "male-04.png",
    "male5"   => "male-05.png",
    "male6"   => "male-06.png",
];

if (!isset($avatarMap[$avatarId])) {
    respond(400, false, 'Invalid avatar_id');
}

// Save uploaded base64 image
$uniqueId = uniqid('', true);
$uploadDir = __DIR__ . "/uploads/";
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
    respond(500, false, 'Failed to prepare upload directory');
}

$sourcePath = $uploadDir . "source_{$uniqueId}.png";
$base64 = preg_replace('#^data:image/\w+;base64,#i', '', $sourceBase64);
$decoded = base64_decode($base64, true);
if ($decoded === false) {
    respond(400, false, 'Invalid base64 image in source');
}
if (file_put_contents($sourcePath, $decoded) === false) {
    respond(500, false, 'Failed to write source image');
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

$sourceUrl = $scheme . $host . '/uploads/' . basename($sourcePath);
$targetUrl = $scheme . $host . '/avatars/' . $avatarMap[$avatarId];

// Call Magic API
$apiKey = 'cmfkoz59j0009jw04mzgnxf8x';
// $apiUrl = 'https://prod.api.market/api/v1/magicapi/faceswap-v2/faceswap/image/run';
$apiUrl = 'https://prod.api.market/api/v1/magicapi/faceswap-image-v3/run';

$payload = json_encode([
    "input" => [
        "swap_image"   => $sourceUrl,
        "target_image" => $targetUrl,
    ],
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'accept: application/json',
        'x-api-market-key: ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => $payload,
]);
$response = curl_exec($ch);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    respond(502, false, 'Failed to start job: ' . $curlErr);
}

$responseData = json_decode($response, true);
if (!is_array($responseData) || !isset($responseData['id'])) {
    debug_log("Payload: " . $payload);
    debug_log("API response: " . $response);
    respond(502, false, 'Failed to start job.');
}

$requestId = $responseData['id'];

// Poll (up to 10 minutes)
$resultUrl = null;
$maxRetries = 60;

for ($i = 0; $i < $maxRetries; $i++) {
    $delay = ($i + 1); // seconds
    sleep($delay);

    $statusCh = curl_init();
    curl_setopt_array($statusCh, [
        CURLOPT_URL => "https://prod.api.market/api/v1/magicapi/faceswap-image-v3/status/{$requestId}",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'accept: application/json',
            'x-api-market-key: ' . $apiKey,
        ],
    ]);
    $statusResponse = curl_exec($statusCh);
    $statusErr = curl_error($statusCh);
    curl_close($statusCh);

    if ($statusResponse === false) {
        respond(502, false, 'Failed to check job status: ' . $statusErr);
    }

    $statusData = json_decode($statusResponse, true);
    if (!is_array($statusData) || !isset($statusData['status'])) {
        respond(502, false, 'Invalid status response from provider');
    }

    if ($statusData['status'] === 'COMPLETED') {
        $resultUrl = $statusData['output']['image_url'] ?? null;
        $executionTime = $statusData["executionTime"] ?? null;
        $delayTime = $statusData["delayTime"] ?? null;
   
        if (!$resultUrl) {
            respond(502, false, 'Completed without result_url');
        }
        break;
    }

    if (in_array($statusData['status'], ['ERROR', 'FAILED'], true)) {
        respond(502, false, 'Job failed');
    }
}


if ($resultUrl) {
    respond(200, true, 'OK', [
        'result_url' => $resultUrl,
        'source_url' => $sourceUrl,
        'executionTime' => $executionTime,
        'delayTime' => $delayTime,
        'requestId' => $requestId,
        "loop" => $i,
    ]);
}

respond(504, false, 'Timeout waiting for result');
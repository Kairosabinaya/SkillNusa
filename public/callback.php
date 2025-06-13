<?php
header('Content-Type: application/json');

// Load environment variables from .env file if exists
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Load .env file
loadEnv(__DIR__ . '/.env');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get raw input
$json = file_get_contents('php://input');
$callback_data = json_decode($json, true);

// Log incoming callback for debugging
error_log('Tripay Callback Received: ' . $json);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Get callback signature from header
$callbackSignature = isset($_SERVER['HTTP_X_CALLBACK_SIGNATURE'])
    ? $_SERVER['HTTP_X_CALLBACK_SIGNATURE']
    : '';

// Get callback event from header
$callbackEvent = isset($_SERVER['HTTP_X_CALLBACK_EVENT'])
    ? $_SERVER['HTTP_X_CALLBACK_EVENT']
    : '';

// Tripay Configuration - Load from environment or config
$tripay_private_key = getenv('TRIPAY_PRIVATE_KEY') ?: 'YOUR_TRIPAY_PRIVATE_KEY';

// Generate signature untuk validasi
$signature = hash_hmac('sha256', $json, $tripay_private_key);

// Validate signature
if ($callbackSignature !== $signature) {
    error_log('Invalid callback signature. Expected: ' . $signature . ', Received: ' . $callbackSignature);
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid signature'
    ]);
    exit;
}

// Validate callback event
if ($callbackEvent !== 'payment_status') {
    error_log('Invalid callback event: ' . $callbackEvent);
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Unrecognized callback event: ' . $callbackEvent
    ]);
    exit;
}

// Validate required callback fields according to Tripay documentation
$required_fields = ['reference', 'merchant_ref', 'payment_method', 'payment_method_code', 'total_amount', 'fee_merchant', 'fee_customer', 'total_fee', 'amount_received', 'is_closed_payment', 'status'];

$missing_fields = [];
foreach ($required_fields as $field) {
    if (!isset($callback_data[$field])) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    error_log('Missing callback fields: ' . implode(', ', $missing_fields));
    // Don't exit here, just log for debugging
}

// Next.js API Configuration
$nextjs_api_url = getenv('SKILLNUSA_API_URL') . '/api/tripay/callback';
$nextjs_api_secret = getenv('SKILLNUSA_API_SECRET');

if (!$nextjs_api_url || !$nextjs_api_secret) {
    error_log('Missing Next.js API configuration');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server configuration error'
    ]);
    exit;
}

// Prepare data to send to Next.js
$payload = [
    'tripay_callback' => $callback_data,
    'validated' => true,
    'timestamp' => time(),
    'secret' => $nextjs_api_secret
];

// Forward to Next.js API
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => $nextjs_api_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Callback-Secret: ' . $nextjs_api_secret
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 10
]);

$response = curl_exec($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_error = curl_error($curl);

curl_close($curl);

// Handle forwarding errors
if ($curl_error) {
    error_log('Error forwarding to Next.js: ' . $curl_error);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to forward callback'
    ]);
    exit;
}

if ($http_code !== 200) {
    error_log('Next.js API responded with HTTP ' . $http_code . ': ' . $response);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Callback processing failed'
    ]);
    exit;
}

// Log successful processing
error_log('Callback successfully processed for merchant_ref: ' . $callback_data['merchant_ref']);

// Success response to Tripay (REQUIRED FORMAT)
http_response_code(200);
echo json_encode([
    'success' => true
]);
?> 
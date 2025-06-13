<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['merchantRef']) || empty(trim($input['merchantRef']))) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing merchant reference',
        'received_fields' => array_keys($input)
    ]);
    exit;
}

// Tripay Configuration - Load from environment
$tripay_api_key = getenv('TRIPAY_API_KEY') ?: 'YOUR_TRIPAY_API_KEY';
$tripay_private_key = getenv('TRIPAY_PRIVATE_KEY') ?: 'YOUR_TRIPAY_PRIVATE_KEY';
$tripay_merchant_code = getenv('TRIPAY_MERCHANT_CODE') ?: 'YOUR_TRIPAY_MERCHANT_CODE';
$tripay_mode = getenv('TRIPAY_MODE') ?: 'sandbox';

// Validate configuration
if ($tripay_api_key === 'YOUR_TRIPAY_API_KEY' || $tripay_private_key === 'YOUR_TRIPAY_PRIVATE_KEY' || $tripay_merchant_code === 'YOUR_TRIPAY_MERCHANT_CODE') {
    http_response_code(500);
    echo json_encode([
        'error' => 'Tripay configuration not properly set'
    ]);
    exit;
}

// Set API URL based on mode
$api_url = $tripay_mode === 'sandbox' 
    ? 'https://tripay.co.id/api-sandbox/transaction/detail'
    : 'https://tripay.co.id/api/transaction/detail';

$merchant_ref = $input['merchantRef'];

// Generate signature for detail request
$signature = hash_hmac('sha256', $tripay_merchant_code . $merchant_ref, $tripay_private_key);

// Prepare headers for Tripay API
$headers = [
    'Authorization: Bearer ' . $tripay_api_key,
    'Content-Type: application/json',
];

// Initialize cURL for GET request with query parameters
$query_params = http_build_query([
    'reference' => $merchant_ref,
    'signature' => $signature
]);

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => $api_url . '?' . $query_params,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'GET',
    CURLOPT_HTTPHEADER => $headers,
]);

$response = curl_exec($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_error = curl_error($curl);

curl_close($curl);

// Handle cURL errors
if ($curl_error) {
    http_response_code(500);
    echo json_encode([
        'error' => 'cURL Error: ' . $curl_error
    ]);
    exit;
}

// Decode response
$response_data = json_decode($response, true);

// Log response for debugging
error_log("Tripay Status Check Response: " . json_encode([
    'merchant_ref' => $merchant_ref,
    'http_code' => $http_code,
    'success' => isset($response_data['success']) ? $response_data['success'] : false,
    'status' => isset($response_data['data']['status']) ? $response_data['data']['status'] : 'unknown'
]));

// Handle API response
if ($http_code !== 200) {
    http_response_code($http_code);
    echo json_encode([
        'error' => 'Tripay API Error',
        'http_code' => $http_code,
        'response' => $response_data
    ]);
    exit;
}

// Validate response structure
if (!isset($response_data['success']) || !$response_data['success']) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Failed to get transaction status',
        'tripay_message' => isset($response_data['message']) ? $response_data['message'] : 'Unknown error',
        'response' => $response_data
    ]);
    exit;
}

if (!isset($response_data['data'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid response structure',
        'response' => $response_data
    ]);
    exit;
}

$transaction_data = $response_data['data'];

// Determine payment status
$is_paid = false;
$status = isset($transaction_data['status']) ? $transaction_data['status'] : 'UNKNOWN';

// Tripay status codes: UNPAID, PAID, EXPIRED, FAILED, REFUND
switch (strtoupper($status)) {
    case 'PAID':
        $is_paid = true;
        break;
    case 'UNPAID':
    case 'EXPIRED':
    case 'FAILED':
    case 'REFUND':
    default:
        $is_paid = false;
        break;
}

// Success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'paid' => $is_paid,
    'status' => $status,
    'merchant_ref' => $merchant_ref,
    'transaction_data' => $transaction_data
]);
?> 
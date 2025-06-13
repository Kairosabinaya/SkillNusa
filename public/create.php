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

// Validate required fields (updated to match frontend)
$required_fields = ['amount', 'customerName', 'customerEmail', 'orderItems', 'expiredTime'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (!isset($input[$field]) || (is_string($input[$field]) && empty(trim($input[$field])))) {
        $missing_fields[] = $field;
    }
}

// Validate amount
if (isset($input['amount']) && (int)$input['amount'] <= 0) {
    $missing_fields[] = 'amount (must be > 0)';
}

// Validate email format
if (isset($input['customerEmail']) && !filter_var($input['customerEmail'], FILTER_VALIDATE_EMAIL)) {
    $missing_fields[] = 'customerEmail (invalid format)';
}

if (!empty($missing_fields)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing or invalid required fields',
        'missing_fields' => $missing_fields,
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
    ? 'https://tripay.co.id/api-sandbox/transaction/create'
    : 'https://tripay.co.id/api/transaction/create';

// Use provided merchant reference or generate one
$merchant_ref = isset($input['merchantRef']) && !empty($input['merchantRef']) 
    ? $input['merchantRef'] 
    : 'SKILLNUSA-' . time();

// Generate signature according to Tripay documentation
$signature = hash_hmac('sha256', $tripay_merchant_code . $merchant_ref . $input['amount'], $tripay_private_key);

// Prepare transaction data (updated to match frontend parameters)
$transaction_data = [
    'method' => 'QRIS',
    'merchant_ref' => $merchant_ref,
    'amount' => (int)$input['amount'],
    'customer_name' => $input['customerName'],
    'customer_email' => $input['customerEmail'],
    'customer_phone' => isset($input['customerPhone']) && !empty($input['customerPhone']) ? $input['customerPhone'] : '081234567890', // Default phone if not provided
    'order_items' => $input['orderItems'],
    'return_url' => isset($input['returnUrl']) && !empty($input['returnUrl']) ? $input['returnUrl'] : 'https://skillnusa.com/dashboard/client/transactions',
    'expired_time' => (int)$input['expiredTime'],
    'signature' => $signature
];

// Add callback URL if in production mode
if ($tripay_mode === 'production') {
    $transaction_data['callback_url'] = 'https://skillnusa.com/api/tripay/callback';
} else {
    // FIX: For sandbox mode, use proper callback URL
    $transaction_data['callback_url'] = 'https://skillnusa.com/callback.php'; // Use PHP callback for sandbox
}

// Prepare headers for Tripay API
$headers = [
    'Authorization: Bearer ' . $tripay_api_key,
    'Content-Type: application/json',
];

// Function to make Tripay API request with retry
function makeTripayRequest($api_url, $transaction_data, $headers, $max_retries = 3) {
    $attempt = 0;
    
    while ($attempt < $max_retries) {
        $attempt++;
        error_log("Tripay API Request Attempt #{$attempt}");
        
        // Initialize cURL with improved configuration
        $curl = curl_init();
        
        curl_setopt_array($curl, [
            CURLOPT_URL => $api_url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 60, // Increase timeout to 60 seconds
            CURLOPT_CONNECTTIMEOUT => 30, // Connection timeout 30 seconds
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => json_encode($transaction_data),
            CURLOPT_HTTPHEADER => $headers,
            // Additional reliability settings
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERAGENT => 'SkillNusa/1.0',
            CURLOPT_FRESH_CONNECT => true,
            CURLOPT_FORBID_REUSE => true,
            // DNS and connection settings
            CURLOPT_DNS_CACHE_TIMEOUT => 120,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4
        ]);
        
        $start_time = microtime(true);
        $response = curl_exec($curl);
        $end_time = microtime(true);
        $request_duration = round(($end_time - $start_time) * 1000, 2);
        
        $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($curl);
        $curl_info = curl_getinfo($curl);
        
        curl_close($curl);
        
        error_log("Tripay API Attempt #{$attempt}: {$request_duration}ms, HTTP Code: {$http_code}");
        
        // If successful, return result
        if (!$curl_error && $http_code === 200) {
            return [
                'success' => true,
                'response' => $response,
                'http_code' => $http_code,
                'duration' => $request_duration,
                'attempt' => $attempt
            ];
        }
        
        // Log error details
        error_log("Tripay API Attempt #{$attempt} Failed: " . json_encode([
            'error' => $curl_error ?: 'HTTP Error',
            'http_code' => $http_code,
            'total_time' => $curl_info['total_time'] ?? 'unknown',
            'connect_time' => $curl_info['connect_time'] ?? 'unknown'
        ]));
        
        // If this is not the last attempt, wait before retrying
        if ($attempt < $max_retries) {
            $wait_time = $attempt * 2; // Progressive backoff: 2s, 4s, 6s
            error_log("Waiting {$wait_time} seconds before retry...");
            sleep($wait_time);
        }
    }
    
    // All attempts failed
    return [
        'success' => false,
        'error' => $curl_error ?: 'HTTP Error after ' . $max_retries . ' attempts',
        'http_code' => $http_code ?? 0,
        'attempts' => $max_retries
    ];
}

// Log request details for debugging
error_log("Tripay API Request: " . json_encode([
    'url' => $api_url,
    'method' => 'POST',
    'merchant_ref' => $merchant_ref,
    'amount' => $transaction_data['amount'],
    'timestamp' => date('Y-m-d H:i:s')
]));

// Make request with retry mechanism
$result = makeTripayRequest($api_url, $transaction_data, $headers);

if (!$result['success']) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Tripay API Error: ' . $result['error'],
        'details' => [
            'http_code' => $result['http_code'],
            'attempts' => $result['attempts'],
            'api_url' => $api_url
        ]
    ]);
    exit;
}

$response = $result['response'];
$http_code = $result['http_code'];

// Decode response
$response_data = json_decode($response, true);

// Log response for debugging (mask sensitive data)
error_log("Tripay API Response: " . json_encode([
    'http_code' => $http_code,
    'success' => isset($response_data['success']) ? $response_data['success'] : false,
    'has_data' => isset($response_data['data']),
    'has_qr_string' => isset($response_data['data']['qr_string']),
    'has_qr_url' => isset($response_data['data']['qr_url']),
    'has_checkout_url' => isset($response_data['data']['checkout_url']),
    'qr_string_length' => isset($response_data['data']['qr_string']) ? strlen($response_data['data']['qr_string']) : 0,
    'qr_string_preview' => isset($response_data['data']['qr_string']) ? substr($response_data['data']['qr_string'], 0, 50) . '...' : 'N/A'
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

// Validate Tripay response structure
if (!isset($response_data['success']) || !$response_data['success']) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Tripay transaction failed',
        'tripay_message' => isset($response_data['message']) ? $response_data['message'] : 'Unknown error',
        'response' => $response_data
    ]);
    exit;
}

if (!isset($response_data['data'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid Tripay response structure',
        'response' => $response_data
    ]);
    exit;
}

// Success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'merchant_ref' => $merchant_ref,
    'tripay_response' => $response_data,
    // Add QR code debugging info
    'qr_debug' => [
        'has_qr_string' => isset($response_data['data']['qr_string']),
        'has_qr_url' => isset($response_data['data']['qr_url']),
        'has_checkout_url' => isset($response_data['data']['checkout_url']),
        'qr_string_length' => isset($response_data['data']['qr_string']) ? strlen($response_data['data']['qr_string']) : 0
    ]
]);
?> 
<?php
// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Configuration
$VERCEL_API_URL = $_ENV['SKILLNUSA_API_URL'] ?? 'https://skillnusa-api.vercel.app';
$DEBUG_MODE = ($_ENV['DEBUG_MODE'] ?? 'false') === 'true';

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Log function
function logMessage($message) {
    global $DEBUG_MODE;
    if ($DEBUG_MODE) {
        error_log("[Tripay Bridge] " . $message);
    }
}

try {
    logMessage("Callback bridge started");
    
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }
    
    // Get all headers from Tripay
    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (strpos($key, 'HTTP_') === 0) {
            $header = str_replace('HTTP_', '', $key);
            $header = str_replace('_', '-', $header);
            $header = ucwords(strtolower($header), '-');
            $headers[$header] = $value;
        }
    }
    
    // Get raw POST data from Tripay
    $rawData = file_get_contents('php://input');
    logMessage("Received data: " . $rawData);
    
    // Validate that we have data
    if (empty($rawData)) {
        throw new Exception('No data received from Tripay');
    }
    
    // Prepare curl request to forward to Vercel API
    $vercelUrl = $VERCEL_API_URL . '/api/tripay/callback';
    logMessage("Forwarding to: " . $vercelUrl);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $vercelUrl,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $rawData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Callback-Event: ' . ($headers['X-Callback-Event'] ?? 'payment_status'),
            'X-Callback-Signature: ' . ($headers['X-Callback-Signature'] ?? ''),
            'User-Agent: TriPay-Bridge/1.0'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    logMessage("Vercel API response code: " . $httpCode);
    logMessage("Vercel API response: " . $response);
    
    // Check for curl errors
    if ($curlError) {
        throw new Exception('CURL Error: ' . $curlError);
    }
    
    // Check for HTTP errors
    if ($httpCode >= 400) {
        throw new Exception('Vercel API returned HTTP ' . $httpCode . ': ' . $response);
    }
    
    // Forward the response code and content
    http_response_code($httpCode);
    
    // Try to decode and re-encode for validation
    $decodedResponse = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo json_encode($decodedResponse);
    } else {
        // If not valid JSON, return as-is
        echo $response;
    }
    
    logMessage("Bridge completed successfully");
    
} catch (Exception $e) {
    logMessage("Bridge error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Callback bridge error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?> 
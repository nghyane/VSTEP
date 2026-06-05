<?php

declare(strict_types=1);

return [
    'payos' => [
        'client_id' => env('PAYOS_CLIENT_ID', ''),
        'api_key' => env('PAYOS_API_KEY', ''),
        'checksum_key' => env('PAYOS_CHECKSUM_KEY', ''),
        'api_url' => env('PAYOS_API_URL', 'https://api-merchant.payos.vn'),
    ],

    'vnpay' => [
        'tmc_code' => env('VNPAY_TMN_CODE', ''),
        'hash_secret' => env('VNPAY_HASH_SECRET', ''),
        'url' => env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    ],

    'order_expiry_minutes' => (int) env('PAYMENT_ORDER_EXPIRY_MINUTES', 10),
];

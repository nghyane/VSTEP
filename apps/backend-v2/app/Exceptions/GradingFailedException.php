<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Grading job failed at the business level (submission missing, STT failed, etc).
 * Distinct from queue failures — bubbles up to Job::failed() to mark status=Failed.
 */
final class GradingFailedException extends \RuntimeException {}

<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class CourseEnrollmentInvoiceMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $bodyHtml,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Hóa đơn đăng ký khóa học VSTEP');
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->bodyHtml);
    }
}

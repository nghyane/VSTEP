<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\Level;

final class WritingHints
{
    public static function forQuestion(array $content, Level $level, int $part): array
    {
        $type = $part === 1 ? 'letter' : 'essay';

        return [
            'outline' => self::outline($type, $level),
            'starters' => self::starters($type, $level),
            'word_count' => self::wordCount($level, $part),
        ];
    }

    private static function outline(string $type, Level $level): array
    {
        if ($type === 'letter') {
            return match ($level) {
                Level::A2 => [
                    'Opening: Greet your friend/recipient',
                    'Purpose: State why you are writing',
                    'Details: Answer the content points (2-3 points)',
                    'Closing: End politely',
                ],
                default => [
                    'Opening: Greet and state purpose',
                    'Paragraph 1: First content point with details',
                    'Paragraph 2: Second content point with details',
                    'Closing: Summarize and end appropriately',
                ],
            };
        }

        return match ($level) {
            Level::A2, Level::B1 => [
                'Introduction: State your opinion or the topic',
                'Body 1: First reason + example',
                'Body 2: Second reason + example',
                'Conclusion: Restate your opinion',
            ],
            Level::B2 => [
                'Introduction: Introduce the topic + thesis statement',
                'Body 1: First argument with evidence and examples',
                'Body 2: Counter-argument or second perspective',
                'Body 3: Your evaluation / further support',
                'Conclusion: Summarize and give final opinion',
            ],
            Level::C1 => [
                'Introduction: Context + nuanced thesis',
                'Body 1: First dimension with critical analysis',
                'Body 2: Second dimension with counter-evidence',
                'Body 3: Synthesis — evaluate both sides',
                'Conclusion: Implications and qualified conclusion',
            ],
        };
    }

    private static function starters(string $type, Level $level): array
    {
        if ($type === 'letter') {
            return match ($level) {
                Level::A2 => [
                    'Dear ...,',
                    'I am writing to ...',
                    'I would like to ...',
                    'I hope you can ...',
                    'Best wishes,',
                ],
                default => [
                    'Dear ...,',
                    'I am writing to inform you about / ask about ...',
                    'I would appreciate it if ...',
                    'Please let me know if ...',
                    'I look forward to hearing from you.',
                    'Yours sincerely / Best regards,',
                ],
            };
        }

        return match ($level) {
            Level::A2, Level::B1 => [
                'In my opinion, ...',
                'I think that ... because ...',
                'For example, ...',
                'Another reason is ...',
                'On the other hand, ...',
                'In conclusion, ...',
            ],
            Level::B2 => [
                'It is widely believed that ...',
                'One of the main advantages/disadvantages is ...',
                'For instance, research shows that ...',
                'However, critics argue that ...',
                'Despite this, ...',
                'Taking everything into account, ...',
            ],
            Level::C1 => [
                'The question of whether ... remains contentious.',
                'A compelling argument can be made that ...',
                'This perspective, however, fails to account for ...',
                'Empirical evidence suggests that ...',
                'It is therefore imperative to consider ...',
                'In light of these considerations, ...',
            ],
        };
    }

    private static function wordCount(Level $level, int $part): string
    {
        if ($part === 1) {
            return match ($level) {
                Level::A2 => '80-100 words',
                Level::B1 => '120-150 words',
                default => '150-180 words',
            };
        }

        return match ($level) {
            Level::B1 => '150-180 words',
            Level::B2 => '~250 words',
            Level::C1 => '~300 words',
            default => '100-150 words',
        };
    }
}

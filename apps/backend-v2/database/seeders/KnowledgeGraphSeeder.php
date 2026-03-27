<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\KnowledgePoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class KnowledgeGraphSeeder extends Seeder
{
    public function run(): void
    {
        $nodes = $this->upsertNodes();
        $this->upsertEdges($nodes);
    }

    private function upsertNodes(): array
    {
        $map = [];

        foreach ($this->nodeDefinitions() as $def) {
            $kp = KnowledgePoint::updateOrCreate(
                ['category' => $def['category'], 'name' => $def['name']],
                ['description' => $def['description']],
            );
            $map[$def['key']] = $kp->id;
        }

        return $map;
    }

    private function upsertEdges(array $map): void
    {
        foreach ($this->edgeDefinitions() as $edge) {
            if (! isset($map[$edge[0]], $map[$edge[1]])) {
                continue;
            }

            $exists = DB::table('knowledge_point_edges')
                ->where('parent_id', $map[$edge[0]])
                ->where('child_id', $map[$edge[1]])
                ->exists();

            if (! $exists) {
                DB::table('knowledge_point_edges')->insert([
                    'id' => (string) Str::uuid(),
                    'parent_id' => $map[$edge[0]],
                    'child_id' => $map[$edge[1]],
                    'relation' => $edge[2],
                ]);
            }
        }
    }

    /**
     * Knowledge point nodes organized by category.
     * Based on CEFR B1-C1 descriptors for VSTEP.
     */
    private function nodeDefinitions(): array
    {
        return [
            // ── Grammar: Sentence Structure ─────────────────────────
            ['key' => 'g_sentence_structure', 'category' => 'grammar', 'name' => 'Sentence Structure', 'description' => 'Khả năng xây dựng các loại câu khác nhau trong tiếng Anh.'],
            ['key' => 'g_simple_sentences', 'category' => 'grammar', 'name' => 'Simple Sentences', 'description' => 'Câu đơn với một mệnh đề độc lập: S + V + O.'],
            ['key' => 'g_compound_sentences', 'category' => 'grammar', 'name' => 'Compound Sentences', 'description' => 'Câu ghép nối bằng FANBOYS (for, and, nor, but, or, yet, so).'],
            ['key' => 'g_complex_sentences', 'category' => 'grammar', 'name' => 'Complex Sentences', 'description' => 'Câu phức với mệnh đề phụ thuộc (although, because, when, if...).'],
            ['key' => 'g_relative_clauses', 'category' => 'grammar', 'name' => 'Relative Clauses', 'description' => 'Mệnh đề quan hệ (who, which, that, whose, where, when).'],
            ['key' => 'g_conditional_clauses', 'category' => 'grammar', 'name' => 'Conditional Clauses', 'description' => 'Câu điều kiện loại 0, 1, 2, 3 và hỗn hợp.'],
            ['key' => 'g_noun_clauses', 'category' => 'grammar', 'name' => 'Noun Clauses', 'description' => 'Mệnh đề danh từ (that/whether/wh- clauses): I believe that..., What he said is..., Whether we should...'],
            ['key' => 'g_participial_clauses', 'category' => 'grammar', 'name' => 'Participial Clauses', 'description' => 'Mệnh đề phân từ rút gọn (Having finished..., Written in 1990...).'],
            ['key' => 'g_inversion', 'category' => 'grammar', 'name' => 'Inversion', 'description' => 'Đảo ngữ nhấn mạnh (Not only... but also, Hardly... when, Never...).'],
            ['key' => 'g_cleft_sentences', 'category' => 'grammar', 'name' => 'Cleft Sentences', 'description' => 'Câu chẻ nhấn mạnh (It is... that, What I need is...).'],

            // ── Grammar: Verb System ────────────────────────────────
            ['key' => 'g_verb_system', 'category' => 'grammar', 'name' => 'Verb System', 'description' => 'Hệ thống động từ tiếng Anh: thì, thể, dạng.'],
            ['key' => 'g_tenses_basic', 'category' => 'grammar', 'name' => 'Basic Tenses', 'description' => 'Simple present, past, future. Present/past continuous.'],
            ['key' => 'g_tenses_perfect', 'category' => 'grammar', 'name' => 'Perfect Tenses', 'description' => 'Present perfect, past perfect, future perfect.'],
            ['key' => 'g_tense_consistency', 'category' => 'grammar', 'name' => 'Tense Consistency', 'description' => 'Nhất quán thì trong bài viết/nói. Chuyển thì hợp lý.'],
            ['key' => 'g_passive_voice', 'category' => 'grammar', 'name' => 'Passive Voice', 'description' => 'Câu bị động ở các thì khác nhau.'],
            ['key' => 'g_modal_verbs', 'category' => 'grammar', 'name' => 'Modal Verbs', 'description' => 'Can, could, may, might, should, must, ought to — diễn đạt khả năng, lời khuyên, nghĩa vụ.'],
            ['key' => 'g_reported_speech', 'category' => 'grammar', 'name' => 'Reported Speech', 'description' => 'Câu tường thuật, đổi thì, đại từ, trạng từ thời gian.'],
            ['key' => 'g_subjunctive', 'category' => 'grammar', 'name' => 'Subjunctive Mood', 'description' => 'Thức giả định (suggest that he go, If I were...).'],

            // ── Grammar: Agreement & Mechanics ──────────────────────
            ['key' => 'g_agreement', 'category' => 'grammar', 'name' => 'Agreement', 'description' => 'Hòa hợp chủ ngữ - vị ngữ, đại từ - tiền ngữ.'],
            ['key' => 'g_subject_verb_agreement', 'category' => 'grammar', 'name' => 'Subject-Verb Agreement', 'description' => 'Hòa hợp chủ ngữ - động từ (số ít/số nhiều).'],
            ['key' => 'g_articles', 'category' => 'grammar', 'name' => 'Articles', 'description' => 'Mạo từ a, an, the — quy tắc sử dụng, zero article.'],
            ['key' => 'g_prepositions', 'category' => 'grammar', 'name' => 'Prepositions', 'description' => 'Giới từ chỉ thời gian, nơi chốn, giới từ đi kèm động từ/tính từ.'],
            ['key' => 'g_gerunds_infinitives', 'category' => 'grammar', 'name' => 'Gerunds & Infinitives', 'description' => 'Danh động từ vs nguyên mẫu có to (enjoy doing, want to do, stop doing/to do).'],
            ['key' => 'g_comparatives', 'category' => 'grammar', 'name' => 'Comparatives & Superlatives', 'description' => 'So sánh hơn, nhất, so sánh bằng, so sánh kép.'],

            // ── Vocabulary ──────────────────────────────────────────
            ['key' => 'v_general', 'category' => 'vocabulary', 'name' => 'General Vocabulary', 'description' => 'Từ vựng chung, thông dụng trong giao tiếp hàng ngày.'],
            ['key' => 'v_topic_specific', 'category' => 'vocabulary', 'name' => 'Topic-Specific Vocabulary', 'description' => 'Từ vựng theo chủ đề: giáo dục, công nghệ, môi trường, sức khỏe...'],
            ['key' => 'v_academic', 'category' => 'vocabulary', 'name' => 'Academic Vocabulary', 'description' => 'Từ vựng học thuật (Academic Word List): analyze, significant, impact...'],
            ['key' => 'v_collocations', 'category' => 'vocabulary', 'name' => 'Collocations', 'description' => 'Kết hợp từ tự nhiên: make a decision, heavy rain, strong argument.'],
            ['key' => 'v_idioms', 'category' => 'vocabulary', 'name' => 'Idioms & Fixed Expressions', 'description' => 'Thành ngữ và cụm từ cố định: at the end of the day, by and large.'],
            ['key' => 'v_word_formation', 'category' => 'vocabulary', 'name' => 'Word Formation', 'description' => 'Cấu tạo từ: prefix, suffix, conversion (beauty → beautiful → beautifully).'],
            ['key' => 'v_synonyms_antonyms', 'category' => 'vocabulary', 'name' => 'Synonyms & Antonyms', 'description' => 'Từ đồng nghĩa/trái nghĩa để paraphrase và tránh lặp từ.'],
            ['key' => 'v_phrasal_verbs', 'category' => 'vocabulary', 'name' => 'Phrasal Verbs', 'description' => 'Cụm động từ: look up, break down, come across, figure out.'],
            ['key' => 'v_linking_words', 'category' => 'vocabulary', 'name' => 'Linking Words & Transitions', 'description' => 'Từ nối: however, moreover, consequently, on the other hand, in contrast.'],

            // ── Discourse ───────────────────────────────────────────
            ['key' => 'd_discourse', 'category' => 'discourse', 'name' => 'Discourse', 'description' => 'Khả năng tổ chức và liên kết ngôn ngữ ở cấp độ trên câu: đoạn văn, bài viết, bài nói.'],
            ['key' => 'd_coherence', 'category' => 'discourse', 'name' => 'Coherence', 'description' => 'Mạch lạc tổng thể: ý tưởng logic, người đọc/nghe dễ theo dõi.'],
            ['key' => 'd_cohesion', 'category' => 'discourse', 'name' => 'Cohesion', 'description' => 'Liên kết hình thức: từ nối, đại từ chỉ thị, từ đồng nghĩa thay thế.'],
            ['key' => 'd_paragraphing', 'category' => 'discourse', 'name' => 'Paragraphing', 'description' => 'Phân đoạn: mỗi đoạn 1 ý chính, topic sentence, supporting details.'],
            ['key' => 'd_topic_sentences', 'category' => 'discourse', 'name' => 'Topic Sentences', 'description' => 'Câu chủ đề đầu đoạn, giới thiệu ý chính của đoạn văn.'],
            ['key' => 'd_essay_structure', 'category' => 'discourse', 'name' => 'Essay Structure', 'description' => 'Cấu trúc bài luận: mở bài (thesis), thân bài (body paragraphs), kết luận.'],
            ['key' => 'd_argument_development', 'category' => 'discourse', 'name' => 'Argument Development', 'description' => 'Phát triển lập luận: claim → evidence → explanation → link back.'],
            ['key' => 'd_register_tone', 'category' => 'discourse', 'name' => 'Register & Tone', 'description' => 'Văn phong phù hợp: formal vs informal, academic vs conversational.'],
            ['key' => 'd_referencing', 'category' => 'discourse', 'name' => 'Referencing & Substitution', 'description' => 'Dùng đại từ, từ thay thế để tránh lặp: this, such, the former.'],

            // ── Pronunciation ───────────────────────────────────────
            ['key' => 'p_individual_sounds', 'category' => 'pronunciation', 'name' => 'Individual Sounds', 'description' => 'Phát âm đúng nguyên âm và phụ âm tiếng Anh.'],
            ['key' => 'p_minimal_pairs', 'category' => 'pronunciation', 'name' => 'Minimal Pairs', 'description' => 'Phân biệt cặp âm tối thiểu: ship/sheep, bad/bed, light/right, think/sink — lỗi phổ biến người Việt.'],
            ['key' => 'p_vowels', 'category' => 'pronunciation', 'name' => 'Vowel Sounds', 'description' => 'Phân biệt nguyên âm: /ɪ/ vs /iː/, /æ/ vs /e/, /ɒ/ vs /ɔː/.'],
            ['key' => 'p_consonants', 'category' => 'pronunciation', 'name' => 'Consonant Sounds', 'description' => 'Phụ âm khó: /θ/ /ð/, /ʃ/ /ʒ/, /r/ /l/, phụ âm cuối.'],
            ['key' => 'p_final_consonants', 'category' => 'pronunciation', 'name' => 'Final Consonants', 'description' => 'Phát âm phụ âm cuối: -ed, -s, consonant clusters (texts, months).'],
            ['key' => 'p_word_stress', 'category' => 'pronunciation', 'name' => 'Word Stress', 'description' => 'Trọng âm từ: photograph, photography, photographic.'],
            ['key' => 'p_sentence_stress', 'category' => 'pronunciation', 'name' => 'Sentence Stress', 'description' => 'Trọng âm câu: nhấn content words, giảm function words.'],
            ['key' => 'p_intonation', 'category' => 'pronunciation', 'name' => 'Intonation', 'description' => 'Ngữ điệu: rising (questions), falling (statements), fall-rise (uncertainty).'],
            ['key' => 'p_connected_speech', 'category' => 'pronunciation', 'name' => 'Connected Speech', 'description' => 'Nối âm, nuốt âm, đồng hóa âm trong lời nói tự nhiên.'],
            ['key' => 'p_rhythm', 'category' => 'pronunciation', 'name' => 'Rhythm & Pacing', 'description' => 'Nhịp điệu stress-timed, tốc độ nói tự nhiên, ngắt nghỉ hợp lý.'],

            // ── Strategy ────────────────────────────────────────────
            ['key' => 's_writing_planning', 'category' => 'strategy', 'name' => 'Writing Planning', 'description' => 'Lập dàn ý trước khi viết. Brainstorm, outline, thesis statement.'],
            ['key' => 's_self_correction', 'category' => 'strategy', 'name' => 'Self-Correction', 'description' => 'Tự sửa lỗi khi nói: nhận ra sai → sửa ngay → tiếp tục.'],
            ['key' => 's_paraphrasing', 'category' => 'strategy', 'name' => 'Paraphrasing', 'description' => 'Diễn đạt lại bằng từ khác khi không nhớ từ chính xác.'],
            ['key' => 's_elaboration', 'category' => 'strategy', 'name' => 'Elaboration', 'description' => 'Phát triển ý: đưa ra ví dụ, giải thích, so sánh, đối chiếu.'],
            ['key' => 's_time_management', 'category' => 'strategy', 'name' => 'Time Management', 'description' => 'Quản lý thời gian: phân bổ thời gian cho planning, writing, reviewing.'],
        ];
    }

    /**
     * Edge definitions: [parent_key, child_key, relation].
     * Relations: part_of, prerequisite, related.
     */
    private function edgeDefinitions(): array
    {
        return [
            // ── Sentence Structure hierarchy ────────────────────────
            ['g_sentence_structure', 'g_simple_sentences', 'part_of'],
            ['g_sentence_structure', 'g_compound_sentences', 'part_of'],
            ['g_sentence_structure', 'g_complex_sentences', 'part_of'],
            ['g_simple_sentences', 'g_compound_sentences', 'prerequisite'],
            ['g_compound_sentences', 'g_complex_sentences', 'prerequisite'],
            ['g_complex_sentences', 'g_relative_clauses', 'part_of'],
            ['g_complex_sentences', 'g_conditional_clauses', 'part_of'],
            ['g_complex_sentences', 'g_noun_clauses', 'part_of'],
            ['g_complex_sentences', 'g_participial_clauses', 'part_of'],
            ['g_complex_sentences', 'g_inversion', 'prerequisite'],
            ['g_complex_sentences', 'g_cleft_sentences', 'prerequisite'],

            // ── Verb System hierarchy ───────────────────────────────
            ['g_verb_system', 'g_tenses_basic', 'part_of'],
            ['g_verb_system', 'g_tenses_perfect', 'part_of'],
            ['g_verb_system', 'g_passive_voice', 'part_of'],
            ['g_verb_system', 'g_modal_verbs', 'part_of'],
            ['g_verb_system', 'g_reported_speech', 'part_of'],
            ['g_verb_system', 'g_subjunctive', 'part_of'],
            ['g_tenses_basic', 'g_tenses_perfect', 'prerequisite'],
            ['g_tenses_basic', 'g_tense_consistency', 'prerequisite'],
            ['g_tenses_basic', 'g_passive_voice', 'prerequisite'],
            ['g_tenses_perfect', 'g_reported_speech', 'prerequisite'],
            ['g_modal_verbs', 'g_subjunctive', 'prerequisite'],

            // ── Agreement & Mechanics ───────────────────────────────
            ['g_agreement', 'g_subject_verb_agreement', 'part_of'],
            ['g_simple_sentences', 'g_subject_verb_agreement', 'prerequisite'],
            ['g_tenses_basic', 'g_subject_verb_agreement', 'prerequisite'],

            // ── Vocabulary hierarchy ────────────────────────────────
            ['v_general', 'v_topic_specific', 'prerequisite'],
            ['v_topic_specific', 'v_academic', 'prerequisite'],
            ['v_general', 'v_collocations', 'prerequisite'],
            ['v_collocations', 'v_idioms', 'prerequisite'],
            ['v_general', 'v_word_formation', 'prerequisite'],
            ['v_general', 'v_synonyms_antonyms', 'prerequisite'],
            ['v_general', 'v_phrasal_verbs', 'prerequisite'],
            ['v_synonyms_antonyms', 'v_linking_words', 'related'],

            // ── Discourse hierarchy ─────────────────────────────────
            ['d_discourse', 'd_coherence', 'part_of'],
            ['d_discourse', 'd_cohesion', 'part_of'],
            ['d_coherence', 'd_cohesion', 'related'],
            ['d_coherence', 'd_paragraphing', 'part_of'],
            ['d_paragraphing', 'd_topic_sentences', 'part_of'],
            ['d_paragraphing', 'd_essay_structure', 'prerequisite'],
            ['d_topic_sentences', 'd_argument_development', 'prerequisite'],
            ['d_cohesion', 'd_referencing', 'part_of'],
            ['v_linking_words', 'd_cohesion', 'related'],
            ['d_essay_structure', 'd_register_tone', 'related'],

            // ── Pronunciation hierarchy ─────────────────────────────
            ['p_individual_sounds', 'p_vowels', 'part_of'],
            ['p_individual_sounds', 'p_consonants', 'part_of'],
            ['p_individual_sounds', 'p_minimal_pairs', 'part_of'],
            ['p_vowels', 'p_minimal_pairs', 'related'],
            ['p_consonants', 'p_minimal_pairs', 'related'],
            ['p_consonants', 'p_final_consonants', 'part_of'],
            ['p_individual_sounds', 'p_word_stress', 'prerequisite'],
            ['p_word_stress', 'p_sentence_stress', 'prerequisite'],
            ['p_sentence_stress', 'p_intonation', 'prerequisite'],
            ['p_individual_sounds', 'p_connected_speech', 'prerequisite'],
            ['p_sentence_stress', 'p_rhythm', 'prerequisite'],
            ['p_intonation', 'p_rhythm', 'prerequisite'],

            // ── Strategy relationships ──────────────────────────────
            ['d_essay_structure', 's_writing_planning', 'related'],
            ['v_synonyms_antonyms', 's_paraphrasing', 'related'],
            ['s_self_correction', 's_paraphrasing', 'related'],
            ['d_argument_development', 's_elaboration', 'related'],

            // ── Cross-category relationships ────────────────────────
            ['g_complex_sentences', 'd_coherence', 'related'],
            ['v_linking_words', 'd_coherence', 'related'],
            ['g_gerunds_infinitives', 'v_collocations', 'related'],
            ['g_articles', 'v_collocations', 'related'],
        ];
    }
}

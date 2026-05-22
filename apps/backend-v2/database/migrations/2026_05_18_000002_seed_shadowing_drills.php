<?php

declare(strict_types=1);

use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillSentence;
use Illuminate\Database\Migrations\Migration;

/**
 * Seed shadowing drills from FE mock data.
 */
return new class extends Migration
{
    public function up(): void
    {
        $drills = $this->getDrillsData();

        foreach ($drills as $drillData) {
            $drill = PracticeSpeakingDrill::query()->create([
                'slug' => $drillData['slug'],
                'title' => $drillData['title'],
                'description' => $drillData['description'] ?? null,
                'level' => $drillData['level'],
                'estimated_minutes' => $drillData['estimated_minutes'],
                'audio_url' => $drillData['audio_url'] ?? null,
                'is_published' => true,
            ]);

            foreach ($drillData['segments'] as $i => $seg) {
                PracticeSpeakingDrillSentence::query()->create([
                    'drill_id' => $drill->id,
                    'display_order' => $seg['index'] ?? $i,
                    'text' => $seg['text'],
                    'ipa' => $seg['ipa'] ?? null,
                    'translation' => $seg['translation'] ?? null,
                    'word_count' => $seg['word_count'] ?? str_word_count($seg['text']),
                    'audio_start' => $seg['audio_start'] ?? null,
                    'audio_end' => $seg['audio_end'] ?? null,
                ]);
            }
        }
    }

    public function down(): void
    {
        $slugs = [
            'star-wars-opening',
            'ted-talk-motivation',
            'daily-routine',
            'travel-at-the-airport',
            'news-climate-change',
            'friends-the-one-where',
            'campus-tour',
            'environment-discussion',
            'technology-in-education',
            'academic-lecture',
        ];

        PracticeSpeakingDrill::whereIn('slug', $slugs)->delete();
    }

    private function getDrillsData(): array
    {
        return [
            [
                'slug' => 'star-wars-opening',
                'title' => 'Star Wars — Opening Crawl',
                'level' => 'B1',
                'estimated_minutes' => 15,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Dropping out of light speed, a fleet of rebel spaceships is greeted by a frenzy of laser blasts,', 'ipa' => 'ˈdrɑːpɪŋ aʊt əv laɪt spiːd, ə fliːt əv ˈrɛbəl ˈspeɪsʃɪps ɪz ˈɡriːtɪd baɪ ə ˈfrɛnzi əv ˈleɪzər blæsts', 'translation' => 'Thoát ra khỏi tốc độ ánh sáng, một hạm đội tàu vũ trụ phiến quân bị chào đón bởi cơn cuồng nộ của tia laser,', 'word_count' => 18, 'audio_start' => 0, 'audio_end' => 6.5],
                    ['index' => 1, 'text' => 'illuminating the sector with brilliant bursts of light.', 'ipa' => 'ɪˈluːmɪn,eɪrɪŋ ðə ˈsɛktər wɪð ˈbrɪliənt bɜːrsts ʌv laɪt', 'translation' => 'chiếu sáng cả khu vực bằng những tia sáng rực rỡ.', 'word_count' => 8, 'audio_start' => 6.5, 'audio_end' => 10.2],
                    ['index' => 2, 'text' => 'The Rebel cruiser is under attack from the deadly Imperial Star Destroyer.', 'ipa' => 'ðə ˈrɛbəl ˈkruːzər ɪz ˈʌndər əˈtæk frəm ðə ˈdɛdli ɪmˈpɪriəl stɑːr dɪˈstrɔɪər', 'translation' => 'Tàu tuần dương Phiến quân đang bị tấn công bởi Ngôi sao Huỷ diệt Đế chế chết chóc.', 'word_count' => 12, 'audio_start' => 10.2, 'audio_end' => 15.0],
                    ['index' => 3, 'text' => 'Amid the crossfire, a small spacecraft emerges from the chaos.', 'ipa' => 'əˈmɪd ðə ˈkrɒsfaɪər, ə smɔːl ˈspeɪskræft ɪˈmɜːrdʒɪz frəm ðə ˈkeɪɒs', 'translation' => 'Giữa làn đạn chéo, một tàu vũ trụ nhỏ xuất hiện từ hỗn loạn.', 'word_count' => 10, 'audio_start' => 15.0, 'audio_end' => 19.5],
                    ['index' => 4, 'text' => 'It races toward the massive planet below, desperate to escape.', 'ipa' => 'ɪt ˈreɪsɪz təˈwɔːrd ðə ˈmæsɪv ˈplænɪt bɪˈloʊ, ˈdɛspərɪt tuː ɪˈskeɪp', 'translation' => 'Nó lao về phía hành tinh khổng lồ bên dưới, tuyệt vọng tìm cách thoát thân.', 'word_count' => 10, 'audio_start' => 19.5, 'audio_end' => 23.8],
                    ['index' => 5, 'text' => 'The Imperial cruiser fires relentlessly, shaking the smaller vessel.', 'ipa' => 'ðə ɪmˈpɪriəl ˈkruːzər ˈfaɪərz rɪˈlɛntləsli, ˈʃeɪkɪŋ ðə ˈsmɔːlər ˈvɛsəl', 'translation' => 'Tàu tuần dương Đế chế bắn không ngừng, làm rung chuyển con tàu nhỏ hơn.', 'word_count' => 9, 'audio_start' => 23.8, 'audio_end' => 28.0],
                    ['index' => 6, 'text' => 'Inside the Rebel ship, alarms blare and crew members rush to their stations.', 'ipa' => 'ɪnˈsaɪd ðə ˈrɛbəl ʃɪp, əˈlɑːrmz blɛr ænd kruː ˈmɛmbərz rʌʃ tuː ðɛr ˈsteɪʃənz', 'translation' => 'Bên trong tàu Phiến quân, còi báo động vang lên và các thành viên phi hành đoàn chạy đến vị trí.', 'word_count' => 13, 'audio_start' => 28.0, 'audio_end' => 33.5],
                    ['index' => 7, 'text' => 'A direct hit sends sparks flying across the corridor.', 'ipa' => 'ə dɪˈrɛkt hɪt sɛndz spɑːrks ˈflaɪɪŋ əˈkrɒs ðə ˈkɒrɪdɔːr', 'translation' => 'Một phát bắn trúng đích khiến tia lửa bay khắp hành lang.', 'word_count' => 9, 'audio_start' => 33.5, 'audio_end' => 37.0],
                    ['index' => 8, 'text' => 'Two droids stumble through the smoke-filled passageway.', 'ipa' => 'tuː drɔɪdz ˈstʌmbəl θruː ðə smoʊk-fɪld ˈpæsɪdʒweɪ', 'translation' => 'Hai robot loạng choạng đi qua lối đi đầy khói.', 'word_count' => 7, 'audio_start' => 37.0, 'audio_end' => 40.5],
                    ['index' => 9, 'text' => 'The golden protocol droid turns to his companion in panic.', 'ipa' => 'ðə ˈɡoʊldən ˈproʊtəkɒl drɔɪd tɜːrnz tuː hɪz kəmˈpænjən ɪn ˈpænɪk', 'translation' => 'Robot giao thức vàng quay sang bạn đồng hành trong hoảng loạn.', 'word_count' => 10, 'audio_start' => 40.5, 'audio_end' => 44.8],
                ],
            ],
            [
                'slug' => 'daily-routine',
                'title' => 'My Daily Routine',
                'level' => 'A1',
                'estimated_minutes' => 8,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'I wake up at seven o\'clock every morning.', 'ipa' => 'aɪ weɪk ʌp æt ˈsɛvən əˈklɒk ˈɛvri ˈmɔːrnɪŋ', 'translation' => 'Tôi thức dậy lúc bảy giờ mỗi sáng.', 'word_count' => 8, 'audio_start' => 0, 'audio_end' => 3],
                    ['index' => 1, 'text' => 'First, I brush my teeth and wash my face.', 'ipa' => 'fɜːrst, aɪ brʌʃ maɪ tiːθ ænd wɒʃ maɪ feɪs', 'translation' => 'Đầu tiên, tôi đánh răng và rửa mặt.', 'word_count' => 9, 'audio_start' => 3, 'audio_end' => 6],
                    ['index' => 2, 'text' => 'Then I have breakfast with my family.', 'ipa' => 'ðɛn aɪ hæv ˈbrɛkfəst wɪð maɪ ˈfæmɪli', 'translation' => 'Sau đó tôi ăn sáng cùng gia đình.', 'word_count' => 7, 'audio_start' => 6, 'audio_end' => 9],
                    ['index' => 3, 'text' => 'I usually eat bread and drink milk.', 'ipa' => 'aɪ ˈjuːʒuəli iːt brɛd ænd drɪŋk mɪlk', 'translation' => 'Tôi thường ăn bánh mì và uống sữa.', 'word_count' => 7, 'audio_start' => 9, 'audio_end' => 12],
                    ['index' => 4, 'text' => 'After breakfast, I go to school by bus.', 'ipa' => 'ˈæftər ˈbrɛkfəst, aɪ ɡoʊ tuː skuːl baɪ bʌs', 'translation' => 'Sau bữa sáng, tôi đi học bằng xe buýt.', 'word_count' => 8, 'audio_start' => 12, 'audio_end' => 15],
                    ['index' => 5, 'text' => 'School starts at eight and finishes at three.', 'ipa' => 'skuːl stɑːrts æt eɪt ænd ˈfɪnɪʃɪz æt θriː', 'translation' => 'Trường bắt đầu lúc tám giờ và kết thúc lúc ba giờ.', 'word_count' => 8, 'audio_start' => 15, 'audio_end' => 18],
                    ['index' => 6, 'text' => 'In the evening, I do my homework.', 'ipa' => 'ɪn ðə ˈiːvnɪŋ, aɪ duː maɪ ˈhoʊmwɜːrk', 'translation' => 'Buổi tối, tôi làm bài tập về nhà.', 'word_count' => 7, 'audio_start' => 18, 'audio_end' => 21],
                    ['index' => 7, 'text' => 'I go to bed at ten o\'clock.', 'ipa' => 'aɪ ɡoʊ tuː bɛd æt tɛn əˈklɒk', 'translation' => 'Tôi đi ngủ lúc mười giờ.', 'word_count' => 7, 'audio_start' => 21, 'audio_end' => 24],
                ],
            ],
            [
                'slug' => 'travel-at-the-airport',
                'title' => 'At the Airport',
                'level' => 'A2',
                'estimated_minutes' => 12,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Excuse me, where is the check-in counter for flight VN123?', 'ipa' => 'ɪkˈskjuːz miː, wɛr ɪz ðə ˈtʃɛkɪn ˈkaʊntər fɔːr flaɪt viː-ɛn wʌn-tuː-θriː', 'translation' => 'Xin lỗi, quầy làm thủ tục cho chuyến bay VN123 ở đâu?', 'word_count' => 10, 'audio_start' => 0, 'audio_end' => 4],
                    ['index' => 1, 'text' => 'It\'s on the second floor, near gate B.', 'ipa' => 'ɪts ɒn ðə ˈsɛkənd flɔːr, nɪr ɡeɪt biː', 'translation' => 'Nó ở tầng hai, gần cổng B.', 'word_count' => 8, 'audio_start' => 4, 'audio_end' => 7],
                    ['index' => 2, 'text' => 'May I see your passport and ticket, please?', 'ipa' => 'meɪ aɪ siː jɔːr ˈpæspɔːrt ænd ˈtɪkɪt, pliːz', 'translation' => 'Tôi có thể xem hộ chiếu và vé của bạn được không?', 'word_count' => 8, 'audio_start' => 7, 'audio_end' => 10],
                    ['index' => 3, 'text' => 'Would you like a window seat or an aisle seat?', 'ipa' => 'wʊd juː laɪk ə ˈwɪndoʊ siːt ɔːr ən aɪl siːt', 'translation' => 'Bạn muốn ghế cạnh cửa sổ hay ghế cạnh lối đi?', 'word_count' => 10, 'audio_start' => 10, 'audio_end' => 14],
                    ['index' => 4, 'text' => 'Please put your luggage on the scale.', 'ipa' => 'pliːz pʊt jɔːr ˈlʌɡɪdʒ ɒn ðə skeɪl', 'translation' => 'Vui lòng đặt hành lý của bạn lên cân.', 'word_count' => 7, 'audio_start' => 14, 'audio_end' => 17],
                    ['index' => 5, 'text' => 'Your baggage is a bit overweight. There\'s an extra fee.', 'ipa' => 'jɔːr ˈbæɡɪdʒ ɪz ə bɪt ˈoʊvərweɪt. ðɛrz ən ˈɛkstrə fiː', 'translation' => 'Hành lý của bạn hơi quá cân. Có phí phụ thu.', 'word_count' => 10, 'audio_start' => 17, 'audio_end' => 21],
                    ['index' => 6, 'text' => 'Boarding will begin in thirty minutes at gate C5.', 'ipa' => 'ˈbɔːrdɪŋ wɪl bɪˈɡɪn ɪn ˈθɜːrti ˈmɪnɪts æt ɡeɪt siː-faɪv', 'translation' => 'Lên máy bay sẽ bắt đầu sau ba mươi phút tại cổng C5.', 'word_count' => 9, 'audio_start' => 21, 'audio_end' => 25],
                    ['index' => 7, 'text' => 'Please have your boarding pass ready.', 'ipa' => 'pliːz hæv jɔːr ˈbɔːrdɪŋ pæs ˈrɛdi', 'translation' => 'Vui lòng chuẩn bị sẵn thẻ lên máy bay.', 'word_count' => 6, 'audio_start' => 25, 'audio_end' => 28],
                    ['index' => 8, 'text' => 'The flight has been delayed due to bad weather.', 'ipa' => 'ðə flaɪt hæz biːn dɪˈleɪd djuː tuː bæd ˈwɛðər', 'translation' => 'Chuyến bay đã bị hoãn do thời tiết xấu.', 'word_count' => 9, 'audio_start' => 28, 'audio_end' => 32],
                    ['index' => 9, 'text' => 'We apologize for any inconvenience caused.', 'ipa' => 'wiː əˈpɒlədʒaɪz fɔːr ˈɛni ɪnkənˈviːniəns kɔːzd', 'translation' => 'Chúng tôi xin lỗi vì bất kỳ sự bất tiện nào gây ra.', 'word_count' => 6, 'audio_start' => 32, 'audio_end' => 36],
                ],
            ],
            [
                'slug' => 'ted-talk-motivation',
                'title' => 'TED Talk — The Power of Habit',
                'level' => 'B2',
                'estimated_minutes' => 20,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Habits are the invisible architecture of daily life.', 'ipa' => 'ˈhæbɪts ɑːr ðə ɪnˈvɪzəbəl ˈɑːrkɪtɛktʃər əv ˈdeɪli laɪf', 'translation' => 'Thói quen là kiến trúc vô hình của cuộc sống hàng ngày.', 'word_count' => 8, 'audio_start' => 0, 'audio_end' => 4],
                    ['index' => 1, 'text' => 'We repeat about forty percent of our behavior almost daily.', 'ipa' => 'wiː rɪˈpiːt əˈbaʊt ˈfɔːrti pərˈsɛnt əv ˈaʊər bɪˈheɪvjər ˈɔːlmoʊst ˈdeɪli', 'translation' => 'Chúng ta lặp lại khoảng bốn mươi phần trăm hành vi gần như hàng ngày.', 'word_count' => 10, 'audio_start' => 4, 'audio_end' => 9],
                    ['index' => 2, 'text' => 'The key to changing your life is to change your habits.', 'ipa' => 'ðə kiː tuː ˈtʃeɪndʒɪŋ jɔːr laɪf ɪz tuː tʃeɪndʒ jɔːr ˈhæbɪts', 'translation' => 'Chìa khóa để thay đổi cuộc sống là thay đổi thói quen.', 'word_count' => 12, 'audio_start' => 9, 'audio_end' => 14],
                    ['index' => 3, 'text' => 'Every habit has three components: a cue, a routine, and a reward.', 'ipa' => 'ˈɛvri ˈhæbɪt hæz θriː kəmˈpoʊnənts: ə kjuː, ə ruːˈtiːn, ænd ə rɪˈwɔːrd', 'translation' => 'Mỗi thói quen có ba thành phần: tín hiệu, thói quen, và phần thưởng.', 'word_count' => 12, 'audio_start' => 14, 'audio_end' => 20],
                    ['index' => 4, 'text' => 'The cue triggers your brain to start the behavior.', 'ipa' => 'ðə kjuː ˈtrɪɡərz jɔːr breɪn tuː stɑːrt ðə bɪˈheɪvjər', 'translation' => 'Tín hiệu kích hoạt não bạn bắt đầu hành vi.', 'word_count' => 9, 'audio_start' => 20, 'audio_end' => 25],
                    ['index' => 5, 'text' => 'The routine is the behavior itself, either physical or mental.', 'ipa' => 'ðə ruːˈtiːn ɪz ðə bɪˈheɪvjər ɪtˈsɛlf, ˈaɪðər ˈfɪzɪkəl ɔːr ˈmɛntəl', 'translation' => 'Thói quen là hành vi, có thể là thể chất hoặc tinh thần.', 'word_count' => 10, 'audio_start' => 25, 'audio_end' => 31],
                    ['index' => 6, 'text' => 'The reward helps your brain decide if this loop is worth remembering.', 'ipa' => 'ðə rɪˈwɔːrd hɛlps jɔːr breɪn dɪˈsaɪd ɪf ðɪs luːp ɪz wɜːrθ rɪˈmɛmbərɪŋ', 'translation' => 'Phần thưởng giúp não quyết định xem vòng lặp này có đáng nhớ không.', 'word_count' => 12, 'audio_start' => 31, 'audio_end' => 37],
                    ['index' => 7, 'text' => 'Small changes can have a profound impact over time.', 'ipa' => 'smɔːl ˈtʃeɪndʒɪz kæn hæv ə prəˈfaʊnd ˈɪmpækt ˈoʊvər taɪm', 'translation' => 'Những thay đổi nhỏ có thể có tác động sâu sắc theo thời gian.', 'word_count' => 9, 'audio_start' => 37, 'audio_end' => 42],
                    ['index' => 8, 'text' => 'Focus on building one good habit at a time.', 'ipa' => 'ˈfoʊkəs ɒn ˈbɪldɪŋ wʌn ɡʊd ˈhæbɪt æt ə taɪm', 'translation' => 'Tập trung xây dựng một thói quen tốt mỗi lần.', 'word_count' => 9, 'audio_start' => 42, 'audio_end' => 46],
                    ['index' => 9, 'text' => 'Consistency is more important than intensity.', 'ipa' => 'kənˈsɪstənsi ɪz mɔːr ɪmˈpɔːrtənt ðæn ɪnˈtɛnsɪti', 'translation' => 'Sự nhất quán quan trọng hơn cường độ.', 'word_count' => 6, 'audio_start' => 46, 'audio_end' => 50],
                    ['index' => 10, 'text' => 'Your habits shape your identity, and your identity shapes your habits.', 'ipa' => 'jɔːr ˈhæbɪts ʃeɪp jɔːr aɪˈdɛntɪti, ænd jɔːr aɪˈdɛntɪti ʃeɪps jɔːr ˈhæbɪts', 'translation' => 'Thói quen định hình bản sắc, và bản sắc định hình thói quen.', 'word_count' => 11, 'audio_start' => 50, 'audio_end' => 56],
                    ['index' => 11, 'text' => 'Decide the type of person you want to be, then prove it with small wins.', 'ipa' => 'dɪˈsaɪd ðə taɪp əv ˈpɜːrsən juː wɒnt tuː biː, ðɛn pruːv ɪt wɪð smɔːl wɪnz', 'translation' => 'Quyết định loại người bạn muốn trở thành, rồi chứng minh bằng chiến thắng nhỏ.', 'word_count' => 15, 'audio_start' => 56, 'audio_end' => 62],
                ],
            ],
            [
                'slug' => 'news-climate-change',
                'title' => 'News — Climate Change',
                'level' => 'B2',
                'estimated_minutes' => 18,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Global temperatures have risen by over one degree Celsius since pre-industrial times.', 'ipa' => 'ˈɡloʊbəl ˈtɛmpərətʃərz hæv ˈrɪzən baɪ ˈoʊvər wʌn dɪˈɡriː ˈsɛlsiəs sɪns priː-ɪnˈdʌstriəl taɪmz', 'translation' => 'Nhiệt độ toàn cầu đã tăng hơn một độ C kể từ thời tiền công nghiệp.', 'word_count' => 12, 'audio_start' => 0, 'audio_end' => 6],
                    ['index' => 1, 'text' => 'Scientists warn that we must limit warming to 1.5 degrees.', 'ipa' => 'ˈsaɪəntɪsts wɔːrn ðæt wiː mʌst ˈlɪmɪt ˈwɔːrmɪŋ tuː wʌn pɔɪnt faɪv dɪˈɡriːz', 'translation' => 'Các nhà khoa học cảnh báo phải hạn chế sự nóng lên ở mức 1,5 độ.', 'word_count' => 10, 'audio_start' => 6, 'audio_end' => 11],
                    ['index' => 2, 'text' => 'Extreme weather events are becoming more frequent and severe.', 'ipa' => 'ɪkˈstriːm ˈwɛðər ɪˈvɛnts ɑːr bɪˈkʌmɪŋ mɔːr ˈfriːkwənt ænd sɪˈvɪr', 'translation' => 'Các hiện tượng thời tiết cực đoan ngày càng thường xuyên và nghiêm trọng.', 'word_count' => 9, 'audio_start' => 11, 'audio_end' => 16],
                    ['index' => 3, 'text' => 'Rising sea levels threaten coastal communities worldwide.', 'ipa' => 'ˈraɪzɪŋ siː ˈlɛvəlz ˈθrɛtən ˈkoʊstəl kəˈmjuːnɪtiz ˈwɜːrldwaɪd', 'translation' => 'Mực nước biển dâng đe dọa các cộng đồng ven biển trên toàn thế giới.', 'word_count' => 7, 'audio_start' => 16, 'audio_end' => 21],
                    ['index' => 4, 'text' => 'Renewable energy adoption has accelerated in recent years.', 'ipa' => 'rɪˈnjuːəbəl ˈɛnərdʒi əˈdɒpʃən hæz əkˈsɛləreɪtɪd ɪn ˈriːsənt jɪrz', 'translation' => 'Việc áp dụng năng lượng tái tạo đã tăng tốc trong những năm gần đây.', 'word_count' => 8, 'audio_start' => 21, 'audio_end' => 26],
                    ['index' => 5, 'text' => 'Many countries have pledged to achieve net-zero emissions by 2050.', 'ipa' => 'ˈmɛni ˈkʌntriz hæv plɛdʒd tuː əˈtʃiːv nɛt-ˈzɪroʊ ɪˈmɪʃənz baɪ tuː-oʊ-faɪv-oʊ', 'translation' => 'Nhiều quốc gia đã cam kết đạt mức phát thải ròng bằng không vào năm 2050.', 'word_count' => 10, 'audio_start' => 26, 'audio_end' => 32],
                    ['index' => 6, 'text' => 'Individual actions, while important, cannot solve the crisis alone.', 'ipa' => 'ˌɪndɪˈvɪdʒuəl ˈækʃənz, waɪl ɪmˈpɔːrtənt, ˈkænɒt sɒlv ðə ˈkraɪsɪs əˈloʊn', 'translation' => 'Hành động cá nhân, dù quan trọng, không thể giải quyết khủng hoảng một mình.', 'word_count' => 9, 'audio_start' => 32, 'audio_end' => 38],
                    ['index' => 7, 'text' => 'Systemic change requires cooperation between governments and industries.', 'ipa' => 'sɪsˈtɛmɪk tʃeɪndʒ rɪˈkwaɪərz koʊˌɒpəˈreɪʃən bɪˈtwiːn ˈɡʌvərnmənts ænd ˈɪndəstriz', 'translation' => 'Thay đổi hệ thống đòi hỏi hợp tác giữa chính phủ và các ngành công nghiệp.', 'word_count' => 8, 'audio_start' => 38, 'audio_end' => 44],
                ],
            ],
            [
                'slug' => 'friends-the-one-where',
                'title' => 'Friends — The One Where...',
                'level' => 'B1',
                'estimated_minutes' => 14,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Could this day get any worse?', 'ipa' => 'kʊd ðɪs deɪ ɡɛt ˈɛni wɜːrs', 'translation' => 'Ngày hôm nay còn có thể tệ hơn không?', 'word_count' => 6, 'audio_start' => 0, 'audio_end' => 2.5],
                    ['index' => 1, 'text' => 'We were on a break!', 'ipa' => 'wiː wɜːr ɒn ə breɪk', 'translation' => 'Chúng ta đang nghỉ mà!', 'word_count' => 5, 'audio_start' => 2.5, 'audio_end' => 4.5],
                    ['index' => 2, 'text' => 'How you doin\'?', 'ipa' => 'haʊ juː ˈduːɪn', 'translation' => 'Bạn khỏe không?', 'word_count' => 3, 'audio_start' => 4.5, 'audio_end' => 6],
                    ['index' => 3, 'text' => 'Oh my God, I\'ve got to tell you something.', 'ipa' => 'oʊ maɪ ɡɒd, aɪv ɡɒt tuː tɛl juː ˈsʌmθɪŋ', 'translation' => 'Ôi trời ơi, tôi phải nói với bạn điều này.', 'word_count' => 9, 'audio_start' => 6, 'audio_end' => 9],
                    ['index' => 4, 'text' => 'Pivot! Pivot! Pivot!', 'ipa' => 'ˈpɪvət! ˈpɪvət! ˈpɪvət!', 'translation' => 'Xoay! Xoay! Xoay!', 'word_count' => 3, 'audio_start' => 9, 'audio_end' => 11],
                    ['index' => 5, 'text' => 'I\'m not great at the advice. Can I interest you in a sarcastic comment?', 'ipa' => 'aɪm nɒt ɡreɪt æt ðə ədˈvaɪs. kæn aɪ ˈɪntrəst juː ɪn ə sɑːrˈkæstɪk ˈkɒmɛnt', 'translation' => 'Tôi không giỏi cho lời khuyên. Bạn có muốn nghe một bình luận mỉa mai không?', 'word_count' => 14, 'audio_start' => 11, 'audio_end' => 16],
                    ['index' => 6, 'text' => 'Joey doesn\'t share food!', 'ipa' => 'ˈdʒoʊi ˈdʌzənt ʃɛr fuːd', 'translation' => 'Joey không chia sẻ đồ ăn!', 'word_count' => 4, 'audio_start' => 16, 'audio_end' => 18],
                    ['index' => 7, 'text' => 'Welcome to the real world. It sucks. You\'re gonna love it!', 'ipa' => 'ˈwɛlkəm tuː ðə rɪəl wɜːrld. ɪt sʌks. jʊr ˈɡɒnə lʌv ɪt', 'translation' => 'Chào mừng đến thế giới thực. Nó tệ lắm. Bạn sẽ thích nó!', 'word_count' => 11, 'audio_start' => 18, 'audio_end' => 23],
                ],
            ],
            [
                'slug' => 'campus-tour',
                'title' => 'Campus Tour — University Life',
                'level' => 'A2',
                'estimated_minutes' => 10,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Welcome to our university. Let me show you around.', 'ipa' => 'ˈwɛlkəm tuː ˈaʊər ˌjuːnɪˈvɜːrsɪti. lɛt miː ʃoʊ juː əˈraʊnd', 'translation' => 'Chào mừng đến trường đại học của chúng tôi. Để tôi dẫn bạn đi tham quan.', 'word_count' => 9, 'audio_start' => 0, 'audio_end' => 4],
                    ['index' => 1, 'text' => 'This is the main library. It\'s open twenty-four hours.', 'ipa' => 'ðɪs ɪz ðə meɪn ˈlaɪbrɛri. ɪts ˈoʊpən ˈtwɛnti-fɔːr ˈaʊərz', 'translation' => 'Đây là thư viện chính. Nó mở cửa 24 giờ.', 'word_count' => 9, 'audio_start' => 4, 'audio_end' => 8],
                    ['index' => 2, 'text' => 'Students can borrow up to ten books at a time.', 'ipa' => 'ˈstuːdənts kæn ˈbɒroʊ ʌp tuː tɛn bʊks æt ə taɪm', 'translation' => 'Sinh viên có thể mượn tối đa mười cuốn sách một lần.', 'word_count' => 10, 'audio_start' => 8, 'audio_end' => 12],
                    ['index' => 3, 'text' => 'The cafeteria serves breakfast, lunch, and dinner.', 'ipa' => 'ðə ˌkæfəˈtɪriə sɜːrvz ˈbrɛkfəst, lʌntʃ, ænd ˈdɪnər', 'translation' => 'Căng tin phục vụ bữa sáng, trưa và tối.', 'word_count' => 7, 'audio_start' => 12, 'audio_end' => 16],
                    ['index' => 4, 'text' => 'Over there is the sports center with a swimming pool.', 'ipa' => 'ˈoʊvər ðɛr ɪz ðə spɔːrts ˈsɛntər wɪð ə ˈswɪmɪŋ puːl', 'translation' => 'Bên kia là trung tâm thể thao có hồ bơi.', 'word_count' => 10, 'audio_start' => 16, 'audio_end' => 20],
                    ['index' => 5, 'text' => 'The dormitories are a short walk from here.', 'ipa' => 'ðə ˈdɔːrmɪtɔːriz ɑːr ə ʃɔːrt wɔːk frɒm hɪr', 'translation' => 'Ký túc xá chỉ cách đây một đoạn đi bộ ngắn.', 'word_count' => 8, 'audio_start' => 20, 'audio_end' => 24],
                    ['index' => 6, 'text' => 'Each room has Wi-Fi and air conditioning.', 'ipa' => 'iːtʃ ruːm hæz ˈwaɪfaɪ ænd ɛr kənˈdɪʃənɪŋ', 'translation' => 'Mỗi phòng đều có Wi-Fi và điều hòa.', 'word_count' => 7, 'audio_start' => 24, 'audio_end' => 28],
                    ['index' => 7, 'text' => 'Do you have any questions about campus life?', 'ipa' => 'duː juː hæv ˈɛni ˈkwɛstʃənz əˈbaʊt ˈkæmpəs laɪf', 'translation' => 'Bạn có câu hỏi nào về cuộc sống ở trường không?', 'word_count' => 8, 'audio_start' => 28, 'audio_end' => 32],
                ],
            ],
            [
                'slug' => 'environment-discussion',
                'title' => 'Discussing Environmental Issues',
                'level' => 'B1',
                'estimated_minutes' => 12,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'What do you think about plastic pollution?', 'ipa' => 'wɒt duː juː θɪŋk əˈbaʊt ˈplæstɪk pəˈluːʃən', 'translation' => 'Bạn nghĩ gì về ô nhiễm nhựa?', 'word_count' => 7, 'audio_start' => 0, 'audio_end' => 3],
                    ['index' => 1, 'text' => 'I believe we should reduce single-use plastics.', 'ipa' => 'aɪ bɪˈliːv wiː ʃʊd rɪˈdjuːs ˈsɪŋɡəl-juːs ˈplæstɪks', 'translation' => 'Tôi tin rằng chúng ta nên giảm nhựa dùng một lần.', 'word_count' => 7, 'audio_start' => 3, 'audio_end' => 7],
                    ['index' => 2, 'text' => 'Recycling is important, but it\'s not enough.', 'ipa' => 'riːˈsaɪklɪŋ ɪz ɪmˈpɔːrtənt, bʌt ɪts nɒt ɪˈnʌf', 'translation' => 'Tái chế quan trọng, nhưng chưa đủ.', 'word_count' => 7, 'audio_start' => 7, 'audio_end' => 11],
                    ['index' => 3, 'text' => 'We need to change our consumption habits.', 'ipa' => 'wiː niːd tuː tʃeɪndʒ ˈaʊər kənˈsʌmpʃən ˈhæbɪts', 'translation' => 'Chúng ta cần thay đổi thói quen tiêu dùng.', 'word_count' => 7, 'audio_start' => 11, 'audio_end' => 15],
                    ['index' => 4, 'text' => 'Public transportation can help reduce emissions.', 'ipa' => 'ˈpʌblɪk ˌtrænspɔːrˈteɪʃən kæn hɛlp rɪˈdjuːs ɪˈmɪʃənz', 'translation' => 'Giao thông công cộng có thể giúp giảm khí thải.', 'word_count' => 6, 'audio_start' => 15, 'audio_end' => 19],
                    ['index' => 5, 'text' => 'I try to use my bike whenever possible.', 'ipa' => 'aɪ traɪ tuː juːz maɪ baɪk wɛnˈɛvər ˈpɒsɪbəl', 'translation' => 'Tôi cố gắng đi xe đạp bất cứ khi nào có thể.', 'word_count' => 8, 'audio_start' => 19, 'audio_end' => 23],
                    ['index' => 6, 'text' => 'Small actions can make a big difference.', 'ipa' => 'smɔːl ˈækʃənz kæn meɪk ə bɪɡ ˈdɪfərəns', 'translation' => 'Hành động nhỏ có thể tạo ra sự khác biệt lớn.', 'word_count' => 7, 'audio_start' => 23, 'audio_end' => 27],
                    ['index' => 7, 'text' => 'We all have a responsibility to protect the planet.', 'ipa' => 'wiː ɔːl hæv ə rɪˌspɒnsəˈbɪlɪti tuː prəˈtɛkt ðə ˈplænɪt', 'translation' => 'Tất cả chúng ta đều có trách nhiệm bảo vệ hành tinh.', 'word_count' => 9, 'audio_start' => 27, 'audio_end' => 32],
                ],
            ],
            [
                'slug' => 'technology-in-education',
                'title' => 'Technology in Education',
                'level' => 'B2',
                'estimated_minutes' => 14,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Technology has transformed the way we learn.', 'ipa' => 'tɛkˈnɒlədʒi hæz trænsˈfɔːrmd ðə weɪ wiː lɜːrn', 'translation' => 'Công nghệ đã thay đổi cách chúng ta học.', 'word_count' => 7, 'audio_start' => 0, 'audio_end' => 4],
                    ['index' => 1, 'text' => 'Online courses make education accessible to everyone.', 'ipa' => 'ˈɒnlaɪn ˈkɔːrsɪz meɪk ˌɛdʒʊˈkeɪʃən əkˈsɛsɪbəl tuː ˈɛvriwʌn', 'translation' => 'Khóa học trực tuyến giúp giáo dục tiếp cận được với mọi người.', 'word_count' => 7, 'audio_start' => 4, 'audio_end' => 9],
                    ['index' => 2, 'text' => 'Students can learn at their own pace.', 'ipa' => 'ˈstuːdənts kæn lɜːrn æt ðɛr oʊn peɪs', 'translation' => 'Học sinh có thể học theo tốc độ riêng của mình.', 'word_count' => 7, 'audio_start' => 9, 'audio_end' => 13],
                    ['index' => 3, 'text' => 'Interactive tools make lessons more engaging.', 'ipa' => 'ˌɪntərˈæktɪv tuːlz meɪk ˈlɛsənz mɔːr ɪnˈɡeɪdʒɪŋ', 'translation' => 'Công cụ tương tác làm cho bài học hấp dẫn hơn.', 'word_count' => 6, 'audio_start' => 13, 'audio_end' => 17],
                    ['index' => 4, 'text' => 'However, screen time should be balanced with other activities.', 'ipa' => 'haʊˈɛvər, skriːn taɪm ʃʊd biː ˈbælənst wɪð ˈʌðər ækˈtɪvɪtiz', 'translation' => 'Tuy nhiên, thời gian trước màn hình cần cân bằng với hoạt động khác.', 'word_count' => 8, 'audio_start' => 17, 'audio_end' => 22],
                    ['index' => 5, 'text' => 'Digital literacy is an essential skill today.', 'ipa' => 'ˈdɪdʒɪtəl ˈlɪtərəsi ɪz ən ɪˈsɛnʃəl skɪl təˈdeɪ', 'translation' => 'Kỹ năng số là kỹ năng thiết yếu ngày nay.', 'word_count' => 7, 'audio_start' => 22, 'audio_end' => 26],
                    ['index' => 6, 'text' => 'AI can personalize learning experiences for each student.', 'ipa' => 'eɪ-aɪ kæn ˈpɜːrsənəlaɪz ˈlɜːrnɪŋ ɪkˈspɪriənsɪz fɔːr iːtʃ ˈstuːdənt', 'translation' => 'AI có thể cá nhân hóa trải nghiệm học cho từng học sinh.', 'word_count' => 8, 'audio_start' => 26, 'audio_end' => 31],
                    ['index' => 7, 'text' => 'The future of education will be a blend of online and offline.', 'ipa' => 'ðə ˈfjuːtʃər əv ˌɛdʒʊˈkeɪʃən wɪl biː ə blɛnd əv ˈɒnlaɪn ænd ˈɒflaɪn', 'translation' => 'Tương lai giáo dục sẽ là sự kết hợp giữa trực tuyến và ngoại tuyến.', 'word_count' => 12, 'audio_start' => 31, 'audio_end' => 37],
                ],
            ],
            [
                'slug' => 'academic-lecture',
                'title' => 'Academic Lecture — Globalization',
                'level' => 'C1',
                'estimated_minutes' => 16,
                'audio_url' => '',
                'segments' => [
                    ['index' => 0, 'text' => 'Globalization refers to the increasing interconnectedness of nations.', 'ipa' => 'ˌɡloʊbəlaɪˈzeɪʃən rɪˈfɜːrz tuː ðə ɪnˈkriːsɪŋ ˌɪntərkəˈnɛktɪdnɪs əv ˈneɪʃənz', 'translation' => 'Toàn cầu hóa đề cập đến sự kết nối ngày càng tăng giữa các quốc gia.', 'word_count' => 8, 'audio_start' => 0, 'audio_end' => 5],
                    ['index' => 1, 'text' => 'It encompasses economic, cultural, and political dimensions.', 'ipa' => 'ɪt ɪnˈkʌmpəsɪz ˌiːkəˈnɒmɪk, ˈkʌltʃərəl, ænd pəˈlɪtɪkəl daɪˈmɛnʃənz', 'translation' => 'Nó bao gồm các khía cạnh kinh tế, văn hóa và chính trị.', 'word_count' => 7, 'audio_start' => 5, 'audio_end' => 10],
                    ['index' => 2, 'text' => 'Trade barriers have been significantly reduced over the past decades.', 'ipa' => 'treɪd ˈbæriərz hæv biːn sɪɡˈnɪfɪkəntli rɪˈdjuːst ˈoʊvər ðə pæst ˈdɛkeɪdz', 'translation' => 'Rào cản thương mại đã giảm đáng kể trong những thập kỷ qua.', 'word_count' => 10, 'audio_start' => 10, 'audio_end' => 16],
                    ['index' => 3, 'text' => 'Multinational corporations now operate across multiple continents.', 'ipa' => 'ˌmʌltiˈnæʃənəl ˌkɔːrpəˈreɪʃənz naʊ ˈɒpəreɪt əˈkrɒs ˈmʌltɪpəl ˈkɒntɪnənts', 'translation' => 'Các tập đoàn đa quốc gia hiện hoạt động trên nhiều châu lục.', 'word_count' => 7, 'audio_start' => 16, 'audio_end' => 22],
                    ['index' => 4, 'text' => 'Critics argue that globalization exacerbates inequality.', 'ipa' => 'ˈkrɪtɪks ˈɑːrɡjuː ðæt ˌɡloʊbəlaɪˈzeɪʃən ɪɡˈzæsərbeɪts ˌɪnɪˈkwɒlɪti', 'translation' => 'Những người phê bình cho rằng toàn cầu hóa làm trầm trọng thêm bất bình đẳng.', 'word_count' => 6, 'audio_start' => 22, 'audio_end' => 27],
                    ['index' => 5, 'text' => 'Supporters contend that it lifts millions out of poverty.', 'ipa' => 'səˈpɔːrtərz kənˈtɛnd ðæt ɪt lɪfts ˈmɪljənz aʊt əv ˈpɒvərti', 'translation' => 'Những người ủng hộ cho rằng nó giúp hàng triệu người thoát nghèo.', 'word_count' => 9, 'audio_start' => 27, 'audio_end' => 33],
                    ['index' => 6, 'text' => 'Cultural exchange has been facilitated by digital communication.', 'ipa' => 'ˈkʌltʃərəl ɪksˈtʃeɪndʒ hæz biːn fəˈsɪlɪteɪtɪd baɪ ˈdɪdʒɪtəl kəˌmjuːnɪˈkeɪʃən', 'translation' => 'Giao lưu văn hóa được thúc đẩy bởi truyền thông số.', 'word_count' => 7, 'audio_start' => 33, 'audio_end' => 39],
                    ['index' => 7, 'text' => 'The debate over globalization\'s merits continues to evolve.', 'ipa' => 'ðə dɪˈbeɪt ˈoʊvər ˌɡloʊbəlaɪˈzeɪʃənz ˈmɛrɪts kənˈtɪnjuːz tuː ɪˈvɒlv', 'translation' => 'Cuộc tranh luận về công đức của toàn cầu hóa tiếp tục phát triển.', 'word_count' => 8, 'audio_start' => 39, 'audio_end' => 45],
                ],
            ],
        ];
    }
};

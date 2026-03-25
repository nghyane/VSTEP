<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\VocabularyTopic;
use App\Models\VocabularyWord;
use Illuminate\Database\Seeder;

class VocabularySeeder extends Seeder
{
    public function run(): void
    {
        $topics = [
            ['name' => 'Education', 'description' => 'Từ vựng về giáo dục, trường học, học tập', 'words' => [
                ['curriculum', '/kəˈrɪkjʊləm/', 'noun', 'Chương trình giảng dạy', ['The school updated its curriculum last year.', 'The national curriculum includes science and math.']],
                ['scholarship', '/ˈskɒlərʃɪp/', 'noun', 'Học bổng', ['She won a scholarship to study abroad.', 'Many scholarships are available for international students.']],
                ['assignment', '/əˈsaɪnmənt/', 'noun', 'Bài tập', ['The assignment is due next Monday.', 'Students must complete all assignments on time.']],
                ['enroll', '/ɪnˈrəʊl/', 'verb', 'Đăng ký (học)', ['He enrolled in an English course.', 'You can enroll online or in person.']],
                ['graduate', '/ˈɡrædʒuət/', 'verb', 'Tốt nghiệp', ['She graduated with honors.', 'After graduating, he found a job immediately.']],
                ['tuition', '/tjuːˈɪʃən/', 'noun', 'Học phí', ['Tuition fees have increased this year.', 'She pays tuition with her part-time job income.']],
                ['lecture', '/ˈlektʃər/', 'noun', 'Bài giảng', ['The professor gave an interesting lecture.', 'Lectures are held in the main hall.']],
                ['semester', '/sɪˈmestər/', 'noun', 'Học kỳ', ['The spring semester starts in February.', 'He took five courses this semester.']],
                ['thesis', '/ˈθiːsɪs/', 'noun', 'Luận văn', ['She is writing her thesis on climate change.', 'The thesis defense is scheduled for June.']],
                ['plagiarism', '/ˈpleɪdʒərɪzəm/', 'noun', 'Đạo văn', ['Plagiarism is a serious academic offense.', 'Use citation to avoid plagiarism.']],
                ['extracurricular', '/ˌekstrəkəˈrɪkjʊlər/', 'adjective', 'Ngoại khóa', ['She participates in many extracurricular activities.', 'Extracurricular clubs meet after school.']],
                ['assessment', '/əˈsesmənt/', 'noun', 'Đánh giá', ['Continuous assessment helps track progress.', 'The final assessment accounts for 50% of the grade.']],
            ]],
            ['name' => 'Environment', 'description' => 'Từ vựng về môi trường, khí hậu, thiên nhiên', 'words' => [
                ['pollution', '/pəˈluːʃən/', 'noun', 'Ô nhiễm', ['Air pollution is a major problem in big cities.', 'Water pollution affects marine life.']],
                ['sustainable', '/səˈsteɪnəbl/', 'adjective', 'Bền vững', ['We need sustainable energy solutions.', 'Sustainable development protects future generations.']],
                ['conservation', '/ˌkɒnsəˈveɪʃən/', 'noun', 'Bảo tồn', ['Wildlife conservation is crucial for biodiversity.', 'The conservation effort saved the species.']],
                ['ecosystem', '/ˈiːkəʊˌsɪstəm/', 'noun', 'Hệ sinh thái', ['The ecosystem was damaged by deforestation.', 'Marine ecosystems are particularly fragile.']],
                ['renewable', '/rɪˈnjuːəbl/', 'adjective', 'Tái tạo được', ['Solar energy is a renewable resource.', 'Countries are investing in renewable energy.']],
                ['deforestation', '/diːˌfɒrɪˈsteɪʃən/', 'noun', 'Phá rừng', ['Deforestation contributes to climate change.', 'The rate of deforestation is alarming.']],
                ['carbon footprint', '/ˈkɑːbən ˈfʊtprɪnt/', 'noun', 'Dấu chân carbon', ['Reducing your carbon footprint helps the planet.', 'Air travel has a large carbon footprint.']],
                ['biodiversity', '/ˌbaɪəʊdaɪˈvɜːsɪti/', 'noun', 'Đa dạng sinh học', ['Biodiversity loss threatens food security.', 'Tropical forests have the highest biodiversity.']],
                ['greenhouse effect', '/ˈɡriːnhaʊs ɪˈfekt/', 'noun', 'Hiệu ứng nhà kính', ['The greenhouse effect causes global warming.', 'CO2 emissions increase the greenhouse effect.']],
                ['extinct', '/ɪkˈstɪŋkt/', 'adjective', 'Tuyệt chủng', ['Many species are becoming extinct.', 'The dodo bird has been extinct for centuries.']],
                ['drought', '/draʊt/', 'noun', 'Hạn hán', ['The drought destroyed crops across the region.', 'Climate change increases the frequency of droughts.']],
                ['emission', '/ɪˈmɪʃən/', 'noun', 'Khí thải', ['Carbon emissions must be reduced.', 'Vehicle emissions contribute to air pollution.']],
            ]],
            ['name' => 'Health & Medicine', 'description' => 'Từ vựng về sức khỏe, y tế, lối sống', 'words' => [
                ['symptom', '/ˈsɪmptəm/', 'noun', 'Triệu chứng', ['Fever is a common symptom of the flu.', 'She showed no symptoms of the disease.']],
                ['diagnosis', '/ˌdaɪəɡˈnəʊsɪs/', 'noun', 'Chẩn đoán', ['The doctor made an accurate diagnosis.', 'Early diagnosis improves treatment outcomes.']],
                ['nutrition', '/njuːˈtrɪʃən/', 'noun', 'Dinh dưỡng', ['Good nutrition is essential for children.', 'She studies nutrition at university.']],
                ['sedentary', '/ˈsedəntəri/', 'adjective', 'Ít vận động', ['A sedentary lifestyle leads to health problems.', 'Office workers often have sedentary jobs.']],
                ['immune system', '/ɪˈmjuːn ˈsɪstəm/', 'noun', 'Hệ miễn dịch', ['A healthy diet strengthens the immune system.', 'Stress weakens the immune system.']],
                ['prescription', '/prɪˈskrɪpʃən/', 'noun', 'Đơn thuốc', ['The doctor wrote a prescription for antibiotics.', 'This medicine requires a prescription.']],
                ['epidemic', '/ˌepɪˈdemɪk/', 'noun', 'Dịch bệnh', ['The flu epidemic affected millions.', 'Governments must prepare for epidemics.']],
                ['chronic', '/ˈkrɒnɪk/', 'adjective', 'Mãn tính', ['She suffers from chronic back pain.', 'Chronic diseases require long-term treatment.']],
                ['therapy', '/ˈθerəpi/', 'noun', 'Liệu pháp', ['Physical therapy helped him recover.', 'She is undergoing speech therapy.']],
                ['well-being', '/ˌwelˈbiːɪŋ/', 'noun', 'Sức khỏe tổng thể', ['Exercise contributes to overall well-being.', 'Mental well-being is as important as physical health.']],
            ]],
            ['name' => 'Technology', 'description' => 'Từ vựng về công nghệ, internet, thiết bị', 'words' => [
                ['artificial intelligence', '/ˌɑːtɪˈfɪʃəl ɪnˈtelɪdʒəns/', 'noun', 'Trí tuệ nhân tạo', ['AI is transforming many industries.', 'Artificial intelligence can analyze data faster than humans.']],
                ['algorithm', '/ˈælɡərɪðəm/', 'noun', 'Thuật toán', ['Social media algorithms determine what you see.', 'The algorithm solved the problem efficiently.']],
                ['cybersecurity', '/ˌsaɪbəsɪˈkjʊərɪti/', 'noun', 'An ninh mạng', ['Cybersecurity threats are increasing.', 'Companies invest heavily in cybersecurity.']],
                ['database', '/ˈdeɪtəbeɪs/', 'noun', 'Cơ sở dữ liệu', ['The information is stored in a database.', 'The database contains millions of records.']],
                ['innovation', '/ˌɪnəˈveɪʃən/', 'noun', 'Đổi mới', ['Technological innovation drives economic growth.', 'The company is known for its innovation.']],
                ['automation', '/ˌɔːtəˈmeɪʃən/', 'noun', 'Tự động hóa', ['Automation may replace many manual jobs.', 'Factory automation has increased productivity.']],
                ['bandwidth', '/ˈbændwɪdθ/', 'noun', 'Băng thông', ['Streaming requires high bandwidth.', 'The bandwidth was insufficient for the video call.']],
                ['cloud computing', '/klaʊd kəmˈpjuːtɪŋ/', 'noun', 'Điện toán đám mây', ['Cloud computing enables remote work.', 'Many businesses have moved to cloud computing.']],
                ['digital literacy', '/ˈdɪdʒɪtəl ˈlɪtərəsi/', 'noun', 'Hiểu biết kỹ thuật số', ['Digital literacy is essential in modern education.', 'Schools should teach digital literacy skills.']],
                ['obsolete', '/ˈɒbsəliːt/', 'adjective', 'Lỗi thời', ['Floppy disks are now obsolete.', 'Technology becomes obsolete quickly.']],
            ]],
            ['name' => 'Society & Culture', 'description' => 'Từ vựng về xã hội, văn hóa, truyền thống', 'words' => [
                ['diversity', '/daɪˈvɜːsɪti/', 'noun', 'Đa dạng', ['Cultural diversity enriches society.', 'The company values diversity in hiring.']],
                ['tradition', '/trəˈdɪʃən/', 'noun', 'Truyền thống', ['The tradition has been practiced for centuries.', 'Family traditions are important in Vietnamese culture.']],
                ['inequality', '/ˌɪnɪˈkwɒlɪti/', 'noun', 'Bất bình đẳng', ['Income inequality continues to grow.', 'Gender inequality remains a global issue.']],
                ['stereotype', '/ˈsteriətaɪp/', 'noun', 'Khuôn mẫu', ['We should challenge negative stereotypes.', 'Media often reinforces stereotypes.']],
                ['heritage', '/ˈherɪtɪdʒ/', 'noun', 'Di sản', ['UNESCO protects world heritage sites.', 'Cultural heritage should be preserved.']],
                ['globalization', '/ˌɡləʊbəlaɪˈzeɪʃən/', 'noun', 'Toàn cầu hóa', ['Globalization has connected economies worldwide.', 'Some criticize globalization for harming local businesses.']],
                ['discrimination', '/dɪˌskrɪmɪˈneɪʃən/', 'noun', 'Phân biệt đối xử', ['Discrimination based on race is illegal.', 'The law protects against workplace discrimination.']],
                ['community', '/kəˈmjuːnɪti/', 'noun', 'Cộng đồng', ['The local community organized a charity event.', 'Online communities connect people with shared interests.']],
            ]],
            ['name' => 'Work & Career', 'description' => 'Từ vựng về công việc, sự nghiệp, doanh nghiệp', 'words' => [
                ['qualification', '/ˌkwɒlɪfɪˈkeɪʃən/', 'noun', 'Bằng cấp, trình độ', ['She has the right qualifications for the job.', 'Academic qualifications are important but not everything.']],
                ['entrepreneur', '/ˌɒntrəprəˈnɜːr/', 'noun', 'Doanh nhân', ['He became a successful entrepreneur.', 'Entrepreneurs take risks to build businesses.']],
                ['productivity', '/ˌprɒdʌkˈtɪvɪti/', 'noun', 'Năng suất', ['Remote work can increase productivity.', 'The team improved their productivity by 20%.']],
                ['resignation', '/ˌrezɪɡˈneɪʃən/', 'noun', 'Sự từ chức', ['She handed in her resignation.', 'The resignation was unexpected.']],
                ['deadline', '/ˈdedlaɪn/', 'noun', 'Hạn chót', ['The deadline for the report is Friday.', 'Meeting deadlines is crucial in business.']],
                ['promotion', '/prəˈməʊʃən/', 'noun', 'Thăng chức', ['She received a well-deserved promotion.', 'Hard work often leads to promotion.']],
                ['collaborate', '/kəˈlæbəreɪt/', 'verb', 'Hợp tác', ['Teams collaborate on projects.', 'The two companies collaborated on the research.']],
                ['freelance', '/ˈfriːlɑːns/', 'adjective', 'Tự do (làm việc)', ['She works as a freelance designer.', 'Freelance work offers flexibility.']],
                ['negotiate', '/nɪˈɡəʊʃieɪt/', 'verb', 'Đàm phán', ['They negotiated a better salary.', 'Negotiating skills are important in business.']],
                ['redundancy', '/rɪˈdʌndənsi/', 'noun', 'Sa thải (do cắt giảm)', ['Many workers faced redundancy during the recession.', 'The company announced 200 redundancies.']],
            ]],
            ['name' => 'Travel & Tourism', 'description' => 'Từ vựng về du lịch, giao thông, lưu trú', 'words' => [
                ['accommodation', '/əˌkɒməˈdeɪʃən/', 'noun', 'Chỗ ở', ['The hotel offers affordable accommodation.', 'Finding accommodation in peak season is difficult.']],
                ['itinerary', '/aɪˈtɪnərəri/', 'noun', 'Lịch trình', ['The travel agency planned our itinerary.', 'We followed a tight itinerary during the trip.']],
                ['excursion', '/ɪkˈskɜːʃən/', 'noun', 'Chuyến tham quan', ['We went on an excursion to the countryside.', 'The boat excursion lasted three hours.']],
                ['destination', '/ˌdestɪˈneɪʃən/', 'noun', 'Điểm đến', ['Paris is a popular tourist destination.', 'What is your final destination?']],
                ['souvenir', '/ˌsuːvəˈnɪər/', 'noun', 'Quà lưu niệm', ['She bought souvenirs for her family.', 'The souvenir shop sells local handicrafts.']],
                ['customs', '/ˈkʌstəmz/', 'noun', 'Hải quan', ['We went through customs at the airport.', 'Customs officials checked our luggage.']],
                ['departure', '/dɪˈpɑːtʃər/', 'noun', 'Sự khởi hành', ['The departure time is 8:00 AM.', 'Check the departure board for updates.']],
                ['hospitality', '/ˌhɒspɪˈtælɪti/', 'noun', 'Lòng hiếu khách', ['Vietnamese hospitality is well known.', 'The hospitality industry employs millions.']],
            ]],
            ['name' => 'Science & Research', 'description' => 'Từ vựng về khoa học, nghiên cứu, phát minh', 'words' => [
                ['hypothesis', '/haɪˈpɒθəsɪs/', 'noun', 'Giả thuyết', ['The scientist tested her hypothesis.', 'The hypothesis was supported by the data.']],
                ['experiment', '/ɪkˈsperɪmənt/', 'noun', 'Thí nghiệm', ['The experiment produced interesting results.', 'They conducted an experiment in the lab.']],
                ['phenomenon', '/fɪˈnɒmɪnən/', 'noun', 'Hiện tượng', ['Global warming is a complex phenomenon.', 'The phenomenon was first observed in 1995.']],
                ['theory', '/ˈθɪəri/', 'noun', 'Lý thuyết', ['Einstein developed the theory of relativity.', 'The theory has been widely accepted.']],
                ['breakthrough', '/ˈbreɪkθruː/', 'noun', 'Bước đột phá', ['Scientists made a breakthrough in cancer research.', 'The breakthrough led to new treatments.']],
                ['methodology', '/ˌmeθəˈdɒlədʒi/', 'noun', 'Phương pháp luận', ['The research methodology was rigorous.', 'Different methodologies yield different results.']],
                ['variable', '/ˈveəriəbl/', 'noun', 'Biến số', ['The experiment controlled all variables.', 'Temperature was the independent variable.']],
                ['correlation', '/ˌkɒrəˈleɪʃən/', 'noun', 'Mối tương quan', ['There is a correlation between exercise and health.', 'Correlation does not imply causation.']],
                ['peer review', '/pɪər rɪˈvjuː/', 'noun', 'Phản biện đồng nghiệp', ['The paper underwent peer review.', 'Peer review ensures research quality.']],
                ['specimen', '/ˈspesɪmən/', 'noun', 'Mẫu vật', ['The lab analyzed the blood specimen.', 'Specimens were collected from the field.']],
            ]],
        ];

        foreach ($topics as $i => $topicData) {
            $words = $topicData['words'];
            $topic = VocabularyTopic::create([
                'name' => $topicData['name'],
                'description' => $topicData['description'],
                'sort_order' => $i + 1,
            ]);

            foreach ($words as $j => $w) {
                VocabularyWord::create([
                    'topic_id' => $topic->id,
                    'word' => $w[0],
                    'phonetic' => $w[1],
                    'part_of_speech' => $w[2],
                    'definition' => $w[3],
                    'examples' => $w[4],
                    'sort_order' => $j + 1,
                ]);
            }
        }
    }
}

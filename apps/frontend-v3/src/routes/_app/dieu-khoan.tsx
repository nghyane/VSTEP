import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"

export const Route = createFileRoute("/_app/dieu-khoan")({
	component: TermsPage,
})

function TermsPage() {
	return (
		<>
			<Header title="Điều khoản hoạt động" />
			<div className="px-10 pb-12">
				<section className="relative overflow-hidden rounded-(--radius-banner) border-2 border-border border-b-4 bg-surface shadow-sm">
					<div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary-tint via-warning/10 to-info/10" />
					<div className="relative p-6 md:p-8">
						<div>
							<p className="max-w-xl text-sm leading-relaxed text-muted">
								Quy định sử dụng dịch vụ và cam kết giữa nền tảng Ôn Thi VSTEP và người dùng. Cập nhật lần
								cuối: 06/2026.
							</p>
						</div>

						<div className="mt-7 space-y-5">
							<TermsSection title="1. Giới thiệu">
								<p>
									Chào mừng bạn đến với hệ thống Ôn Thi VSTEP ("Nền tảng"). Khi truy cập và sử dụng Nền tảng,
									bạn đồng ý tuân thủ các điều khoản và quy định dưới đây. Nếu không đồng ý với bất kỳ điều
									khoản nào, vui lòng ngừng sử dụng dịch vụ.
								</p>
								<p>
									Nền tảng cung cấp các dịch vụ luyện thi VSTEP trực tuyến bao gồm: luyện tập các kỹ năng
									Nghe, Nói, Đọc, Viết, làm bài thi thử, học từ vựng - ngữ pháp, và các khóa học 1-1 với giáo
									viên.
								</p>
							</TermsSection>

							<TermsSection title="2. Tài khoản người dùng">
								<p>
									Người dùng cần đăng ký tài khoản để sử dụng đầy đủ các tính năng của Nền tảng. Bạn chịu
									trách nhiệm bảo mật thông tin đăng nhập, bao gồm mật khẩu và mã xác thực. Mọi hoạt động phát
									sinh từ tài khoản của bạn được xem là do bạn thực hiện.
								</p>
								<p>
									Nghiêm cấm các hành vi: tạo nhiều tài khoản để gian lận, sử dụng tài khoản của người khác,
									truy cập trái phép vào hệ thống, hoặc thực hiện các hành vi gây ảnh hưởng đến hoạt động của
									Nền tảng.
								</p>
								<p>
									Nền tảng có quyền tạm khóa hoặc chấm dứt tài khoản của bạn nếu phát hiện hành vi vi phạm các
									quy định này mà không cần thông báo trước.
								</p>
							</TermsSection>

							<TermsSection title="3. Hệ thống xu (Coin)">
								<p>
									Xu là đơn vị tiền tệ ảo trong Nền tảng, được sử dụng để thanh toán cho các dịch vụ như: mua
									khóa học, đặt lịch 1-1 với giáo viên, thi thử, yêu cầu chấm điểm feedback cho bài luyện tập
									Viết và Nói.
								</p>
								<ul>
									<li>
										Người dùng có thể nạp xu thông qua các gói nạp được niêm yết trong mục Nạp xu. Mỗi gói có
										mức giá và số lượng xu tương ứng (bao gồm xu cơ bản và xu thưởng).
									</li>
									<li>
										Người dùng cũng có thể nhận xu miễn phí thông qua quà chào mừng khi đăng ký tài khoản mới,
										thưởng streak hàng ngày, thưởng khóa học, hoặc mã khuyến mãi từ Nền tảng.
									</li>
									<li>
										Xu không có giá trị quy đổi thành tiền thật và không thể chuyển nhượng giữa các tài khoản.
									</li>
									<li>
										Trong trường hợp giao dịch lỗi hoặc yêu cầu hoàn xu, Nền tảng sẽ xem xét và hoàn xu về tài
										khoản của bạn trong vòng 48 giờ làm việc.
									</li>
								</ul>
							</TermsSection>

							<TermsSection title="4. Thanh toán và đơn hàng">
								<p>
									Tất cả giao dịch nạp xu và mua khóa học được xử lý qua các cổng thanh toán an toàn (PayOS,
									VNPay). Bạn có trách nhiệm kiểm tra kỹ thông tin đơn hàng trước khi thanh toán.
								</p>
								<ul>
									<li>
										Sau khi thanh toán thành công, xu sẽ được cộng vào tài khoản của bạn ngay lập tức. Đối với
										đơn hàng mua khóa học, bạn sẽ được ghi danh tự động vào khóa học tương ứng.
									</li>
									<li>
										Nền tảng không hoàn tiền cho các giao dịch đã thanh toán thành công, trừ trường hợp lỗi hệ
										thống. Các đơn hàng chưa thanh toán sẽ tự động hết hạn sau thời gian quy định.
									</li>
								</ul>
							</TermsSection>

							<TermsSection title="5. Khóa học và đặt lịch 1-1">
								<p>
									Nền tảng cung cấp các khóa học do giáo viên hướng dẫn. Khi đăng ký khóa học, bạn cần cam kết
									tuân thủ nội quy và kỷ luật của khóa học, bao gồm:
								</p>
								<ul>
									<li>Tham gia đầy đủ các buổi học theo lịch.</li>
									<li>Hoàn thành bài tập và nhiệm vụ được giao đúng hạn.</li>
									<li>Tôn trọng giáo viên và các học viên khác trong lớp.</li>
									<li>
										Đối với lịch 1-1, nếu cần hủy buổi học, bạn phải thông báo trước ít nhất 24 giờ. Hủy muộn
										hoặc vắng mặt không báo trước sẽ không được hoàn xu.
									</li>
								</ul>
							</TermsSection>

							<TermsSection title="6. Nội dung và sở hữu trí tuệ">
								<p>
									Tất cả nội dung trên Nền tảng bao gồm: đề thi, bài tập, từ vựng, ngữ pháp, hình ảnh, âm
									thanh, video, và các tài liệu liên quan đều thuộc sở hữu của Nền tảng Ôn Thi VSTEP. Người
									dùng không được sao chép, phân phối, hoặc sử dụng nội dung vào mục đích thương mại khi chưa
									có sự đồng ý bằng văn bản.
								</p>
							</TermsSection>

							<TermsSection title="7. Quyền riêng tư và dữ liệu">
								<p>
									Nền tảng cam kết bảo vệ thông tin cá nhân của người dùng theo quy định của pháp luật Việt
									Nam. Dữ liệu cá nhân chỉ được thu thập và sử dụng cho mục đích cung cấp và cải thiện dịch
									vụ.
								</p>
								<ul>
									<li>
										Dữ liệu học tập của bạn (điểm số, tiến độ, lịch sử luyện tập) được lưu trữ an toàn và chỉ
										bạn mới có quyền truy cập.
									</li>
									<li>
										Nền tảng không chia sẻ thông tin cá nhân của bạn với bên thứ ba, trừ khi được yêu cầu bởi
										cơ quan pháp luật có thẩm quyền.
									</li>
								</ul>
							</TermsSection>

							<TermsSection title="8. Giới hạn trách nhiệm">
								<p>
									Nền tảng nỗ lực cung cấp dịch vụ ổn định, chính xác và liên tục. Tuy nhiên, Nền tảng không
									đảm bảo dịch vụ sẽ không bị gián đoạn hoặc không có lỗi. Trong mọi trường hợp, trách nhiệm
									của Nền tảng được giới hạn ở mức phí dịch vụ bạn đã thanh toán.
								</p>
							</TermsSection>

							<TermsSection title="9. Sửa đổi điều khoản">
								<p>
									Nền tảng có quyền cập nhật hoặc sửa đổi các điều khoản này bất kỳ lúc nào. Các thay đổi sẽ
									có hiệu lực ngay khi được đăng tải lên Nền tảng. Việc bạn tiếp tục sử dụng dịch vụ sau khi
									điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
								</p>
							</TermsSection>

							<TermsSection title="10. Liên hệ">
								<p>
									Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào liên quan đến các điều khoản này, vui lòng liên
									hệ với đội ngũ hỗ trợ của Nền tảng qua:
								</p>
								<ul>
									<li>Gửi phản hồi trực tiếp trong mục Hỗ trợ trên Nền tảng.</li>
									<li>Email: support@onthivstep.vn</li>
								</ul>
							</TermsSection>
						</div>
					</div>
				</section>
			</div>
		</>
	)
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="rounded-(--radius-card) border-2 border-border bg-background/80 p-5 md:p-6">
			<h2 className="text-lg font-extrabold text-foreground">{title}</h2>
			<div className="mt-3 space-y-3 text-sm leading-relaxed text-muted [&>ul]:list-disc [&>ul]:pl-5 [&_li]:mt-1 [&_li]:text-muted">
				{children}
			</div>
		</div>
	)
}

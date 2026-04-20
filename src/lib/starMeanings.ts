import { Coins, Briefcase, GraduationCap, ShieldAlert } from 'lucide-react';

export const STAR_MEANINGS: Record<string, string> = {
  'Tử Vi': 'Tượng trưng cho bậc đế vương, uy quyền, danh vọng và khả năng lãnh đạo cấp cao. Ở mệnh thì người có khí chất sang trọng, tự tôn cao.',
  'Thiên Cơ': 'Chủ về trí tuệ, mưu lược, sự linh hoạt và khả năng tính toán ưu việt. Thường là người khéo léo, hay suy nghĩ.',
  'Thái Dương': 'Đại diện cho mặt trời, công danh, quyền lực, sự minh bạch, nhiệt huyết và phái nam (cha, chồng, con trai).',
  'Vũ Khúc': 'Chủ về tài lộc, kinh tế, sự kiên quyết, hành động thực tế nhưng thường có nét cô độc, ít bộc lộ tình cảm.',
  'Thiên Đồng': 'Phúc tinh, chủ về sự thụ hưởng, ôn hòa, lương thiện, nhàn nhã và đôi khi thiếu ý chí quyết liệt.',
  'Liêm Trinh': 'Đào hoa tinh kiêm chủ về pháp lý. Tượng trưng cho sự nề nếp, nguyên tắc nhưng cũng đa tình, nhạy bén.',
  'Thiên Phủ': 'Kho báu quốc gia, chủ về tài sản, đất đai, sự ổn định, từ tâm, biết lo toan và cẩn trọng trong tài chính.',
  'Thái Âm': 'Đại diện cho mặt trăng, phái nữ (mẹ, vợ, con gái). Chủ về điền sản, sự lãng mạn, tinh tế và giàu có ngầm.',
  'Tham Lang': 'Chủ về dục vọng, giao tiếp, nghệ thuật, sự khéo léo, thích hưởng thụ và dễ thay đổi, biến động.',
  'Cự Môn': 'Ám tinh, chủ về ngôn ngữ, tài ăn nói, biện luận nhưng dễ vướng thị phi, tai tiếng và sự nghi ngờ.',
  'Thiên Tướng': 'Ấn tinh, chủ về sự phò tá, quyền lực uy thế, trung thành, công bằng và thích giúp đỡ người khác.',
  'Thiên Lương': 'Ấm tinh, thọ tinh, chủ về sự che chở, nguyên tắc đạo đức, phong thái người lớn tuổi và sự hiền lành.',
  'Thất Sát': 'Quyền tinh, dũng tướng, chủ về sự sát phạt, quyết đoán, mạo hiểm, dũng mãnh và những biến động lớn.',
  'Phá Quân': 'Hao tinh, đi tiên phong, chủ về sự phá hoại để phôi sinh, đột phá, ly tán và mạo hiểm trong sự nghiệp.',
};

export const MINOR_STAR_MEANINGS: Record<string, string> = {
  'Tả Phù': 'Sao phù trợ đắc lực, chủ về sự giúp bề ngoài, có đông đảo bạn bè, người học và cộng sự ủng hộ nhiệt tình.',
  'Hữu Bật': 'Cặp với Tả Phù, tăng cường sự phò tá, mang lại nguồn lực, nhân sự dồi dào, thuận lợi trong việc xây dựng vây cánh.',
  'Văn Xương': 'Tượng trưng cho khoa giáp, tài năng văn chương, học trí uyên bác, thông minh, lãng mạn, thanh lịch.',
  'Văn Khúc': 'Đi đôi với Văn Xương, thiên về học vị, kỹ năng giao tiếp, tài hùng biện, khéo léo, phát triển mạnh về nghệ thuật/khoa bảng.',
  'Thiên Khôi': 'Quý nhân phù trợ mang tính vĩ mô, cơ hội lớn, người bề trên nâng đỡ lộ diện, thi cử đỗ đạt, công danh thăng tiến.',
  'Thiên Việt': 'Quý nhân ẩn giấu, sự giúp đỡ thiết thực trong lúc khó khăn khốn cùng, cứu sinh giải hạn.',
  'Lộc Tồn': 'Thiên lộc, chủ về của cải tích lũy, sự che chở bảo bọc an toàn, mang đến tài khí thịnh vượng nhưng đôi khi làm tính cách cô độc.',
  'Kình Dương': 'Sét đánh ngang tai, sự quyết liệt, tranh đoạt, xung đột. Nếu đắc địa thì dũng mãnh quả quyết, nếu hãm dễ rủi ro mổ xẻ, va chạm cọ xát.',
  'Đà La': 'Trì trệ, âm ỉ, thị phi, sự khó khăn dai dẳng kéo dài, thường báo hiệu sự vất vả, muộn màng.',
  'Hỏa Tinh': 'Tính hỏa dương cực mạnh, bạo phát, nóng nảy, dễ xảy ra biến cố nhanh chóng mạnh mẽ.',
  'Linh Tinh': 'Âm hỏa, xảo quyệt, cay nghiệt, sự đau buồn ngầm, tai ương đến bất ngờ gây vất vả về nội tâm.',
  'Địa Không': 'Trống rỗng, hụt hẫng, phá bại đột ngột, làm ăn lúc lên lúc xuống, tính toán dễ đi vào ngõ cụt.',
  'Địa Kiếp': 'Suy hao vật chất, mất mát, tai họa ập đến, biến cố lớn gây lật thuyền trong mương, nợ nần gian truân.',
  'Thiên Mã': 'Nghị lực vươn lên mạnh mẽ, là sao của sự biến động, dịch chuyển, bôn ba, càng đi xa càng phát triển (nếu không gặp Tuần/Triệt).',
  'Đào Hoa': 'Duyên dáng, tỏa sáng, thu hút sự chú ý mạnh mẽ của người khác giới, có tài hoa nghệ thuật, nhân duyên nở rộ.',
  'Hồng Loan': 'Hỷ sự, hôn nhân, tính cách ôn hòa, nhẹ nhàng, may mắn về đường tình cảm, đem lại nhiều cung bậc cảm xúc đẹp.',
  'Thiên Khốc': 'Tượng trưng cho sự muộn phiền, giọt nước mắt, nhưng nếu Đắc địa thì lại trở thành vang danh thiên hạ, thành công tột bậc lúc về sau.',
  'Thiên Hư': 'Sự giả tạo, hư hao, suy nhược thể chất hoặc tinh thần, làm việc dễ bị hỏng hóc giữa chừng.',
  'Thái Tuế': 'Chính danh, lý lẽ, quyền uy. Gắn liền với các sự vụ pháp lý, dễ bướng bỉnh, thị phi, nhưng luôn đấu tranh cho sự công chính.',
  'Tuần': 'Sự bao bọc, kìm hãm lúc ban đầu, cản trở nửa đời trước, nhưng che chắn bảo vệ cho cung hãm/xấu.',
  'Triệt': 'Sự đứt gãy, chia cắt mạnh mẽ đột ngột, chặt đứt tác họa của cung xấu nhưng bẻ gãy thuận lợi của cung đẹp.',
};

export const TU_HOA_MEANINGS: Record<string, { title: string, desc: string, icon: any }> = {
  'Hóa Lộc': { title: 'Hóa Lộc', desc: 'Tài lộc đơm hoa, sự sinh sôi nảy nở, của cải dồi dào, kiếm tiền thuận buồm xuôi gió.', icon: Coins },
  'Hóa Quyền': { title: 'Hóa Quyền', desc: 'Thăng quan tiến chức, có quyền lực và uy danh, năng lực quản lý và kiểm soát tốt, sự áp đặt mạnh mẽ.', icon: Briefcase },
  'Hóa Khoa': { title: 'Hóa Khoa', desc: 'Đệ nhất giải thần. Tượng trưng cho sự thông tuệ, thi cử đỗ đạt, thanh danh lan tốt, cứu giải mọi ách nạn.', icon: GraduationCap },
  'Hóa Kỵ': { title: 'Hóa Kỵ', desc: 'Tượng trưng cho sự đố kỵ, thị phi, trở ngại ngưng trệ, gây ra sự khó khăn, hiểu lầm hoặc cản trở lớn.', icon: ShieldAlert },
};

import { generateInviteCode } from "../../src/common/utils";
import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import { logResult, logSection } from "../utils";
import type { SeededUsers } from "./01-users";

export async function seedClasses(db: DbTransaction, users: SeededUsers) {
  logSection("Classes");

  // Create 2 classes, one per instructor
  const classData = [
    {
      name: "VSTEP B2 - Lớp sáng",
      description:
        "Luyện thi VSTEP B2 cho sinh viên năm 3. Học sáng thứ 2, 4, 6.",
      instructorId: users.instructors[0].id,
      inviteCode: generateInviteCode(),
    },
    {
      name: "VSTEP B1 - Lớp tối",
      description: "Luyện thi VSTEP B1 cơ bản. Học tối thứ 3, 5.",
      instructorId: users.instructors[1].id,
      inviteCode: generateInviteCode(),
    },
  ];

  const createdClasses = await db
    .insert(table.classes)
    .values(classData)
    .returning({
      id: table.classes.id,
      name: table.classes.name,
      inviteCode: table.classes.inviteCode,
    });

  logResult("Classes", createdClasses.length);

  // Enroll learners into classes
  // Learner 1 joins both classes, Learner 2 joins only class 1
  const memberData = [
    { classId: createdClasses[0].id, userId: users.learners[0].id },
    { classId: createdClasses[0].id, userId: users.learners[1].id },
    { classId: createdClasses[1].id, userId: users.learners[0].id },
  ];

  const members = await db
    .insert(table.classMembers)
    .values(memberData)
    .returning();

  logResult("Class members", members.length);

  // Add sample feedback from instructors
  const feedbackData = [
    {
      classId: createdClasses[0].id,
      fromUserId: users.instructors[0].id,
      toUserId: users.learners[0].id,
      content:
        "Kỹ năng Listening tiến bộ tốt. Cần tập trung hơn vào phần Reading, đặc biệt là dạng bài True/False/Not Given.",
      skill: "listening" as const,
    },
    {
      classId: createdClasses[0].id,
      fromUserId: users.instructors[0].id,
      toUserId: users.learners[1].id,
      content:
        "Writing Task 2 còn yếu phần lập luận. Nên luyện thêm dạng essay với cấu trúc introduction-body-conclusion rõ ràng hơn.",
      skill: "writing" as const,
    },
    {
      classId: createdClasses[1].id,
      fromUserId: users.instructors[1].id,
      toUserId: users.learners[0].id,
      content:
        "Speaking cần cải thiện phát âm và lưu loát. Đề xuất luyện shadowing mỗi ngày 15 phút với podcast tiếng Anh.",
      skill: "speaking" as const,
    },
  ];

  const feedback = await db
    .insert(table.instructorFeedback)
    .values(feedbackData)
    .returning();

  logResult("Feedback", feedback.length);

  for (const cls of createdClasses) {
    console.log(`  ${cls.name}: invite code = ${cls.inviteCode}`);
  }

  return { classes: createdClasses, members, feedback };
}

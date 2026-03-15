import { ref, get, set, push } from "firebase/database";
import { database } from "./firebase";
import { auth } from "./firebase";

// Convert email to Firebase-safe key
const emailToKey = (email) => {
  return email.replace(/\./g, "_");
};

// Ensure teacher record exists
const ensureTeacherExists = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const emailKey = emailToKey(user.email);
  const teacherRef = ref(database, `teachers/${emailKey}`);

  const snapshot = await get(teacherRef);

  if (!snapshot.exists()) {
    await set(teacherRef, {
      attendance: {},
      current_lesson: "",
      teacher_dash_logs: {}
    });
  }

  return emailKey;
};

// Save attendance
export const saveAttendance = async (date, students) => {
  const emailKey = await ensureTeacherExists();
  if (!emailKey) return;

  await set(
    ref(database, `teachers/${emailKey}/attendance/${date}`),
    students
  );
};

// Save current lesson
export const saveCurrentLesson = async (lessonId) => {
  const emailKey = await ensureTeacherExists();
  if (!emailKey) return;

  await set(
    ref(database, `teachers/${emailKey}/current_lesson`),
    lessonId
  );
};

// Save log
export const saveTeacherLog = async (action, details) => {
  const emailKey = await ensureTeacherExists();
  if (!emailKey) return;

  await push(
    ref(database, `teachers/${emailKey}/teacher_dash_logs`),
    {
      action,
      details,
      timestamp: Date.now()
    }
  );
};
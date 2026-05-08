import { ref, get, set, push, remove } from "firebase/database";
import { database } from "./firebase";
import { auth } from "./firebase";

// Convert email to Firebase-safe key
const emailToKey = (email) => {
  return email.replace(/\./g, "_");
};

// Ensure teacher record exists
const ensureTeacherExists = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Teacher is not logged in.");
  }

  const emailKey = emailToKey(user.email);
  const teacherRef = ref(database, `teachers/${emailKey}`);

  const snapshot = await get(teacherRef);

  if (!snapshot.exists()) {
    await set(teacherRef, {
      attendance: {},
      current_lesson: "",
      student_list: {},
      teacher_dash_logs: {}
    });
  }

  return emailKey;
};

// Add student to teachers/{teacherEmail}/student_list
export const addStudentToList = async ({ firstName, lastName }) => {
  const emailKey = await ensureTeacherExists();

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();

  if (!cleanFirstName || !cleanLastName) {
    throw new Error("First name and last name are required.");
  }

  const studentRef = push(
    ref(database, `teachers/${emailKey}/student_list`)
  );

  const studentData = {
    firstName: cleanFirstName,
    lastName: cleanLastName
  };

  await set(studentRef, studentData);

  return {
    id: studentRef.key,
    ...studentData
  };
};

// Get student list
export const getStudentList = async () => {
  const emailKey = await ensureTeacherExists();

  const snapshot = await get(
    ref(database, `teachers/${emailKey}/student_list`)
  );

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();

  // Remove old createdAt fields if already saved before
  await Promise.all(
    Object.entries(data).map(([id, student]) => {
      if (student.createdAt !== undefined) {
        return remove(
          ref(database, `teachers/${emailKey}/student_list/${id}/createdAt`)
        );
      }

      return Promise.resolve();
    })
  );

  return Object.entries(data)
    .map(([id, student]) => ({
      id,
      firstName: student.firstName || "",
      lastName: student.lastName || ""
    }))
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.trim();
      const nameB = `${b.firstName} ${b.lastName}`.trim();

      return nameA.localeCompare(nameB);
    });
};

// Get attendance by date
export const getAttendanceByDate = async (date) => {
  const emailKey = await ensureTeacherExists();

  const snapshot = await get(
    ref(database, `teachers/${emailKey}/attendance/${date}`)
  );

  if (!snapshot.exists()) {
    return "";
  }

  return snapshot.val();
};

// Save attendance
export const saveAttendance = async (date, students) => {
  const emailKey = await ensureTeacherExists();

  await set(
    ref(database, `teachers/${emailKey}/attendance/${date}`),
    students
  );
};

// Save current lesson
export const saveCurrentLesson = async (lessonId) => {
  const emailKey = await ensureTeacherExists();

  await set(
    ref(database, `teachers/${emailKey}/current_lesson`),
    lessonId
  );
};

// Save teacher dashboard log
export const saveTeacherLog = async (action, details) => {
  const emailKey = await ensureTeacherExists();

  await push(
    ref(database, `teachers/${emailKey}/teacher_dash_logs`),
    {
      action,
      details,
      timestamp: Date.now()
    }
  );
};

// Get today's selected lesson IDs from teacher_dash_logs
export const getTodaySelectedLessonIds = async () => {
  const emailKey = await ensureTeacherExists();

  const snapshot = await get(
    ref(database, `teachers/${emailKey}/teacher_dash_logs`)
  );

  if (!snapshot.exists()) {
    return [];
  }

  const logs = snapshot.val();

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const selectedLessonIds = [];

  Object.values(logs).forEach((log) => {
    if (log.action !== "Lesson Selected") return;

    const logDate = new Date(log.timestamp);

    const isToday =
      logDate.getFullYear() === todayYear &&
      logDate.getMonth() === todayMonth &&
      logDate.getDate() === todayDate;

    if (isToday && log.details) {
      selectedLessonIds.push(log.details);
    }
  });

  return [...new Set(selectedLessonIds)];
};
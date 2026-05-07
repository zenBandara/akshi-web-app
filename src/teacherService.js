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
      student_list: {},
      teacher_dash_logs: {}
    });
  }

  return emailKey;
};

// Add student to teachers/{teacherEmail}/student_list
export const addStudentToList = async ({ firstName, lastName }) => {
  const emailKey = await ensureTeacherExists();

  if (!emailKey) {
    throw new Error("Teacher is not logged in.");
  }

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
    lastName: cleanLastName,
    createdAt: Date.now()
  };

  await set(studentRef, studentData);

  return {
    id: studentRef.key,
    ...studentData
  };
};

// Get student list from teachers/{teacherEmail}/student_list
export const getStudentList = async () => {
  const emailKey = await ensureTeacherExists();

  if (!emailKey) {
    return [];
  }

  const snapshot = await get(
    ref(database, `teachers/${emailKey}/student_list`)
  );

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();

  return Object.entries(data)
    .map(([id, student]) => ({
      id,
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      createdAt: student.createdAt || 0
    }))
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.trim();
      const nameB = `${b.firstName} ${b.lastName}`.trim();

      return nameA.localeCompare(nameB);
    });
};

// Save attendance
export const saveAttendance = async (date, students) => {
  const emailKey = await ensureTeacherExists();

  if (!emailKey) {
    throw new Error("Teacher is not logged in.");
  }

  await set(
    ref(database, `teachers/${emailKey}/attendance/${date}`),
    students
  );
};

// Save current lesson
export const saveCurrentLesson = async (lessonId) => {
  const emailKey = await ensureTeacherExists();

  if (!emailKey) {
    throw new Error("Teacher is not logged in.");
  }

  await set(
    ref(database, `teachers/${emailKey}/current_lesson`),
    lessonId
  );
};

// Save teacher dashboard log
export const saveTeacherLog = async (action, details) => {
  const emailKey = await ensureTeacherExists();

  if (!emailKey) {
    throw new Error("Teacher is not logged in.");
  }

  await push(
    ref(database, `teachers/${emailKey}/teacher_dash_logs`),
    {
      action,
      details,
      timestamp: Date.now()
    }
  );
};
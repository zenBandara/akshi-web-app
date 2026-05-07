import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import {
  addStudentToList,
  getStudentList,
  saveAttendance,
  saveCurrentLesson,
  saveTeacherLog
} from "./teacherService";

const lessons = [
  {
    id: "t_1",
    title: "Alphabet Learning",
    image: "https://via.placeholder.com/300x150?text=Alphabet"
  },
  {
    id: "t_2",
    title: "Numbers Learning",
    image: "https://via.placeholder.com/300x150?text=Numbers"
  },
  {
    id: "t_3",
    title: "Color Identification",
    image: "https://via.placeholder.com/300x150?text=Colors"
  }
];

export default function Lesson() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [lessonSelected, setLessonSelected] = useState(false);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [savingStudent, setSavingStudent] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("en-CA");

  const getStudentFullName = (student) => {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
  };

  const attendingStudents = useMemo(() => {
    return students.filter((student) =>
      selectedStudentIds.includes(student.id)
    );
  }, [students, selectedStudentIds]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setError("");

      const list = await getStudentList();
      setStudents(list);
    } catch (err) {
      setError(err.message || "Failed to load student list.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const addStudent = async () => {
    try {
      setError("");
      setMessage("");

      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter first name and last name.");
        return;
      }

      setSavingStudent(true);

      const newStudent = await addStudentToList({
        firstName,
        lastName
      });

      setStudents((prev) => {
        const updatedList = [...prev, newStudent];

        return updatedList.sort((a, b) =>
          getStudentFullName(a).localeCompare(getStudentFullName(b))
        );
      });

      setFirstName("");
      setLastName("");
      setMessage("Student added successfully.");
    } catch (err) {
      setError(err.message || "Failed to add student.");
    } finally {
      setSavingStudent(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }

      return [...prev, studentId];
    });
  };

  const submitAttendance = async () => {
    try {
      setError("");
      setMessage("");

      if (attendingStudents.length === 0) {
        setError("Please tick at least one student before submitting.");
        return;
      }

      setSubmittingAttendance(true);

      const attendanceString = attendingStudents
        .map((student) => getStudentFullName(student))
        .join(",");

      await saveAttendance(today, attendanceString);

      await saveTeacherLog("Attendance Submitted", {
        date: today,
        students: attendanceString
      });

      setAttendanceSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit attendance.");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const selectLesson = async (lessonId) => {
    try {
      setError("");

      await saveCurrentLesson(lessonId);
      await saveTeacherLog("Lesson Selected", lessonId);

      setLessonSelected(true);
    } catch (err) {
      setError(err.message || "Failed to select lesson.");
    }
  };

  // ---------------- Attendance Screen ----------------
  if (!attendanceSubmitted) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Today's Attendance ({today})
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Paper sx={{ p: 3, maxWidth: 800 }}>
          <Typography variant="h6" gutterBottom>
            Add Student
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={addStudent}
                disabled={savingStudent}
              >
                {savingStudent ? "Adding..." : "Add"}
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Student List
          </Typography>

          {loadingStudents ? (
            <Typography variant="body2">Loading students...</Typography>
          ) : students.length === 0 ? (
            <Alert severity="info">
              No students added yet. Add students using first name and last name.
            </Alert>
          ) : (
            <Box>
              {students.map((student) => (
                <FormControlLabel
                  key={student.id}
                  control={
                    <Checkbox
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleAttendance(student.id)}
                    />
                  }
                  label={getStudentFullName(student)}
                  sx={{
                    display: "block",
                    mb: 1,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    px: 1,
                    py: 0.5
                  }}
                />
              ))}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Check Attendance Before Submission
          </Typography>

          {attendingStudents.length === 0 ? (
            <Alert severity="info">
              Tick the checkboxes to mark attending students.
            </Alert>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {attendingStudents.map((student) => (
                <Chip
                  key={student.id}
                  label={getStudentFullName(student)}
                  color="success"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}

          <Button
            variant="contained"
            color="success"
            sx={{ mt: 3 }}
            onClick={submitAttendance}
            disabled={
              submittingAttendance || attendingStudents.length === 0
            }
          >
            {submittingAttendance
              ? "Submitting..."
              : "Submit Attendance"}
          </Button>
        </Paper>
      </Box>
    );
  }

  // ---------------- Lesson Selection Screen ----------------
  if (!lessonSelected) {
    return (
      <Box sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="success" sx={{ mb: 3 }}>
          Attendance saved successfully for {today}.
        </Alert>

        <Paper sx={{ p: 2, mb: 3, maxWidth: 800 }}>
          <Typography variant="h6" gutterBottom>
            Submitted Attendance
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {attendingStudents.map((student) => (
              <Chip
                key={student.id}
                label={getStudentFullName(student)}
                color="success"
              />
            ))}
          </Stack>
        </Paper>

        <Typography variant="h4" gutterBottom>
          Choose Lesson
        </Typography>

        <Grid container spacing={3}>
          {lessons.map((lesson) => (
            <Grid item xs={12} sm={6} md={4} key={lesson.id}>
              <Card
                sx={{ cursor: "pointer" }}
                onClick={() => selectLesson(lesson.id)}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={lesson.image}
                  alt={lesson.title}
                />

                <CardContent>
                  <Typography variant="h6">
                    {lesson.title}
                  </Typography>

                  <Typography variant="body2">
                    ID: {lesson.id}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // ---------------- Final Confirmation ----------------
  return (
    <Box sx={{ p: 4 }}>
      <Alert severity="success">
        Lesson selected successfully. Session is ready to start.
      </Alert>
    </Box>
  );
}
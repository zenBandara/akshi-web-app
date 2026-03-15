import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia
} from "@mui/material";

import {
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
  const [studentName, setStudentName] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [lessonSelected, setLessonSelected] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const addStudent = () => {
    if (studentName.trim() !== "") {
      setStudents([...students, studentName.trim()]);
      setStudentName("");
    }
  };

  const submitAttendance = async () => {
    if (students.length === 0) return;

    const attendanceString = students.join(",");

    await saveAttendance(today, attendanceString);
    await saveTeacherLog("Attendance Submitted", attendanceString);

    setAttendanceSubmitted(true);
  };

  const selectLesson = async (lessonId) => {
    await saveCurrentLesson(lessonId);
    await saveTeacherLog("Lesson Selected", lessonId);

    setLessonSelected(true);
  };

  // ---------------- Attendance Screen ----------------
  if (!attendanceSubmitted) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Today's Attendance ({today})
        </Typography>

        <Paper sx={{ p: 3, maxWidth: 500 }}>
          <TextField
            label="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            sx={{ mr: 2 }}
          />

          <Button variant="contained" onClick={addStudent}>
            Add
          </Button>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Students Added:</Typography>
            {students.map((name, index) => (
              <Typography key={index}>{name}</Typography>
            ))}
          </Box>

          {students.length > 0 && (
            <Button
              variant="contained"
              color="success"
              sx={{ mt: 3 }}
              onClick={submitAttendance}
            >
              Submit Attendance
            </Button>
          )}
        </Paper>
      </Box>
    );
  }

  // ---------------- Lesson Selection Screen ----------------
  if (!lessonSelected) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          Attendance saved successfully for {today}.
        </Alert>

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
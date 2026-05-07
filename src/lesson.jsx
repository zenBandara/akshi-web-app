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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  getAttendanceByDate,
  getStudentList,
  getTodaySelectedLessonIds,
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

const getTodayKey = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function Lesson() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [submittedAttendanceNames, setSubmittedAttendanceNames] = useState([]);

  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);

  const [pendingLesson, setPendingLesson] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingStudent, setSavingStudent] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = getTodayKey();

  const getStudentFullName = (student) => {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
  };

  const firstNameCounts = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      const key = (student.firstName || "").trim().toLowerCase();

      if (!key) return;

      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }, [students]);

  const getAttendanceSaveName = (student) => {
    const first = (student.firstName || "").trim();
    const last = (student.lastName || "").trim();

    const firstKey = first.toLowerCase();
    const isDuplicateFirstName = firstNameCounts[firstKey] > 1;

    if (isDuplicateFirstName) {
      return `${first} ${last}`.trim();
    }

    return first;
  };

  const attendingStudents = useMemo(() => {
    return students.filter((student) =>
      selectedStudentIds.includes(student.id)
    );
  }, [students, selectedStudentIds]);

  const attendancePreviewNames = useMemo(() => {
    return attendingStudents.map((student) => getAttendanceSaveName(student));
  }, [attendingStudents, firstNameCounts]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const studentList = await getStudentList();
      setStudents(studentList);

      const todayAttendance = await getAttendanceByDate(today);

      if (todayAttendance) {
        const names = String(todayAttendance)
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean);

        setSubmittedAttendanceNames(names);
        setAttendanceSubmitted(true);
        setMessage(
          "Attendance already marked today. You can select lessons now."
        );
      }

      const todaySelectedLessons = await getTodaySelectedLessonIds();
      setSelectedLessonIds(todaySelectedLessons);

      if (todaySelectedLessons.length > 0) {
        setSelectedLessonId(todaySelectedLessons[todaySelectedLessons.length - 1]);
      }
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
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

      if (attendancePreviewNames.length === 0) {
        setError("Please tick at least one student before submitting.");
        return;
      }

      setSubmittingAttendance(true);

      const attendanceString = attendancePreviewNames.join(",");

      await saveAttendance(today, attendanceString);

      await saveTeacherLog("Attendance Submitted", attendanceString);

      setSubmittedAttendanceNames(attendancePreviewNames);
      setAttendanceSubmitted(true);
      setMessage("Attendance saved successfully. You can select lessons now.");
    } catch (err) {
      setError(err.message || "Failed to submit attendance.");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const openLessonConfirmDialog = (lesson) => {
    setError("");
    setMessage("");

    setPendingLesson(lesson);
    setConfirmDialogOpen(true);
  };

  const closeLessonConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setPendingLesson(null);
  };

  const confirmLessonSelection = async () => {
    if (!pendingLesson) return;

    try {
      setError("");
      setMessage("");
      setSavingLesson(true);

      await saveCurrentLesson(pendingLesson.id);

      // Same lesson eka multiple times select kalath log ekak add wenawa
      await saveTeacherLog("Lesson Selected", pendingLesson.id);

      setSelectedLessonId(pendingLesson.id);

      // Tag display karanna only unique list ekak thiyanawa
      setSelectedLessonIds((prev) => {
        if (prev.includes(pendingLesson.id)) {
          return prev;
        }

        return [...prev, pendingLesson.id];
      });

      setMessage(`${pendingLesson.title} selected successfully.`);

      closeLessonConfirmDialog();
    } catch (err) {
      setError(err.message || "Failed to select lesson.");
    } finally {
      setSavingLesson(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5">Loading...</Typography>
      </Box>
    );
  }

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

        <Paper sx={{ p: 3, maxWidth: 850 }}>
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

          {students.length === 0 ? (
            <Alert severity="info">
              No students added yet. Add students first.
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
            Attending Students Before Submit
          </Typography>

          {attendancePreviewNames.length === 0 ? (
            <Alert severity="info">
              Tick the checkboxes to mark attending students.
            </Alert>
          ) : (
            <>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {attendancePreviewNames.map((name, index) => (
                  <Chip
                    key={`${name}-${index}`}
                    label={name}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Stack>

              
            </>
          )}

          <Button
            variant="contained"
            color="success"
            sx={{ mt: 3 }}
            onClick={submitAttendance}
            disabled={
              submittingAttendance || attendancePreviewNames.length === 0
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Choose Lesson
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

      <Paper sx={{ p: 2, mb: 3, maxWidth: 850 }}>
        <Typography variant="h6" gutterBottom>
          Today Attendance
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {submittedAttendanceNames.map((name, index) => (
            <Chip
              key={`${name}-${index}`}
              label={name}
              color="success"
            />
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Attendance already marked for {today}.
        </Typography>
      </Paper>

      {selectedLessonIds.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, maxWidth: 850 }}>
          <Typography variant="h6" gutterBottom>
            Lessons Selected Today
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedLessonIds.map((lessonId) => {
              const lesson = lessons.find((item) => item.id === lessonId);

              return (
                <Chip
                  key={lessonId}
                  label={lesson ? lesson.title : lessonId}
                  color="primary"
                  variant="outlined"
                />
              );
            })}
          </Stack>
        </Paper>
      )}

      {selectedLessonId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Current lesson: {selectedLessonId}
        </Alert>
      )}

      <Grid container spacing={3}>
        {lessons.map((lesson) => {
          const alreadySelected = selectedLessonIds.includes(lesson.id);
          const isCurrentLesson = selectedLessonId === lesson.id;

          return (
            <Grid item xs={12} sm={6} md={4} key={lesson.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  opacity: 1,
                  border: isCurrentLesson
                    ? "2px solid #1976d2"
                    : "1px solid transparent"
                }}
                onClick={() => {
                  if (!savingLesson) {
                    openLessonConfirmDialog(lesson);
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={lesson.image}
                  alt={lesson.title}
                />

                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Typography variant="h6">
                      {lesson.title}
                    </Typography>

                    {alreadySelected && (
                      <Chip
                        label="Already Selected Today"
                        color="success"
                        size="small"
                      />
                    )}
                  </Stack>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    ID: {lesson.id}
                  </Typography>

                  {isCurrentLesson && (
                    <Chip
                      label="Current Lesson"
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={confirmDialogOpen}
        onClose={closeLessonConfirmDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Are you sure?</DialogTitle>

        <DialogContent>
          <Typography>
            Do you want to select{" "}
            <strong>{pendingLesson?.title}</strong> as the lesson now?
          </Typography>


        </DialogContent>

        <DialogActions>
          <Button
            onClick={closeLessonConfirmDialog}
            disabled={savingLesson}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={confirmLessonSelection}
            disabled={savingLesson}
          >
            {savingLesson ? "Selecting..." : "Yes, Select"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
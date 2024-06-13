const express = require("express");
const Mentor = require("../models/mentor");
const Student = require("../models/student");

const router = express.Router();

// Create a Mentor
router.post("/mentors", async (req, res) => {
  try {
    const mentor = new Mentor(req.body);
    await mentor.save();
    res.status(201).send({ message: "Mentor created successfully", mentor });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Create a Student
router.post("/students", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).send({ message: "Student created successfully", student });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Assign multiple students to a mentor
router.post("/mentors/:mentorId/students", async (req, res) => {
  const { mentorId } = req.params;
  const { studentIds } = req.body;

  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).send("Mentor not found");

    const students = await Student.find({
      _id: { $in: studentIds },
      mentor: null,
    });
    if (students.length !== studentIds.length)
      return res.status(400).send("Some students already have a mentor");

    students.forEach((student) => {
      student.mentor = mentorId;
      mentor.students.push(student._id);
      student.save();
    });

    await mentor.save();
    res.send({
      message: `Assigned to mentor ${mentor.name} successfully`,
      mentor,
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Change the mentor for a student
router.put("/students/:studentId/mentor", async (req, res) => {
  const { studentId } = req.params;
  const { mentorId } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).send("Student not found");

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).send("Mentor not found");

    if (student.mentor) {
      const previousMentor = await Mentor.findById(student.mentor);
      previousMentor.students.pull(student._id);
      await previousMentor.save();
      student.previousMentors.push(student.mentor);
    }

    student.mentor = mentorId;
    await student.save();

    mentor.students.push(student._id);
    await mentor.save();

    res.send({
      message: "Mentor changed successfully",
      student: student,
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all students for a particular mentor
router.get("/mentors/:mentorId/students", async (req, res) => {
  const { mentorId } = req.params;

  try {
    const mentor = await Mentor.findById(mentorId).populate("students");
    if (!mentor) return res.status(404).send("Mentor not found");

    res.send(mentor.students);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get previous mentors for a particular student
router.get("/students/:studentId/previous-mentors", async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId).populate(
      "previousMentors"
    );
    if (!student) return res.status(404).send("Student not found");

    res.send(student.previousMentors);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all mentors
router.get("/mentors", async (req, res) => {
  try {
    const mentors = await Mentor.find();
    res.send(mentors);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all students
router.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.send(students);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;

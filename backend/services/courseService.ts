import CourseModel from '../models/Course';
import TeamModel, { Team } from '../models/Team';
import TeamSetModel, { TeamSet } from '../models/TeamSet';
import UserModel, { User } from '../models/User';
import AccountModel from '../models/Account';
import Role from '../../shared/types/auth/Role';
import { NotFoundError } from './errors';

/*----------------------------------------Course----------------------------------------*/
export const createNewCourse = async (courseData: any) => {
  await CourseModel.create(courseData);
};

export const getAllCourses = async () => {
  return await CourseModel.find();
};

export const getCourseById = async (courseId: string) => {
  const course = await CourseModel.findById(courseId)
    .populate<{ faculty: User[] }>('faculty')
    .populate<{ TAs: User[] }>('TAs')
    .populate<{ students: User[] }>('students')
    .populate<{ teamSets: TeamSet[] }>({
      path: 'teamSets',
      populate: {
        path: 'teams',
        model: 'Team',
        populate: ['members', 'TA'],
      },
    })
    .populate({
      path: 'assessments',
      populate: {
        path: 'teamSet',
      },
    });
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  course.faculty.sort((a, b) => a.name.localeCompare(b.name));
  course.TAs.sort((a, b) => a.name.localeCompare(b.name));
  course.students.sort((a, b) => a.name.localeCompare(b.name));
  course.teamSets.forEach((teamSet: TeamSet) => {
    teamSet.teams.sort(
      (a: unknown, b: unknown) => (a as Team).number - (b as Team).number
    );
  });
  if (Array.isArray(course.milestones)) {
    course.milestones.sort((a, b) => a.number - b.number);
  }
  if (Array.isArray(course.sprints)) {
    course.sprints.sort((a, b) => a.number - b.number);
  }
  return course;
};

export const updateCourseById = async (courseId: string, updateData: any) => {
  const updatedCourse = await CourseModel.findByIdAndUpdate(
    courseId,
    updateData,
    {
      new: true,
    }
  );
  if (!updatedCourse) {
    throw new NotFoundError('Course not found');
  }
};

export const deleteCourseById = async (courseId: string) => {
  const deletedCourse = await CourseModel.findByIdAndDelete(courseId);
  if (!deletedCourse) {
    throw new NotFoundError('Course not found');
  }
  await TeamModel.deleteMany({ teamSet: { $in: deletedCourse.teamSets } });
  await TeamSetModel.deleteMany({ _id: { $in: deletedCourse.teamSets } });
  await UserModel.updateMany(
    { enrolledCourses: courseId },
    { $pull: { enrolledCourses: courseId } }
  );
};

/*----------------------------------------Student----------------------------------------*/
export const addStudentsToCourse = async (
  courseId: string,
  studentDataList: any[]
) => {
  const course = await CourseModel.findById(courseId).populate<{
    students: User[];
  }>('students');
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  for (const studentData of studentDataList) {
    const studentId = studentData.identifier;
    let student = await UserModel.findOne({ identifier: studentId });
    if (!student) {
      student = new UserModel({
        identifier: studentId,
        name: studentData.name,
        enrolledCourses: [],
        gitHandle: studentData.gitHandle ?? null,
      });
      await student.save();
      const newAccount = new AccountModel({
        email: studentData.email,
        role: Role.Student,
        isApproved: false,
        user: student._id,
      });
      await newAccount.save();
    } else {
      const studentAccount = await AccountModel.findOne({ user: student._id });
      if (studentAccount && studentAccount.role !== Role.Student) {
        continue;
      }
    }
    if (!student.enrolledCourses.includes(course._id)) {
      student.enrolledCourses.push(course._id);
    }
    await student.save();
    if (!course.students.some(s => s.identifier === student?.identifier)) {
      course.students.push(student);
    }
  }
  await course.save();
};

/*----------------------------------------TA----------------------------------------*/
export const addTAsToCourse = async (courseId: string, TADataList: any[]) => {
  const course = await CourseModel.findById(courseId).populate<{ TAs: User[] }>(
    'TAs'
  );
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  for (const TAData of TADataList) {
    const TAId = TAData.identifier;
    let TA = await UserModel.findOne({ identifier: TAId });
    if (!TA) {
      TA = new UserModel({
        identifier: TAId,
        name: TAData.name,
        enrolledCourses: [],
        gitHandle: TAData.gitHandle ?? null,
      });
      await TA.save();
      const newAccount = new AccountModel({
        email: TAData.email,
        role: Role.TA,
        isApproved: false,
        user: TA._id,
      });
      newAccount.save();
    } else {
      const TAAccount = await AccountModel.findOne({ user: TA._id });
      if (TAAccount && TAAccount.role !== 'Teaching assistant') {
        continue;
      }
    }
    if (!TA.enrolledCourses.includes(course._id)) {
      TA.enrolledCourses.push(course._id);
    }
    await TA.save();
    if (!course.TAs.some(ta => ta.identifier === TA?.identifier)) {
      course.TAs.push(TA);
    }
  }
  await course.save();
};

export const getCourseTeachingTeam = async (courseId: string) => {
  const course = await CourseModel.findById(courseId)
    .populate('faculty')
    .populate('TAs');
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  return [...course.faculty, ...course.TAs];
};

/*----------------------------------------Milestone----------------------------------------*/
export const addMilestoneToCourse = async (
  courseId: string,
  milestoneData: { number: number; dateline: Date; description: string }
) => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  course.milestones.push(milestoneData);
  await course.save();
};

/*----------------------------------------Sprint----------------------------------------*/
export const addSprintToCourse = async (
  courseId: string,
  sprintData: {
    number: number;
    startDate: Date;
    endDate: Date;
    description: string;
  }
) => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course not found');
  }
  course.sprints.push(sprintData);
  await course.save();
};
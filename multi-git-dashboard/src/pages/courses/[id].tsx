import AssessmentsInfo from '@/components/views/AssessmentsInfo';
import MilestonesInfo from '@/components/views/MilestonesInfo';
import Overview from '@/components/views/Overview';
import SprintsInfo from '@/components/views/SprintsInfo';
import StaffInfo from '@/components/views/StaffInfo';
import StudentsInfo from '@/components/views/StudentsInfo';
import TeamSetsInfo from '@/components/views/TeamSetsInfo';
import { Container, Loader, Tabs } from '@mantine/core';
import { Course, Milestone, Sprint } from '@shared/types/Course';
import { TeamData } from '@shared/types/TeamData';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

const CourseViewPage: React.FC = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const [course, setCourse] = useState<Course>();
  const [teamsData, setTeamsData] = useState<TeamData[]>([]);

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT}/api/courses/${id}`
      );
      if (response.ok) {
        const data: Course = await response.json();
        if (data.milestones) {
          data.milestones = data.milestones.map((milestone: Milestone) => ({
            ...milestone,
            dateline: new Date(milestone.dateline),
          }));
        }
        if (data.sprints) {
          data.sprints = data.sprints.map((sprint: Sprint) => ({
            ...sprint,
            startDate: new Date(sprint.startDate),
            endDate: new Date(sprint.endDate),
          }));
        }
        setCourse(data);
      } else {
        console.error('Error fetching course:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  }, [id]);

  const fetchTeamData = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT}/api/github`
      );
      if (response.ok) {
        const data = await response.json();
        const teamsData: TeamData[] = data.teamData;
        setTeamsData(teamsData);
      } else {
        console.error('Error fetching team data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchTeamData();
    }
  }, [id, fetchCourse, fetchTeamData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteCourse = async () => {
    try {
      const response = await fetch(
        `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT}/api/courses/${id}`,
        {
          method: 'DELETE',
        }
      );
      if (response.ok) {
        router.push('/courses');
      } else {
        console.error('Error deleting course:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const handleUpdate = () => {
    fetchCourse();
  };

  if (!course) {
    return (
      <Container size="md">
        <Loader size="md" />
      </Container>
    );
  }

  return (
    <Container size="md">
      {course ? (
        <Tabs defaultValue="overview">
          <Tabs.List
            style={{ display: 'flex', justifyContent: 'space-evenly' }}
          >
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="students">Students</Tabs.Tab>
            <Tabs.Tab value="staff">Staff</Tabs.Tab>
            <Tabs.Tab value="teams">Teams</Tabs.Tab>
            <Tabs.Tab value="milestones">Timeline</Tabs.Tab>
            <Tabs.Tab value="sprints">Sprints</Tabs.Tab>
            <Tabs.Tab value="assessments">Assessments</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="overview">
            <div>
              <Overview course={course} teamsData={teamsData} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="students">
            <div>
              <StudentsInfo course={course} onUpdate={handleUpdate} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="staff">
            <div>
              <StaffInfo course={course} onUpdate={handleUpdate} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="teams">
            <div>
              <TeamSetsInfo course={course} onUpdate={handleUpdate} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="milestones">
            <div>
              <MilestonesInfo course={course} onUpdate={handleUpdate} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="sprints">
            <div>
              <SprintsInfo course={course} onUpdate={handleUpdate} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="assessments">
            <div>
              <AssessmentsInfo course={course} onUpdate={handleUpdate} />
            </div>
          </Tabs.Panel>
        </Tabs>
      ) : (
        <Loader size="md" />
      )}
    </Container>
  );
};

export default CourseViewPage;

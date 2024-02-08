import {
  Button,
  Container,
  Group,
  Modal,
  Notification,
  Tabs,
} from '@mantine/core';
import { Course } from '@shared/types/Course';
import { TeamSet } from '@shared/types/TeamSet';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import TeamCard from '../cards/TeamCard';
import StudentTeamForm from '../forms/StudentTeamForm';
import TATeamForm from '../forms/TATeamForm';
import TeamSetForm from '../forms/TeamSetForm';
import { TeamData } from '@shared/types/TeamData';

interface TeamsInfoProps {
  course: Course;
  onUpdate: () => void;
}

const TeamsInfo: React.FC<TeamsInfoProps> = ({ course, onUpdate }) => {
  const [isCreatingTeamSet, setIsCreatingTeamSet] = useState<boolean>(false);
  const [isAddingStudents, setIsAddingStudents] = useState<boolean>(false);
  const [isAddingTAs, setIsAddingTAs] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [teamSetId, setTeamSetId] = useState<string | null>(null);
  const [teamDataList, setTeamDataList] = useState<TeamData[]>([]);

  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const fetchTeamData = async () => {
    try {
      const response = await fetch(`/teamsets/${teamSetId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team data.');
      }
      const data: TeamData[] = await response.json();
      setTeamDataList(data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [course._id]);

  const teamCards = (teamSet: TeamSet) =>
    teamSet.teams.map(team => (
      <TeamCard
        key={team._id}
        teamId={team._id}
        number={team.number}
        TA={team.TA}
        TAs={course.TAs}
        teamData={team.teamData}
        teamDataList={teamDataList}
        members={team.members}
        onTeamDeleted={onUpdate}
      />
    ));

  const headers = course.teamSets.map((teamSet, index) => (
    <Tabs.Tab
      key={index}
      value={teamSet.name}
      onClick={() => {
        setActiveTab(teamSet.name);
        setTeamSetId(teamSet._id);
      }}
    >
      {teamSet.name}
    </Tabs.Tab>
  ));

  const panels = course.teamSets.map(teamSet => (
    <Tabs.Panel key={teamSet._id} value={teamSet.name}>
      {teamCards(teamSet)}
    </Tabs.Panel>
  ));

  const toggleTeamSetForm = () => {
    setIsCreatingTeamSet(o => !o);
  };

  const handleTeamSetCreated = () => {
    setIsCreatingTeamSet(false);
    onUpdate();
  };

  const toggleAddStudentsForm = () => {
    setIsAddingStudents(o => !o);
  };

  const handleAddStudentsUploaded = () => {
    setIsAddingStudents(false);
    onUpdate();
  };

  const toggleAddTAsForm = () => {
    setIsAddingTAs(o => !o);
  };

  const handleAddTAsUploaded = () => {
    setIsAddingTAs(false);
    onUpdate();
  };

  const handleDeleteTeamSet = async () => {
    try {
      const response = await fetch(`/teamsets/${teamSetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Error deleting TeamSet:', response.statusText);
        setError('Error deleting TeamSet. Please try again.');
        return;
      }
      setIsCreatingTeamSet(false);
      setIsAddingStudents(false);
      setIsAddingTAs(false);
      setActiveTab(null);
      setTeamSetId(null);
      console.log('TeamSet deleted');
      onUpdate();
    } catch (error) {
      console.error('Error deleting TeamSet:', error);
      setError('Error deleting TeamSet. Please try again.');
    }
  };

  const hasPermission = ['admin', 'Faculty member'].includes(userRole || '');

  return (
    <Container>
      <Tabs value={activeTab}>
        <Tabs.List style={{ display: 'flex', justifyContent: 'space-evenly' }}>
          {headers}
        </Tabs.List>
        {error && (
          <Notification
            title="Error"
            color="red"
            onClose={() => setError(null)}
          >
            {error}
          </Notification>
        )}
        {hasPermission && (
          <Group style={{ marginBottom: '16px', marginTop: '16px' }}>
            <Group>
              <Button onClick={toggleTeamSetForm}>Create TeamSet</Button>
              {activeTab && (
                <Button onClick={toggleAddStudentsForm}>Add Students</Button>
              )}
              {activeTab && <Button onClick={toggleAddTAsForm}>Add TAs</Button>}
            </Group>

            {teamSetId && (
              <Button color="red" onClick={handleDeleteTeamSet}>
                Delete TeamSet
              </Button>
            )}
          </Group>
        )}
        <Modal
          opened={isCreatingTeamSet}
          onClose={toggleTeamSetForm}
          title="Create TeamSet"
        >
          <TeamSetForm
            courseId={course._id}
            onTeamSetCreated={handleTeamSetCreated}
          />
        </Modal>

        {activeTab && (
          <Modal
            opened={isAddingStudents}
            onClose={toggleAddStudentsForm}
            title="Add Students"
          >
            <StudentTeamForm
              courseId={course._id}
              teamSet={activeTab}
              onTeamCreated={handleAddStudentsUploaded}
            />
          </Modal>
        )}

        {activeTab && (
          <Modal
            opened={isAddingTAs}
            onClose={toggleAddTAsForm}
            title="Add TAs"
          >
            <TATeamForm
              courseId={course._id}
              teamSet={activeTab}
              onTeamCreated={handleAddTAsUploaded}
            />
          </Modal>
        )}

        {panels}
      </Tabs>
    </Container>
  );
};

export default TeamsInfo;

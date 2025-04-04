import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Divider,
  Group,
  Modal,
  Text,
  Title,
  Box,
} from '@mantine/core';
import { InternalAssessment } from '@shared/types/InternalAssessment';
import { Submission } from '@shared/types/Submission';
import { useRouter } from 'next/router';
import { IconEdit, IconTrash, IconUsers } from '@tabler/icons-react';
import UpdateAssessmentInternalForm from '../forms/UpdateAssessmentInternalForm';
import SubmissionCard from '../cards/SubmissionCard';
import { QuestionUnion } from '@shared/types/Question';
import { User } from '@shared/types/User';
import {
  AssignedTeam,
  AssignedUser,
} from '@shared/types/AssessmentAssignmentSet';
import TAAssignmentModal from '../cards/Modals/TAAssignmentModal';

interface AssessmentInternalOverviewProps {
  courseId: string;
  assessment: InternalAssessment | null;
  hasFacultyPermission: boolean;
  onUpdateAssessment: () => void;
  questions: QuestionUnion[];
  userIdToNameMap: { [key: string]: string };
  initialAssignedTeams?: AssignedTeam[];
  initialAssignedUsers?: AssignedUser[];
  teachingStaff: User[];
  onTakeAssessmentClicked: () => void;
}

const AssessmentInternalOverview: React.FC<AssessmentInternalOverviewProps> = ({
  courseId,
  assessment,
  hasFacultyPermission,
  onUpdateAssessment,
  questions,
  userIdToNameMap,
  initialAssignedTeams = [],
  initialAssignedUsers = [],
  teachingStaff,
  onTakeAssessmentClicked,
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignedTeams, setAssignedTeams] =
    useState<AssignedTeam[]>(initialAssignedTeams);
  const [assignedUsers, setAssignedUsers] =
    useState<AssignedUser[]>(initialAssignedUsers);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isTeamAssignmentModalOpen, setIsTeamAssignmentModalOpen] =
    useState<boolean>(false);

  const [gradeOriginalTeams, setGradeOriginalTeams] = useState<boolean>(false);
  const [teamsPerTA, setTeamsPerTA] = useState<number>(1);
  const [selectedTeachingStaff, setSelectedTeachingStaff] = useState<string[]>(
    []
  );
  const [excludedTeachingStaff, setExcludedTeachingStaff] = useState<string[]>(
    []
  );
  const [assignedEntitiesAvailable, setAssignedEntitiesAvailable] =
    useState<boolean>(true);

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');

  const router = useRouter();
  const deleteInternalAssessmentApiRoute = `/api/internal-assessments/${assessment?._id}`;

  const hasDraftSubmissions = useMemo(
    () => submissions.some(sub => sub.isDraft),
    [submissions]
  );

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  // Compute available TAs based on exclusions
  const availableTAs = useMemo(() => {
    return teachingStaff.filter(ta => !excludedTeachingStaff.includes(ta._id));
  }, [teachingStaff, excludedTeachingStaff]);

  // Validate assignments (every entity must have at least one TA)
  const validateAssignments = (): boolean => {
    if (!assessment) return true;
    if (assessment.granularity === 'team') {
      return assignedTeams.every(team => team.tas.length > 0);
    } else {
      return assignedUsers.every(user => user.tas.length > 0);
    }
  };

  const isAssignmentsValid = validateAssignments();

  const fetchSubmissions = useCallback(async () => {
    if (!assessment) return;

    const apiRoute = hasFacultyPermission
      ? `/api/internal-assessments/${assessment._id}/all-submissions`
      : `/api/internal-assessments/${assessment._id}/submissions`;

    try {
      const response = await fetch(apiRoute, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error fetching submissions:', response.statusText);
        alert('Error fetching submissions');
        return;
      }

      const data: Submission[] = await response.json();

      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      alert('Error fetching submissions');
    }
  }, [assessment, hasFacultyPermission]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Fetch assigned entities (teams or users) that need grading
  const fetchAssignedEntities = useCallback(async () => {
    if (!assessment) return;
    try {
      const response = await fetch(
        `/api/assignment-sets/${assessment._id}/assignment-sets/graderunmarked`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching assigned entities:', response.statusText);
        alert('Error grading assignments');
        return;
      }
      const data = await response.json();

      // If empty array, no assigned entities left to grade
      if (Array.isArray(data) && data.length === 0) {
        setAssignedEntitiesAvailable(false);
      } else {
        setAssignedEntitiesAvailable(true);
      }
    } catch (error) {
      console.error('Error fetching assigned entities:', error);
      alert('Error fetching grading assignments');
    }
  }, [assessment]);

  useEffect(() => {
    if (hasFacultyPermission && assessment && assessment.isReleased) {
      // Fetch assigned entities if faculty and assessment is released
      fetchAssignedEntities();
    }
  }, [hasFacultyPermission, assessment, fetchAssignedEntities]);

  // Delete assessment handler
  const deleteAssessment = async () => {
    try {
      const response = await fetch(deleteInternalAssessmentApiRoute, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }
      router.push(`/courses/${courseId}/assessments`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleEditModal = () => setIsEditModalOpen(o => !o);
  const toggleDeleteModal = () => setIsDeleteModalOpen(o => !o);
  const toggleTeamAssignmentModal = () => {
    setErrorMessage('');
    setWarningMessage('');
    setIsTeamAssignmentModalOpen(o => !o);
  };

  const handleTaAssignmentChange = (
    id: string,
    selectedTAIds: string[] | null
  ) => {
    if (assessment?.granularity === 'team') {
      const updatedTeams = assignedTeams.map(assignedTeam => {
        if (assignedTeam.team._id === id) {
          const selectedTAs = teachingStaff.filter(
            ta => selectedTAIds?.includes(ta._id) ?? false
          );
          return { ...assignedTeam, tas: selectedTAs };
        }
        return assignedTeam;
      });
      setAssignedTeams(updatedTeams);
    } else if (assessment?.granularity === 'individual') {
      const updatedUsers = assignedUsers.map(assignedUser => {
        if (assignedUser.user._id === id) {
          const selectedTAs = teachingStaff.filter(
            ta => selectedTAIds?.includes(ta._id) ?? false
          );
          return { ...assignedUser, tas: selectedTAs };
        }
        return assignedUser;
      });
      setAssignedUsers(updatedUsers);
    }
  };

  const handleMassAssign = () => {
    const selectedTAs = teachingStaff.filter(ta =>
      selectedTeachingStaff.includes(ta._id)
    );

    if (assessment?.granularity === 'team') {
      const updatedTeams = assignedTeams.map(assignedTeam => ({
        ...assignedTeam,
        tas: [
          ...assignedTeam.tas,
          ...selectedTAs.filter(
            ta => !assignedTeam.tas.some(t => t._id === ta._id)
          ),
        ],
      }));
      setAssignedTeams(updatedTeams);
    } else if (assessment?.granularity === 'individual') {
      const updatedUsers = assignedUsers.map(assignedUser => ({
        ...assignedUser,
        tas: [
          ...assignedUser.tas,
          ...selectedTAs.filter(
            ta => !assignedUser.tas.some(t => t._id === ta._id)
          ),
        ],
      }));
      setAssignedUsers(updatedUsers);
    }

    setSelectedTeachingStaff([]);
  };

  const distributeTAsEvenly = (
    teamsToAssign: AssignedTeam[],
    tasAvailable: User[]
  ) => {
    // Reset warning message
    setWarningMessage('');
    // Steps:
    // 1. For each team, if gradeOriginalTeams is checked and it has an original TA not excluded, assign that TA first.
    // 2. Assign additional TAs until teamsPerTA reached, choosing TAs with the least number of assigned teams.
    // 3. Check distribution difference.
    // Map TA _id to count of assigned teams
    const taCountMap = new Map<string, number>();
    tasAvailable.forEach(ta => taCountMap.set(ta._id, 0));
    for (const teamObj of teamsToAssign) {
      const assignedTAs: User[] = [];
      // If gradeOriginalTeams and teamObj.team.TA available and not excluded
      if (
        gradeOriginalTeams &&
        teamObj.team.TA &&
        !excludedTeachingStaff.includes(teamObj.team.TA._id)
      ) {
        assignedTAs.push(teamObj.team.TA);
        taCountMap.set(
          teamObj.team.TA._id,
          (taCountMap.get(teamObj.team.TA._id) || 0) + 1
        );
      }
      // Assign more TAs until we reach teamsPerTA
      while (assignedTAs.length < teamsPerTA && tasAvailable.length > 0) {
        // Pick TA with least assigned teams
        const sortedTAs = tasAvailable
          .filter(ta => !assignedTAs.includes(ta))
          .sort((a, b) => taCountMap.get(a._id)! - taCountMap.get(b._id)!);
        if (sortedTAs.length === 0) break;
        const taToAssign = sortedTAs[0];
        assignedTAs.push(taToAssign);
        taCountMap.set(taToAssign._id, taCountMap.get(taToAssign._id)! + 1);
      }
      teamObj.tas = assignedTAs;
    }
    // Check distribution difference
    const counts = Array.from(taCountMap.values());
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    if (maxCount - minCount > 1) {
      setWarningMessage(
        'Warning: TA assignment distribution is uneven (difference > 1).'
      );
    }
    setAssignedTeams([...teamsToAssign]);
  };

  const handleRandomizeTAs = () => {
    if (!assessment || assessment.granularity !== 'team') return;
    const numTeams = assignedTeams.length;
    const numTAsNeeded = Math.ceil(numTeams / teamsPerTA);
    // Filter out excluded TAs
    const tasToUse = [...availableTAs].slice(0, numTAsNeeded);
    if (tasToUse.length === 0) {
      setWarningMessage('No available TAs to assign.');
      return;
    }
    distributeTAsEvenly(assignedTeams, tasToUse);
  };
  // Save TA assignments
  const handleSaveAssignments = async () => {
    setErrorMessage('');
    setWarningMessage('');
    // Validate assignments before saving
    const isValid = validateAssignments();
    if (!isValid) {
      setWarningMessage(
        'Some teams/users have no assigned graders. Please assign at least one grader each.'
      );
      return;
    }
    try {
      const response = await fetch(
        `/api/internal-assessments/${assessment!._id}/assignment-sets`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignedTeams:
              assessment?.granularity === 'team'
                ? assignedTeams.map(team => ({
                    team: team.team._id,
                    tas: team.tas.map(ta => ta._id),
                  }))
                : undefined,
            assignedUsers:
              assessment?.granularity === 'individual'
                ? assignedUsers.map(user => ({
                    user: user.user._id,
                    tas: user.tas.map(ta => ta._id),
                  }))
                : undefined,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(
          errorData.message ||
            'Failed to save TA assignments due to a server error.'
        );
        return;
      }
      toggleTeamAssignmentModal();
    } catch (error) {
      console.error('Error saving TA assignments:', error);
      setErrorMessage('Failed to save TA assignments due to a network error.');
    }
  };

  return (
    <Box>
      {/* Edit Assessment Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={toggleEditModal}
        title="Edit Assessment"
      >
        <UpdateAssessmentInternalForm
          assessment={assessment}
          onAssessmentUpdated={onUpdateAssessment}
        />
      </Modal>

      {/* Delete Assessment Modal */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={toggleDeleteModal}
        title="Confirm Delete"
      >
        <Text>Are you sure you want to delete this assessment?</Text>
        <Group mt="md" mb="md" justify="flex-end">
          <Button variant="default" onClick={toggleDeleteModal}>
            Cancel
          </Button>
          <Button color="red" onClick={deleteAssessment}>
            Delete
          </Button>
        </Group>
      </Modal>

      {/* TA Assignment Modal */}
      {hasFacultyPermission && (
        <TAAssignmentModal
          opened={isTeamAssignmentModalOpen}
          onClose={toggleTeamAssignmentModal}
          teachingStaff={teachingStaff}
          assignedTeams={assignedTeams}
          assignedUsers={assignedUsers}
          gradeOriginalTeams={gradeOriginalTeams}
          teamsPerTA={teamsPerTA}
          excludedTeachingStaff={excludedTeachingStaff}
          selectedTeachingStaff={selectedTeachingStaff}
          onSetGradeOriginalTeams={setGradeOriginalTeams}
          onSetTeamsPerTA={setTeamsPerTA}
          onSetExcludedTeachingStaff={setExcludedTeachingStaff}
          onSetSelectedTeachingStaff={setSelectedTeachingStaff}
          onMassAssign={handleMassAssign}
          onRandomizeTAs={handleRandomizeTAs}
          onSaveAssignments={handleSaveAssignments}
          errorMessage={errorMessage}
          warningMessage={warningMessage}
          availableTAs={availableTAs}
          isAssignmentsValid={isAssignmentsValid}
          assessmentGranularity={assessment?.granularity}
          handleTaAssignmentChange={handleTaAssignmentChange}
        />
      )}

      <Card withBorder shadow="sm" mb="lg">
        <Group justify="space-between">
          <Box>
            <Title order={2}>{assessment?.assessmentName}</Title>
            <Text c="dimmed">{assessment?.description}</Text>
          </Box>
          {hasFacultyPermission && (
            <Group>
              <Button
                variant="light"
                color="blue"
                onClick={toggleEditModal}
                leftSection={<IconEdit size={16} />}
              >
                Edit
              </Button>
              <Button
                variant="light"
                color="red"
                onClick={toggleDeleteModal}
                leftSection={<IconTrash size={16} />}
              >
                Delete
              </Button>
              <Button
                variant="light"
                color="green"
                onClick={toggleTeamAssignmentModal}
                leftSection={<IconUsers size={16} />}
                disabled={!!assessment?.isReleased}
              >
                Assign Graders
              </Button>
            </Group>
          )}
        </Group>
        <Divider my="sm" />
        <Group justify="space-between">
          <Text>
            <strong>Start Date:</strong> {formatDate(assessment?.startDate)}
          </Text>
          <Text>
            <strong>End Date:</strong> {formatDate(assessment?.endDate)}
          </Text>
        </Group>
        {assessment && assessment.isReleased && (
          <Group justify="center" mt="md">
            {assignedEntitiesAvailable ? (
              <Button onClick={() => onTakeAssessmentClicked()}>
                Submit Assessment
              </Button>
            ) : hasDraftSubmissions ? (
              <Text c="dimmed">
                Pending submission drafts only; no remaining teams or users
                await new submissions.
              </Text>
            ) : (
              <Text c="dimmed">All assigned teams/users have been graded</Text>
            )}
          </Group>
        )}
      </Card>

      <Card withBorder shadow="sm">
        <Title order={3} mb="sm">
          Submissions
        </Title>
        {!assessment || submissions.length === 0 ? (
          <Text>No submissions available.</Text>
        ) : (
          submissions.map(submission => (
            <SubmissionCard
              key={submission._id}
              submission={submission}
              hasFacultyPermission={hasFacultyPermission}
              isEditable={
                hasFacultyPermission || assessment.areSubmissionsEditable
              }
              courseId={courseId}
              assessmentId={assessment._id}
              assessmentReleaseNumber={assessment.releaseNumber}
              questions={questions}
              userIdToNameMap={userIdToNameMap}
              assessmentGranularity={assessment.granularity}
            />
          ))
        )}
      </Card>
    </Box>
  );
};

export default AssessmentInternalOverview;

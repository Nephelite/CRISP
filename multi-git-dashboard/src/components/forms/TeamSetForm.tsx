import React from 'react';
import { Box, TextInput, Button } from '@mantine/core';
import { useForm } from '@mantine/form';

const backendPort = process.env.BACKEND_PORT || 3001;

interface TeamSetFormProps {
  courseId : string;
  onTeamSetCreated: () => void;
}

const TeamSetForm: React.FC<TeamSetFormProps> = ({ courseId, onTeamSetCreated }) => {
  const form = useForm({
    initialValues: {
      course: courseId,
      name: '',
      teams: [],
    },
  });

  const handleSubmit = async () => {
    
    console.log('Sending teamset data:', form.values);

    const response = await fetch(`http://localhost:${backendPort}/api/courses/${courseId}/teamsets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form.values),
    });

    const data = await response.json();
    console.log('TeamSet created:', data);
    onTeamSetCreated();
  };

  return (
    <Box maw={300} mx="auto">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          withAsterisk
          label="TeamSet Name"
          {...form.getInputProps('name')}
          value={form.values.name}
          onChange={(event) => {
            form.setFieldValue('name', event.currentTarget.value);
          }}
        />
        <Button type="submit" style={{ marginTop: '16px' }}>
          Create TeamSet
        </Button>
      </form>
    </Box>
  );
};

export default TeamSetForm;
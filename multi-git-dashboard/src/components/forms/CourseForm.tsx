import { Box, Button, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

interface CourseFormProps {
  onCourseCreated: () => void;
}

const CreateCoursePage: React.FC<CourseFormProps> = ({ onCourseCreated }) => {
  const form = useForm({
    initialValues: {
      name: '',
      code: '',
      semester: '',
    },
  });

  const handleSubmit = async () => {
    const response = await fetch(
      `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT}/api/courses`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form.values),
      }
    );

    const data = await response.json();
    console.log('Course created:', data);
    onCourseCreated();
  };

  return (
    <Box maw={300} mx="auto">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          withAsterisk
          label="Course Name"
          {...form.getInputProps('name')}
          value={form.values.name}
          onChange={event => {
            form.setFieldValue('name', event.currentTarget.value);
          }}
        />
        <TextInput
          withAsterisk
          label="Course Code"
          {...form.getInputProps('code')}
          value={form.values.code}
          onChange={event => {
            form.setFieldValue('code', event.currentTarget.value);
          }}
        />
        <TextInput
          withAsterisk
          label="Semester"
          {...form.getInputProps('semester')}
          value={form.values.semester}
          onChange={event => {
            form.setFieldValue('semester', event.currentTarget.value);
          }}
        />
        <Button type="submit" style={{ marginTop: '16px' }}>
          Create Course
        </Button>
      </form>
    </Box>
  );
};

export default CreateCoursePage;

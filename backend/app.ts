import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import setupGitHubJob from './jobs/githubJob';
import setupJiraJob from './jobs/jiraJob';
import accountRoutes from './routes/accountRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import courseRoutes from './routes/courseRoutes';
import githubRoutes from './routes/githubRoutes';
import jiraRoutes from './routes/jiraRoutes';
import teamDataRoutes from './routes/teamDataRoutes';
import teamRoutes from './routes/teamRoutes';
import teamSetRoutes from './routes/teamSetRoutes';
import { connectToDatabase } from './utils/database';

dotenv.config();

const setupApp = async () => {
  await connectToDatabase();
  setupGitHubJob();
  setupJiraJob();
};

setupApp();

const port = process.env.PORT;
const app: Express = express();

app.use(express.json());

app.use(cors());

app.use('/api/courses', courseRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/teamdatas', teamDataRoutes);
app.use('/api/teamsets', teamSetRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/jira', jiraRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

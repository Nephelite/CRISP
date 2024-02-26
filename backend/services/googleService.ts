import SheetDataModel, { SheetData } from '../models/SheetData';
import { fetchDataFromSheet } from '../utils/google';
import { NotFoundError } from './errors';
import AssessmentModel from '../models/Assessment';
import AccountModel from '../models/Account';
import ResultModel from '../models/Result';

export const getAssessmentSheetData = async (
  assessmentId: string,
  accountId: string
): Promise<SheetData | null> => {
  const account = await AccountModel.findById(accountId);
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  const assessment =
    await AssessmentModel.findById(assessmentId).populate('sheetData');
  if (!assessment || !assessment.sheetData) {
    throw new NotFoundError('Assessment not found');
  }

  let sheetData: SheetData | null = await SheetDataModel.findById(
    assessment.sheetData
  );
  if (!sheetData) {
    throw new NotFoundError('Sheets data not found');
  }

  if (account.role === 'Teaching assistant') {
    const results = await ResultModel.find({
      assessment: assessmentId,
      marker: accountId,
    });

    const studentIds = new Set<string>();
    results.forEach(result => {
      result.marks.forEach(mark => {
        studentIds.add(mark.user);
      });
    });

    sheetData.rows = sheetData.rows.filter(row => studentIds.has(row[0]));
  }

  return sheetData;
};

export const fetchAndSaveSheetData = async (assessmentId: string, isTeam: boolean) => {
  const assessment = await AssessmentModel.findById(assessmentId);
  if (!assessment) {
    throw new NotFoundError('Assessment not found');
  }

  console.log('Fetching new sheet data');

  const sheetId = assessment.sheetID;
  const transformedData = await fetchDataFromSheet(sheetId, isTeam);
  const [headers, ...rows] = transformedData;

  const newSheetData = new SheetDataModel({
    fetchedAt: new Date(),
    headers,
    rows,
  });

  await newSheetData.save();
  assessment.sheetData = newSheetData._id;
  await assessment.save();
  console.log('Saved new sheet data');
};

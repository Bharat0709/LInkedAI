const dotenv = require('dotenv');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
dotenv.config();

exports.fetchGoogleSheetData = catchAsync(async (req, res, next) => {
  const { googleSheetUrl } = req.body;

  if (!googleSheetUrl) {
    return next(new AppError('Google Sheets URL is required.', 400));
  }

  try {
    const sheetData = await googleSheetData(googleSheetUrl);

    // Send success response
    res.status(200).json({
      status: 'success',
      data: sheetData,
    });
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);

    return next(
      new AppError(
        error.message || 'Internal Server Error',
        error.statusCode || 500
      )
    );
  }
});

async function googleSheetData(googleSheetUrl) {
  try {
    // Extract the Google Sheets ID from the URL
    const sheetIdMatch = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL.');
    }

    const sheetId = sheetIdMatch[1];

    // Step 1: Get the spreadsheet metadata to fetch sheet names
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${process.env.GOOGLE_API_KEY}`;
    const metadataResponse = await fetch(metadataUrl);

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      const errorMessage =
        errorData?.error?.message || 'Failed to fetch spreadsheet metadata.';
      throw new Error(errorMessage);
    }

    const metadata = await metadataResponse.json();
    const sheetNames = metadata.sheets.map((sheet) => sheet.properties.title);

    const sheetName = sheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets available in the spreadsheet.');
    }

    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
      sheetName
    )}?key=${process.env.GOOGLE_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData?.error?.message || 'Failed to fetch Google Sheets data.';
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data || !data.values) {
      throw new Error('No data found in the specified Google Sheet.');
    }

    const [headers, ...rows] = data.values;

    return { sheetNames, headers, rows };
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(
      error.message || 'An error occurred while fetching the data.'
    );
  }
}

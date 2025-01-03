
const fetchGoogleSheetDataService = async (googleSheetUrl) => {
  try {
    // Extract the Google Sheets ID from the URL
    const sheetIdMatch = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL.');
    }

    const sheetId = sheetIdMatch[1];
    console.log(sheetId);

    // Construct the API URL
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/?key=${process.env.GOOGLE_API_KEY}`;

    // Fetch data from the Google Sheets API
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
    console.log(headers, rows);

    return { headers, rows };
  } catch (error) {
    throw new Error(
      error.message || 'An error occurred while fetching the data.'
    );
  }
};

module.exports = fetchGoogleSheetDataService;

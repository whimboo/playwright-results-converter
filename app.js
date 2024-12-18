import fs from 'fs';
import { Parser } from '@json2csv/plainjs';
import { unwind, flatten } from '@json2csv/transforms';

function generateCSV(inputFile, outputFile) {
  try {
    let jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    jsonData.suites = jsonData.suites
      .map(suite => ({
        ...suite,
        specs: suite.specs.filter(spec => !spec.ok),
      }))
      .filter(suite => suite.specs.length);

    const fields = [
      { label: 'File Name', value: (record) => record["suites.title"] },
      { label: 'Test Name', value: (record) => record["suites.specs.title"] },
      {
        label: 'Expected Status',
        value: (record) => record["suites.specs.tests.expectedStatus"],
      },
      {
        label: 'Status',
        value: (record) => record["suites.specs.tests.results.status"],
      },
      {
        label: 'Error Message',
        value: (record) => {
          return record["suites.specs.tests.results.error.message"]
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 1024);
        },
      },
    ];

    const transforms = [
      unwind({
        paths: [
          'suites',
          'suites.specs',
          'suites.specs.tests',
          'suites.specs.tests.results'
        ],
        blankOut: false
      }),
      flatten({ objects: true, arrays: true })
    ];

    const parser = new Parser({ fields, transforms });
    const csv = parser.parse(jsonData);

    fs.writeFileSync(outputFile, csv);
    console.log(`CSV file successfully generated at: ${outputFile}`);

  } catch (error) {
    console.error('Error generating CSV:', error.message);
  }
}

// Exclude the first two entries for `node app.js`
const args = process.argv.slice(2);
const [inputFile, outputFile] = args;

if (!inputFile || !outputFile) {
  console.error("Usage: node app.js <inputFile> <outputFile>");
  process.exit(1);
}

// Run the function to generate the CSV
generateCSV(inputFile, outputFile);

// Creates the PDF report and opens the phone's share sheet (Messenger, Viber, Gmail, Drive, Files…).
// Uses expo-print (HTML → PDF), expo-file-system and expo-sharing — all work in Expo Go.
//
// Why the extra file step?
// On Android, expo-print saves its PDF in a cache folder that Expo Go does NOT allow
// other modules to read ("Not allowed to read file under given URL"). So we ask
// expo-print for the PDF as base64 data and write it ourselves into this app's own
// cache folder (Paths.cache), which sharing is allowed to read. Bonus: the shared
// file gets a readable name instead of a random one.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { buildReportFileName, buildReportHtml } from '../services/pdfReportService';

/** Writes base64 PDF data to <app cache>/<fileName>.pdf and returns that File. */
function savePdfToCache(base64, fileName) {
  const file = new File(Paths.cache, `${fileName}.pdf`);
  if (file.exists) file.delete(); // replace an older report from the same day
  file.write(base64, { encoding: 'base64' });
  return file;
}

/**
 * Returns { ok: true } or { ok: false, error }.
 * If sharing is not available on the device, the print dialog opens instead
 * (choose "Save as PDF" there).
 */
export async function exportReportPdf(projectData, summary, warnings) {
  try {
    const html = buildReportHtml(projectData, summary, warnings);
    const fileName = buildReportFileName(projectData.project.name);
    const { base64 } = await Print.printToFileAsync({ html, base64: true });
    if (!base64) throw new Error('The PDF could not be generated.');

    const pdfFile = savePdfToCache(base64, fileName);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfFile.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: fileName,
      });
    } else {
      await Print.printAsync({ uri: pdfFile.uri });
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message ?? 'Could not create the PDF report.' };
  }
}

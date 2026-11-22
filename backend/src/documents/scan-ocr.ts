import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const MAX_OCR_PAGES = 20;
const MAX_PAGE_TEXT_BYTES = 1024 * 1024;

export async function recognizeImage(path: string, timeout = 30_000): Promise<string> {
  try {
    const { stdout } = await run('tesseract', [path, 'stdout', '-l', 'pol', '--psm', '3'], {
      timeout,
      maxBuffer: MAX_PAGE_TEXT_BYTES,
      env: { ...process.env, OMP_THREAD_LIMIT: '2' },
    });
    return stdout.trim();
  } catch (error) {
    if (error.code === 'ENOENT' || /Failed loading language|Error opening data file/.test(error.stderr || '')) {
      throw new ServiceUnavailableException('Odczyt skanów wymaga Tesseract z językiem polskim (pol).');
    }
    throw new BadRequestException('Nie udało się odczytać skanu. Sprawdź czytelność obrazu lub wgraj mniejszy plik.');
  }
}

export async function recognizePdfPages(path: string, directory: string, extractedText: string): Promise<string> {
  // Poppler ends each page with a form feed, including pages that have no text layer.
  const pages = extractedText.split('\f');
  if (!pages[pages.length - 1]?.trim()) pages.pop();
  const scannedPages = pages.flatMap((text, index) => text.trim() ? [] : [index]);
  if (scannedPages.length > MAX_OCR_PAGES) {
    throw new BadRequestException('Podziel PDF na pliki zawierające maksymalnie 20 stron wymagających OCR.');
  }

  const deadline = Date.now() + 120_000;
  const remainingTime = () => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new BadRequestException('Odczyt PDF trwał zbyt długo. Wgraj dokument w mniejszych częściach.');
    }
    return Math.min(30_000, remaining);
  };

  for (const index of scannedPages) {
    const pageNumber = String(index + 1);
    const output = join(directory, 'scan-page');
    await run('pdftoppm', ['-f', pageNumber, '-l', pageNumber, '-singlefile', '-scale-to', '3000', '-gray', '-png', path, output], {
      timeout: remainingTime(),
      maxBuffer: MAX_PAGE_TEXT_BYTES,
    });
    pages[index] = await recognizeImage(output + '.png', remainingTime());
  }

  return pages.map(text => text.trim()).join('\n\n').trim();
}

// Copies the lab assets (catalog and sprites) into the build of the review site.
import { cpSync } from 'node:fs';

cpSync(new URL('../lab', import.meta.url), new URL('../dist-lab/lab', import.meta.url), {
  recursive: true,
});
console.log('assets do laboratório copiados para dist-lab/lab');

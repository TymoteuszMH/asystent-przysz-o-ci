import { DepartmentRequestPlan } from '../models/document.model';
import { downloadTextFile } from './text-download';

export function downloadDepartmentRequest(
  request: DepartmentRequestPlan,
  context: { subject: string; caseNumber?: string },
): void {
  const deadline = request.deadline.split('-').reverse().join('.');
  const lines = [
    'PROŚBA O PRZYGOTOWANIE STANOWISKA',
    `Adresat: ${request.department}`,
    ...(request.contactEmail ? [`E-mail: ${request.contactEmail}`] : []),
    ...(context.caseNumber ? [`Sygnatura: ${context.caseNumber}`] : []),
    ...(context.subject ? [`Dotyczy: ${context.subject}`] : []),
    ...(deadline ? [`Termin wewnętrzny: ${deadline}`] : []),
    '',
    request.notes,
  ];
  if (request.similarCases?.length) {
    lines.push('', 'Powiązane sprawy:', ...request.similarCases.map(caseNumber => `- ${caseNumber}`));
  }

  const department = request.department.replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  downloadTextFile(`prosba-do-wydzialu-${department || 'stanowisko'}.txt`, lines.join('\n'));
}

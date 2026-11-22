import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all documents', () => {
    const docs = service.findAll();
    expect(docs.length).toBeGreaterThan(0);
  });

  it('should detect similarity for animal care and recommend Wydział Zieleni i Gospodarki Komunalnej - WGK', () => {
    const result = service.checkSimilarity({
      title: 'Wniosek o informację dot. opieki nad bezdomnymi zwierzętami',
      content: 'Proszę o informacje na temat wyłapywania i opieki nad bezdomnymi zwierzętami na terenie miasta.',
      tags: ['zwierzęta', 'odławianie'],
    });

    expect(result.hasMatches).toBe(true);
    expect(result.similarDocuments.length).toBeGreaterThan(0);
    expect(result.similarDocuments[0].similarityPercentage).toBeGreaterThanOrEqual(40);
    expect(result.suggestedDepartments[0].name).toContain('WGK');
  });

  it('should detect similarity for schools and students and recommend Wydział Edukacji i Sportu - WE', () => {
    const result = service.checkSimilarity({
      title: 'Liczba uczniów w szkołach podstawowych',
      content: 'Zestawienie liczby uczniów oraz uczniów cudzoziemców w szkołach.',
      tags: ['edukacja', 'szkoły podstawowe'],
    });

    expect(result.hasMatches).toBe(true);
    expect(result.suggestedDepartments[0].name).toContain('WE');
  });

  it('should generate response model and detect sensitive data for anonymization', () => {
    const feedbackFromDept =
      'W odpowiedzi informujemy, że zgłoszenie przyjął Jan Kowalski pod adresem ul. Gdańska 15/2. ' +
      'Kontakt do mieszkańca: tel. 601 234 567, e-mail: jan.kowalski@poczta.onet.pl, PESEL 85010212345, dowód ABC 123456, rachunek 12 3456 7890 1234 5678 9012 3456.';

    const result = service.generateResponseModel('1', {
      departmentFeedback: feedbackFromDept,
      departmentName: 'Wydział Zieleni i Gospodarki Komunalnej - WGK',
    });

    expect(result.draftResponseText).toContain('URZĄD MIASTA BYDGOSZCZY');
    expect(result.draftResponseText).toContain('art. 13 ust. 1');
    expect(result.dane_podlegajace_anonimizacji.length).toBeGreaterThan(0);

    const categories = result.dane_podlegajace_anonimizacji.map((f) => f.category);
    expect(categories).toContain('email');
    expect(categories).toContain('telefon');
    expect(categories).toContain('adres');
    expect(categories).toContain('pesel');
    expect(categories).toContain('osoba');

    // Sprawdzenie czy w podglądzie zanonimizowanym podmieniono wrażliwe wartości
    expect(result.anonymizedPreviewText).not.toContain('jan.kowalski@poczta.onet.pl');
    expect(result.anonymizedPreviewText).toContain('[zanonimizowano');
  });

  it('should save a closed duplicate with the original case number and anonymized request', () => {
    const original = service.create({
      title: 'Remont chodnika',
      content: 'Proszę o informację o remoncie chodnika. Kontakt: test@example.org.',
      metadata: { numerSprawy: 'BKS.1.2026' },
    });

    const duplicate = service.create({
      title: 'Remont chodnika',
      content: 'Proszę ponownie o informację o remoncie chodnika.',
      duplicateOfId: original.id,
    });
    const saved = service.findById(duplicate.id);
    expect(saved.metadata.decision).toBe('DUPLIKAT');
    expect(saved.metadata.stage).toBe('ZAMKNIETY_DUPLIKAT');
    expect(saved.metadata.duplikatWniosku).toMatchObject({
      sourceId: original.id,
      caseNumber: 'BKS.1.2026',
      responseText: expect.stringContaining('Proszę o informację o remoncie chodnika. Kontakt: [zanonimizowano].'),
    });
    expect(saved.metadata.duplikatWniosku).toMatchObject({
      responseText: expect.stringContaining('Państwa wniosek jest duplikatem'),
    });
  });

  it('should not save a duplicate when the original request does not exist', () => {
    const count = service.findAll().length;
    expect(() => service.create({
      title: 'Test',
      content: 'Test',
      duplicateOfId: 'missing',
    })).toThrow();
    expect(service.findAll()).toHaveLength(count);
  });

  it('requires anonymization review for regular requests and duplicates without an archived answer', () => {
    const request = { title: 'Temat', content: 'Treść po przeglądzie' };
    const original = service.create({ ...request, metadata: { odpowiedzZatwierdzona: ' ' } });
    const count = service.findAll().length;
    const duplicate = { ...request, duplicateOfId: original.id };

    expect(() => service.registerRequest(request)).toThrow('Potwierdź przegląd anonimizacji');
    expect(() => service.registerRequest(duplicate)).toThrow('Potwierdź przegląd anonimizacji');
    expect(service.findAll()).toHaveLength(count);
    expect(service.registerRequest({ ...request, anonymizationReviewed: true }).content).toBe(request.content);
    expect(service.registerRequest({ ...duplicate, anonymizationReviewed: true }).content).toBe(request.content);
  });

  it('closes a duplicate with an archived answer without retaining the incoming request text', () => {
    const original = service.create({
      title: 'Wcześniejszy temat',
      content: 'Wcześniejsza treść',
      metadata: { numerSprawy: 'BIP-123', odpowiedzZatwierdzona: 'Odpowiedź w archiwum' },
    });
    const duplicate = service.registerRequest({
      title: 'Nowy temat',
      content: 'Nowa treść',
      author: 'Jan Nowak',
      duplicateOfId: original.id,
      metadata: { przedmiotZapytania: 'Nowa treść', wnioskodawca: 'Jan Nowak' },
    });

    expect(duplicate.title).toContain('BIP-123');
    expect(duplicate.content).toBe('');
    expect(duplicate.metadata.decision).toBe('DUPLIKAT');
    expect(duplicate.metadata.duplikatWniosku).toMatchObject({
      sourceId: original.id,
      responseText: expect.stringContaining('Wcześniejsza treść'),
    });
    expect(JSON.stringify(service.findById(duplicate.id))).not.toMatch(/Nowa treść|Nowy temat|Jan Nowak/);
  });

  it('should approve response and mark document as answered with anonymization metadata', () => {
    service.update('1', { metadata: { decision: 'OCZEKUJE' } });
    const approvedDoc = service.approveResponse('1', {
      finalResponseText: 'Oficjalna zatwierdzona odpowiedź...',
      anonymizedText: 'Oficjalna [zanonimizowana] odpowiedź...',
      dane_podlegajace_anonimizacji: [
        {
          id: '1',
          category: 'email',
          label: 'E-mail',
          value: 'test@onet.pl',
          replacement: '[zanonimizowano]',
          isAnonymized: true,
        },
      ],
      officerNote: 'Zatwierdzono do publikacji w BIP',
    });

    expect(approvedDoc.metadata.status).toBe('odpowiedziano');
    expect(service.findById('1').metadata.decision).toBe('ROZPATRZONY');
    expect(approvedDoc.metadata.odpowiedzZatwierdzona).toBe('Oficjalna zatwierdzona odpowiedź...');
    expect(approvedDoc.metadata.wersjaAnonimizowana).toBe('Oficjalna [zanonimizowana] odpowiedź...');
    expect(approvedDoc.metadata.notatkaUrzednika).toBe('Zatwierdzono do publikacji w BIP');
  });
});

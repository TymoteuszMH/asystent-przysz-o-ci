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

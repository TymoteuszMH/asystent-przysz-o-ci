import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Document } from './document.interface';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  private readonly documents: Document[] = [
    {
      id: '1',
      title: 'BKS.IV.1431.293.2025 - Opieka i odławianie bezdomnych zwierząt',
      content: 'Opieka i odławianie bezdomnych zwierzat.',
      author: 'Antoni Ptak Stowarzyszenie Obrony Zwierzątek',
      createdAt: '2025-06-12T00:00:00.000Z',
      updatedAt: '2025-06-26T00:00:00.000Z',
      tags: ['informacja publiczna', 'zwierzęta', 'opieka nad zwierzętami', 'odławianie'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.293.2025',
        caseNumber: 'BKS.IV.1431.293.2025',
        wnioskodawca: 'Antoni Ptak Stowarzyszenie Obrony Zwierzątek',
        applicant: 'Antoni Ptak Stowarzyszenie Obrony Zwierzątek',
        przedmiotZapytania: 'Opieka i odławianie bezdomnych zwierzat.',
        dataWplywu: '2025-06-12',
        terminOdpowiedzi: '2025-06-26',
        dataOdpowiedzi: '2025-06-26',
        osobaOdpowiedzialna: 'Pracownik 1',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '2',
      title: 'BKS.IV.1431.307.2025 - Aktualne zestawienie liczby uczniów w szkołach podstawowych',
      content:
        'Aktualne zestawienie liczby uczniów w szkołach podstawowych. Proszę też o podanie liczby obcokrajowców w poszczególnych szkołach.',
      author: 'Ewa Góra',
      createdAt: '2025-06-25T00:00:00.000Z',
      updatedAt: '2025-07-08T00:00:00.000Z',
      tags: ['informacja publiczna', 'edukacja', 'szkoły podstawowe', 'uczniowie', 'cudzoziemcy'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.307.2025',
        caseNumber: 'BKS.IV.1431.307.2025',
        wnioskodawca: 'Ewa Góra',
        applicant: 'Ewa Góra',
        przedmiotZapytania:
          'Aktualne zestawienie liczby uczniów w szkołach podstawowych. Proszę też o podanie liczby obcokrajowców w poszczególnych szkołach.',
        dataWplywu: '2025-06-25',
        terminOdpowiedzi: '2025-07-09',
        dataOdpowiedzi: '2025-07-08',
        osobaOdpowiedzialna: 'Pracownik 2',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '3',
      title: 'BKS.IV.1431.15.2026 - Zapytanie o rzeźbę Ludmiły Stehnovej',
      content:
        'Zapytanie o rzeźbę Ludmiły Stehnovej która została usunięta z wyspy Ronda Grunwaldzkiego.',
      author: 'Jacek Rzeźbiarz',
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-01-14T00:00:00.000Z',
      tags: ['informacja publiczna', 'kultura', 'sztuka', 'rzeźba', 'Rondo Grunwaldzkie'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.15.2026',
        caseNumber: 'BKS.IV.1431.15.2026',
        wnioskodawca: 'Jacek Rzeźbiarz',
        applicant: 'Jacek Rzeźbiarz',
        przedmiotZapytania:
          'Zapytanie o rzeźbę Ludmiły Stehnovej która została usunięta z wyspy Ronda Grunwaldzkiego.',
        dataWplywu: '2026-09-12',
        terminOdpowiedzi: '2026-09-26',
        dataOdpowiedzi: '2026-01-14',
        osobaOdpowiedzialna: 'Pracownik 2',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '4',
      title: 'BKS.IV.1431.16.2026 - Liczba punktów sprzedaży alkoholu w Bydgoszczy',
      content:
        'Pytanie o liczbę punktów sprzedaży alkoholu powstałych od objęcia funkcji prezydenta przez Rafała Bruskiego do dzisiaj.',
      author: 'Jerzy Dociekliwy',
      createdAt: '2026-01-09T00:00:00.000Z',
      updatedAt: '2026-01-20T00:00:00.000Z',
      tags: ['informacja publiczna', 'alkohol', 'koncesje', 'punkty sprzedaży', 'prezydent'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.16.2026',
        caseNumber: 'BKS.IV.1431.16.2026',
        wnioskodawca: 'Jerzy Dociekliwy',
        applicant: 'Jerzy Dociekliwy',
        przedmiotZapytania:
          'Pytanie o liczbę punktów sprzedaży alkoholu powstałych od objęcia funkcji prezydenta przez Rafała Bruskiego do dzisiaj.',
        dataWplywu: '2026-01-09',
        terminOdpowiedzi: '2026-01-23',
        dataOdpowiedzi: '2026-01-20',
        osobaOdpowiedzialna: 'Pracownik 1',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '5',
      title: 'BKS.IV.1431.17.2026 - Realizacja umowy nr 102/TT/2019 z Jakotako sp. z o.o.',
      content:
        'Proszę o udostępnienie informacji publicznej dot.realizacji umowy nr 102/TT/2019 z Jakotako spółką z o.o. zgodnie z załączonymi wnioskami.',
      author: 'abcxyz@jahu.komm',
      createdAt: '2026-01-14T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
      tags: ['informacja publiczna', 'umowy', 'Jakotako', 'zamówienia'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.17.2026',
        caseNumber: 'BKS.IV.1431.17.2026',
        wnioskodawca: 'abcxyz@jahu.komm',
        applicant: 'abcxyz@jahu.komm',
        przedmiotZapytania:
          'Proszę o udostępnienie informacji publicznej dot.realizacji umowy nr 102/TT/2019 z Jakotako spółką z o.o. zgodnie z załączonymi wnioskami.',
        dataWplywu: '2026-01-14',
        terminOdpowiedzi: '2026-01-28',
        dataOdpowiedzi: '2026-01-15',
        osobaOdpowiedzialna: 'Pracownik 2',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '6',
      title: 'BKS.IV.1431.18.2026 - Liczba mieszkańców wg opłat za gospodarowanie odpadami komunalnymi',
      content:
        'Liczba mieszkańców wskazanych ulic według opłat za gospodarowanie odpadami komunalnymi.',
      author: 'Ksiądz',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-26T00:00:00.000Z',
      tags: ['informacja publiczna', 'odpady komunalne', 'gospodarka odpadami', 'mieszkańcy'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.18.2026',
        caseNumber: 'BKS.IV.1431.18.2026',
        wnioskodawca: 'Ksiądz',
        applicant: 'Ksiądz',
        przedmiotZapytania:
          'Liczba mieszkańców wskazanych ulic według opłat za gospodarowanie odpadami komunalnymi.',
        dataWplywu: '2026-01-15',
        terminOdpowiedzi: '1/29/2025',
        dataOdpowiedzi: '2026-01-26',
        osobaOdpowiedzialna: 'Pracownik 1',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '7',
      title: 'BKS.IV.1431.509.2026 - Dokumentacja dotycząca basenu Astorii',
      content:
        'Dokumentacja dotycząca basenu Astorii: projekt zagospodarowania terenu; projekt zagospodarowania zieleni; wizualizacje; zestawienie parametrów technicznych budynku.',
      author: 'Ewa Górna',
      createdAt: '2026-08-05T00:00:00.000Z',
      updatedAt: '2026-09-14T00:00:00.000Z',
      tags: ['informacja publiczna', 'Astoria', 'basen', 'inwestycje', 'dokumentacja', 'projekt'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.509.2026',
        caseNumber: 'BKS.IV.1431.509.2026',
        wnioskodawca: 'Ewa Górna',
        applicant: 'Ewa Górna',
        przedmiotZapytania:
          'Dokumentacja dotycząca basenu Astorii: projekt zagospodarowania terenu; projekt zagospodarowania zieleni; wizualizacje; zestawienie parametrów technicznych budynku.',
        dataWplywu: '2026-08-05',
        terminOdpowiedzi: '19.08.2026/18.09.2026 - doprecyzowanie wniosku',
        dataOdpowiedzi: '2026-09-14',
        osobaOdpowiedzialna: 'Pracownik 2',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '8',
      title: 'BKS.IV.1431.543.2026 - Opieka nad bezdomnymi zwierzętami i ich wyłapywanie',
      content: 'Opieka nad bezdomnymi zwierzętami i ich wyłapywanie.',
      author: 'Stowarzyszenie Obrony Zwierzątek',
      createdAt: '2026-08-14T00:00:00.000Z',
      updatedAt: '2026-09-22T00:00:00.000Z',
      tags: ['informacja publiczna', 'zwierzęta', 'bezdomne zwierzęta', 'wyłapywanie'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.543.2026',
        caseNumber: 'BKS.IV.1431.543.2026',
        wnioskodawca: 'Stowarzyszenie Obrony Zwierzątek',
        applicant: 'Stowarzyszenie Obrony Zwierzątek',
        przedmiotZapytania: 'Opieka nad bezdomnymi zwierzętami i ich wyłapywanie.',
        dataWplywu: '2026-08-14',
        terminOdpowiedzi: '2026-08-28',
        dataOdpowiedzi: '2026-09-22',
        osobaOdpowiedzialna: 'Pracownik 2',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '9',
      title: 'BKS.IV.1431.590.2026 - Kompleks Astoria',
      content: 'Kompleks Astoria.',
      author: 'Budowlanka S.A.',
      createdAt: '2026-09-07T00:00:00.000Z',
      updatedAt: '2026-09-29T00:00:00.000Z',
      tags: ['informacja publiczna', 'Astoria', 'kompleks Astoria', 'inwestycje'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.590.2026',
        caseNumber: 'BKS.IV.1431.590.2026',
        wnioskodawca: 'Budowlanka S.A.',
        applicant: 'Budowlanka S.A.',
        przedmiotZapytania: 'Kompleks Astoria.',
        dataWplywu: '2026-09-07',
        terminOdpowiedzi: '2026-09-21',
        dataOdpowiedzi: '2026-09-29',
        osobaOdpowiedzialna: 'Pracownik 2',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
    {
      id: '10',
      title: 'BKS.IV.1431.599.2026 - Zestawienie liczby uczniów oraz uczniów cudzoziemców w szkołach podstawowych',
      content:
        'Edytowalne zestawienie liczby uczniów oraz uczniów cudzoziemców w poszczególnych szkołach podstawowych w Bydgoszczy - stan na koniec czerwca 2026 oraz stan na wrzesień 2026.',
      author: 'Ewa Góra',
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-18T00:00:00.000Z',
      tags: ['informacja publiczna', 'edukacja', 'szkoły podstawowe', 'uczniowie', 'cudzoziemcy', 'Bydgoszcz'],
      metadata: {
        numerSprawy: 'BKS.IV.1431.599.2026',
        caseNumber: 'BKS.IV.1431.599.2026',
        wnioskodawca: 'Ewa Góra',
        applicant: 'Ewa Góra',
        przedmiotZapytania:
          'Edytowalne zestawienie liczby uczniów oraz uczniów cudzoziemców w poszczególnych szkołach podstawowych w Bydgoszczy - stan na koniec czerwca 2026 oraz stan na wrzesień 2026.',
        dataWplywu: '2026-09-08',
        terminOdpowiedzi: '2026-09-22',
        dataOdpowiedzi: '2026-09-18',
        osobaOdpowiedzialna: 'Pracownik 2',
        pozostaloDni: 0,
        department: 'Biuro Komunikacji Społecznej',
        status: 'odpowiedziano',
      },
    },
  ];

  findAll(): Document[] {
    return this.documents;
  }

  findById(id: string): Document {
    const document = this.documents.find(
      (doc) =>
        doc.id === id ||
        doc.metadata?.caseNumber === id ||
        doc.metadata?.numerSprawy === id,
    );

    if (!document) {
      throw new NotFoundException(`Dokument o ID "${id}" nie został znaleziony`);
    }

    return document;
  }

  create(createDocumentDto: CreateDocumentDto): Document {
    const id =
      createDocumentDto.id ??
      (
        Math.max(
          0,
          ...this.documents
            .map((doc) => parseInt(doc.id, 10))
            .filter((num) => !isNaN(num)),
        ) + 1
      ).toString();

    if (this.documents.some((doc) => doc.id === id)) {
      throw new ConflictException(`Dokument o ID "${id}" już istnieje`);
    }

    const now = new Date().toISOString();

    const newDocument: Document = {
      id,
      title: createDocumentDto.title,
      content: createDocumentDto.content,
      author: createDocumentDto.author ?? 'Anonim',
      createdAt: createDocumentDto.createdAt ?? now,
      updatedAt: createDocumentDto.updatedAt ?? now,
      tags: createDocumentDto.tags ?? [],
      metadata: createDocumentDto.metadata ?? {},
    };

    this.documents.push(newDocument);

    return newDocument;
  }
}

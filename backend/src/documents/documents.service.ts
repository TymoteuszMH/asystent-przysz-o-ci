import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Document } from './document.interface';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CheckSimilarityDto } from './dto/check-similarity.dto';
import { GenerateResponseDto } from './dto/generate-response.dto';
import { ApproveResponseDto } from './dto/approve-response.dto';

export interface SimilarDocumentItem {
  id: string;
  caseNumber: string;
  title: string;
  content: string;
  applicant: string;
  date: string;
  department?: string;
  status?: string;
  tags: string[];
  similarityPercentage: number;
  matchedKeywords: string[];
  daysAgo: number;
}

export interface DepartmentRecommendation {
  id: string;
  name: string;
  confidence: number;
  reason: string;
  isPrimary: boolean;
  contactEmail: string;
}

export interface SimilarityCheckResult {
  hasMatches: boolean;
  similarDocuments: SimilarDocumentItem[];
  suggestedDepartments: DepartmentRecommendation[];
  summary: string;
}

export interface SensitiveField {
  id: string;
  category: 'osoba' | 'email' | 'telefon' | 'adres' | 'pesel' | 'nip' | 'inne';
  label: string;
  value: string;
  replacement: string;
  startIndex: number;
  endIndex: number;
  isAnonymized: boolean;
  legalBasis: string;
}

export interface ResponseModelResult {
  caseNumber: string;
  documentTitle: string;
  applicant: string;
  departmentName: string;
  draftResponseText: string;
  dane_podlegajace_anonimizacji: SensitiveField[];
  anonymizedPreviewText: string;
  generatedAt: string;
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysISO(iso: string, days: number): string {
  const parts = iso.split('-').map(Number);
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() + days);
  return toLocalISO(dt);
}

@Injectable()
export class DocumentsService {
  private documents: Document[] = this.buildInitialDocuments();

  private buildInitialDocuments(): Document[] {
    const today = new Date();
    const todayIso = toLocalISO(today);

    return [
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
    // Aktywne sprawy z index.html (dynamiczne terminy względem dzisiejszej daty):
    {
      id: 'c-7',
      title: 'WOA-III.1431.412.2025 - Rejestr umów zawartych przez Miasto Bydgoszcz w III kwartale 2025 r.',
      content: 'Udostępnienie wyciągu z rejestru umów cywilnoprawnych zawartych przez Urząd Miasta Bydgoszczy w III kwartale 2025 r.',
      author: 'Obywatel',
      createdAt: '2025-11-12T00:00:00.000Z',
      updatedAt: '2025-11-24T00:00:00.000Z',
      tags: ['rejestr umów', 'finanse', 'WFB', 'WZP'],
      metadata: {
        numerSprawy: 'WOA-III.1431.412.2025',
        caseNumber: 'WOA-III.1431.412.2025',
        customId: 'c-7',
        wnioskodawca: 'Obywatel',
        applicant: 'Obywatel',
        przedmiotZapytania: 'Rejestr umów zawartych przez Miasto Bydgoszcz w III kwartale 2025 r.',
        dataWplywu: '2025-11-12',
        terminOdpowiedzi: '2025-11-26',
        dataOdpowiedzi: '2025-11-24',
        stage: 'ODPOWIEDZ_WYSLANA',
        decision: 'ROZPATRZONY',
        status: 'odpowiedziano',
        department: 'WFB',
        departments: ['WFB', 'WZP'],
      },
    },
    {
      id: 'c-8',
      title: 'WOA-III.1431.104.2026 - Koszty rewitalizacji Wyspy Młyńskiej i Młynów Rothera w latach 2022–2026',
      content: 'Zestawienie wydatków inwestycyjnych oraz kosztów utrzymania obiektów na Wyspie Młyńskiej w Bydgoszczy.',
      author: 'Stowarzyszenie Młyny Rothera',
      createdAt: addDaysISO(todayIso, -18) + 'T09:00:00.000Z',
      updatedAt: addDaysISO(todayIso, -18) + 'T09:00:00.000Z',
      tags: ['inwestycje', 'Wyspa Młyńska', 'Młyny Rothera', 'budżet'],
      metadata: {
        numerSprawy: 'WOA-III.1431.104.2026',
        caseNumber: 'WOA-III.1431.104.2026',
        customId: 'c-8',
        wnioskodawca: 'Stowarzyszenie Młyny Rothera',
        applicant: 'Stowarzyszenie Młyny Rothera',
        przedmiotZapytania: 'Koszty rewitalizacji Wyspy Młyńskiej i Młynów Rothera w latach 2022–2026',
        dataWplywu: addDaysISO(todayIso, -18),
        terminOdpowiedzi: addDaysISO(todayIso, 10),
        dataOdpowiedzi: '',
        stage: 'KWERENDA',
        decision: 'OCZEKUJE',
        status: 'w toku',
        department: 'WIM',
        departments: ['WIM', 'WFB', 'BKS'],
      },
    },
    {
      id: 'c-9',
      title: 'WOA-III.1431.118.2026 - Wydatki na zimowe utrzymanie dróg i chodników w Bydgoszczy (sezon 2025/2026)',
      content: 'Łączne koszty akcji Zima poniesione przez ZDMiKP w Bydgoszczy oraz wykaz podmiotów realizujących odśnieżanie.',
      author: 'Rada Osiedla Fordon',
      createdAt: addDaysISO(todayIso, -16) + 'T08:30:00.000Z',
      updatedAt: addDaysISO(todayIso, -16) + 'T08:30:00.000Z',
      tags: ['utrzymanie dróg', 'odśnieżanie', 'ZDMiKP', 'zima'],
      metadata: {
        numerSprawy: 'WOA-III.1431.118.2026',
        caseNumber: 'WOA-III.1431.118.2026',
        customId: 'c-9',
        wnioskodawca: 'Rada Osiedla Fordon',
        applicant: 'Rada Osiedla Fordon',
        przedmiotZapytania: 'Wydatki na zimowe utrzymanie dróg i chodników w Bydgoszczy (sezon 2025/2026)',
        dataWplywu: addDaysISO(todayIso, -16),
        terminOdpowiedzi: addDaysISO(todayIso, -2), // Po terminie
        dataOdpowiedzi: '',
        stage: 'ZAPYTANIA_WYDZIALY',
        decision: 'OCZEKUJE',
        status: 'w toku',
        department: 'ZDMiKP',
        departments: ['ZDMiKP', 'WGK'],
      },
    },
    {
      id: 'c-10',
      title: 'WOA-III.1431.121.2026 - Wpływy ze Strefy Płatnego Parkowania oraz liczba wystawionych wezwań w 2026 r.',
      content: 'Kwota wpływów z opłat za postój pojazdów w Strefie Płatnego Parkowania w Bydgoszczy.',
      author: 'Inicjatywa Mieszkańców Śródmieścia',
      createdAt: addDaysISO(todayIso, -14) + 'T10:00:00.000Z',
      updatedAt: addDaysISO(todayIso, -14) + 'T10:00:00.000Z',
      tags: ['parkowanie', 'SPP', 'ZDMiKP', 'opłaty'],
      metadata: {
        numerSprawy: 'WOA-III.1431.121.2026',
        caseNumber: 'WOA-III.1431.121.2026',
        customId: 'c-10',
        wnioskodawca: 'Inicjatywa Mieszkańców Śródmieścia',
        applicant: 'Inicjatywa Mieszkańców Śródmieścia',
        przedmiotZapytania: 'Wpływy ze Strefy Płatnego Parkowania oraz liczba wystawionych wezwań w 2026 r.',
        dataWplywu: addDaysISO(todayIso, -14),
        terminOdpowiedzi: todayIso, // Dzisiaj
        dataOdpowiedzi: '',
        stage: 'W_PRZYGOTOWANIU',
        decision: 'OCZEKUJE',
        status: 'w toku',
        department: 'ZDMiKP',
        departments: ['ZDMiKP', 'WFB'],
      },
    },
    {
      id: 'c-11',
      title: 'WOA-III.1431.122.2026 - Umowy na nasadzenia drzew i pielęgnację zieleni przyulicznej w dzielnicy Fordon',
      content: 'Udostępnienie umów oraz protokołów odbioru prac dotyczących nasadzeń zastępczych drzew w dzielnicy Fordon.',
      author: 'Społeczni Opiekunowie Drzew',
      createdAt: addDaysISO(todayIso, -14) + 'T11:20:00.000Z',
      updatedAt: addDaysISO(todayIso, -14) + 'T11:20:00.000Z',
      tags: ['zieleń', 'drzewa', 'nasadzenia', 'Fordon', 'WGK'],
      metadata: {
        numerSprawy: 'WOA-III.1431.122.2026',
        caseNumber: 'WOA-III.1431.122.2026',
        customId: 'c-11',
        wnioskodawca: 'Społeczni Opiekunowie Drzew',
        applicant: 'Społeczni Opiekunowie Drzew',
        przedmiotZapytania: 'Umowy na nasadzenia drzew i pielęgnację zieleni przyulicznej w dzielnicy Fordon',
        dataWplywu: addDaysISO(todayIso, -14),
        terminOdpowiedzi: todayIso, // Dzisiaj
        dataOdpowiedzi: '',
        stage: 'BRAK_DZIALAN',
        decision: 'NIEROZPATRZONY',
        status: 'nierozpatrzony',
        department: 'WGK',
        departments: ['WGK', 'WZP'],
      },
    },
    {
      id: 'c-12',
      title: 'WOA-III.1431.124.2026 - Dotacje celowe dla klubów sportowych i stowarzyszeń kultury fizycznej w 2026 r.',
      content: 'Wykaz podmiotów, które otrzymały w 2026 r. dotacje z budżetu Miasta Bydgoszczy na szkolenie dzieci i młodzieży.',
      author: 'Klub Sportowy Zawisza',
      createdAt: addDaysISO(todayIso, -13) + 'T12:00:00.000Z',
      updatedAt: addDaysISO(todayIso, -13) + 'T12:00:00.000Z',
      tags: ['sport', 'dotacje', 'dzieci', 'młodzież', 'WES'],
      metadata: {
        numerSprawy: 'WOA-III.1431.124.2026',
        caseNumber: 'WOA-III.1431.124.2026',
        customId: 'c-12',
        wnioskodawca: 'Klub Sportowy Zawisza',
        applicant: 'Klub Sportowy Zawisza',
        przedmiotZapytania: 'Dotacje celowe dla klubów sportowych i stowarzyszeń kultury fizycznej w 2026 r.',
        dataWplywu: addDaysISO(todayIso, -13),
        terminOdpowiedzi: addDaysISO(todayIso, 1), // Jutro
        dataOdpowiedzi: '',
        stage: 'ZAPYTANIA_WYDZIALY',
        decision: 'OCZEKUJE',
        status: 'w toku',
        department: 'WES',
        departments: ['WES', 'WFB'],
      },
    },
    {
      id: 'c-13',
      title: 'WOA-III.1431.125.2026 - Przetarg na rozbudowę trasy tramwajowej i modernizację ul. Gdańskiej',
      content: 'Zestawienie złożonych ofert oraz punktacji w postępowaniu na przebudowę torowiska tramwajowego w ciągu ul. Gdańskiej.',
      author: 'Bydgoski Ruch Miejski',
      createdAt: addDaysISO(todayIso, -13) + 'T14:15:00.000Z',
      updatedAt: addDaysISO(todayIso, -13) + 'T14:15:00.000Z',
      tags: ['przetarg', 'tramwaje', 'Gdańska', 'torowisko', 'WZP', 'ZDMiKP'],
      metadata: {
        numerSprawy: 'WOA-III.1431.125.2026',
        caseNumber: 'WOA-III.1431.125.2026',
        customId: 'c-13',
        wnioskodawca: 'Bydgoski Ruch Miejski',
        applicant: 'Bydgoski Ruch Miejski',
        przedmiotZapytania: 'Przetarg na rozbudowę trasy tramwajowej i modernizację ul. Gdańskiej',
        dataWplywu: addDaysISO(todayIso, -13),
        terminOdpowiedzi: addDaysISO(todayIso, 1), // Jutro
        dataOdpowiedzi: '',
        stage: 'W_PRZYGOTOWANIU',
        decision: 'OCZEKUJE',
        status: 'w toku',
        department: 'WZP',
        departments: ['WZP', 'WIM', 'ZDMiKP'],
      },
    },
    {
      id: 'c-14',
      title: 'WOA-III.1431.126.2026 - Wyniki głosowania i harmonogram realizacji projektów Bydgoskiego Budżetu Obywatelskiego',
      content: 'Zbiorcza informacja o stanie realizacji projektów osiedlowych BBO na osiedlach Szwederowo i Błonie.',
      author: 'Koordynator BBO',
      createdAt: addDaysISO(todayIso, -11) + 'T09:40:00.000Z',
      updatedAt: addDaysISO(todayIso, -2) + 'T14:00:00.000Z',
      tags: ['BBO', 'budżet obywatelski', 'Szwederowo', 'Błonie', 'BKS'],
      metadata: {
        numerSprawy: 'WOA-III.1431.126.2026',
        caseNumber: 'WOA-III.1431.126.2026',
        customId: 'c-14',
        wnioskodawca: 'Koordynator BBO',
        applicant: 'Koordynator BBO',
        przedmiotZapytania: 'Wyniki głosowania i harmonogram realizacji projektów Bydgoskiego Budżetu Obywatelskiego',
        dataWplywu: addDaysISO(todayIso, -11),
        terminOdpowiedzi: addDaysISO(todayIso, 3),
        dataOdpowiedzi: addDaysISO(todayIso, -2),
        stage: 'ODPOWIEDZ_WYSLANA',
        decision: 'ROZPATRZONY',
        status: 'odpowiedziano',
        department: 'BKS',
        departments: ['BKS', 'WIM'],
      },
    },
    {
      id: 'c-15',
      title: 'WOA-III.1431.129.2026 - Wykaz miejskich lokali użytkowych oddanych w najem bezprzetargowy w Śródmieściu',
      content: 'Liczba oraz powierzchnia lokali użytkowych stanowiących zasób Miasta Bydgoszczy położonych w Śródmieściu.',
      author: 'Przedsiębiorcy Bydgoscy',
      createdAt: addDaysISO(todayIso, -8) + 'T13:00:00.000Z',
      updatedAt: addDaysISO(todayIso, -8) + 'T13:00:00.000Z',
      tags: ['lokale', 'najem', 'Śródmieście', 'WMG'],
      metadata: {
        numerSprawy: 'WOA-III.1431.129.2026',
        caseNumber: 'WOA-III.1431.129.2026',
        customId: 'c-15',
        wnioskodawca: 'Przedsiębiorcy Bydgoscy',
        applicant: 'Przedsiębiorcy Bydgoscy',
        przedmiotZapytania: 'Wykaz miejskich lokali użytkowych oddanych w najem bezprzetargowy w Śródmieściu',
        dataWplywu: addDaysISO(todayIso, -8),
        terminOdpowiedzi: addDaysISO(todayIso, 6),
        dataOdpowiedzi: '',
        stage: 'BRAK_DZIALAN',
        decision: 'OCZEKUJE',
        status: 'w toku',
        department: 'WMG',
        departments: ['WMG'],
      },
    },
    {
      id: 'c-16',
      title: 'WOA-III.1431.133.2026 - Koszty funkcjonowania lodowiska Torbyd oraz basenów miejskich w 2026 r.',
      content: 'Informacja o kosztach energii elektrycznej, cieplnej oraz przychodach na lodowisku Torbyd w Bydgoszczy.',
      author: 'Portal Sportowa Bydgoszcz',
      createdAt: addDaysISO(todayIso, -3) + 'T15:20:00.000Z',
      updatedAt: addDaysISO(todayIso, -3) + 'T15:20:00.000Z',
      tags: ['Torbyd', 'lodowisko', 'baseny', 'koszty', 'energia', 'WES'],
      metadata: {
        numerSprawy: 'WOA-III.1431.133.2026',
        caseNumber: 'WOA-III.1431.133.2026',
        customId: 'c-16',
        wnioskodawca: 'Portal Sportowa Bydgoszcz',
        applicant: 'Portal Sportowa Bydgoszcz',
        przedmiotZapytania: 'Koszty funkcjonowania lodowiska Torbyd oraz basenów miejskich w 2026 r.',
        dataWplywu: addDaysISO(todayIso, -3),
        terminOdpowiedzi: addDaysISO(todayIso, 11),
        dataOdpowiedzi: '',
        stage: 'BRAK_DZIALAN',
        decision: 'OCZEKUJE',
        status: 'w toku',
        department: 'WES',
        departments: ['WES', 'WFB'],
      },
    },
  ];
  }

  findAll(): Document[] {
    return this.documents;
  }

  findById(id: string): Document {
    const document = this.documents.find(
      (doc) =>
        doc.id === id ||
        doc.metadata?.caseNumber === id ||
        doc.metadata?.numerSprawy === id ||
        doc.metadata?.customId === id,
    );

    if (!document) {
      throw new NotFoundException(`Dokument o ID "${id}" nie został znaleziony`);
    }

    return document;
  }

  reset(): Document[] {
    this.documents = this.buildInitialDocuments();
    return this.documents;
  }

  update(id: string, updateDto: UpdateDocumentDto): Document {
    const document = this.findById(id);

    if (updateDto.title !== undefined) {
      document.title = updateDto.title;
    }
    if (updateDto.content !== undefined) {
      document.content = updateDto.content;
    }
    if (updateDto.author !== undefined) {
      document.author = updateDto.author;
    }
    if (updateDto.tags !== undefined) {
      document.tags = updateDto.tags;
    }
    if (updateDto.metadata !== undefined) {
      document.metadata = {
        ...document.metadata,
        ...updateDto.metadata,
      };
    }
    document.updatedAt = updateDto.updatedAt ?? new Date().toISOString();

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

  /**
   * Sprawdza zbieżność nowego wniosku z poprzednimi wnioskami z ostatniego roku
   * oraz proponuje właściwe wydziały urzędu do przygotowania odpowiedzi.
   */
  checkSimilarity(dto: CheckSimilarityDto): SimilarityCheckResult {
    const inputTitle = (dto.title || '').trim();
    const inputContent = (dto.content || '').trim();
    const inputTags = dto.tags || [];

    const fullInputText = `${inputTitle} ${inputContent} ${inputTags.join(' ')}`;
    const inputStems = this.extractStems(fullInputText);
    const titleStems = this.extractStems(inputTitle);

    // Wyznaczenie okna czasowego (ostatni rok: 365 dni, z elastycznym zakresem do 550 dni dla bazy testowej)
    const now = new Date();
    const refTime = now.getTime();
    const ONE_YEAR_DAYS = 365;
    const EXTENDED_YEAR_DAYS = 550; // Uwzględnia wnioski z 2025 r.

    const scoredDocs: SimilarDocumentItem[] = [];

    for (const doc of this.documents) {
      const docDateStr =
        doc.metadata?.dataWplywu?.toString() ||
        doc.createdAt ||
        doc.updatedAt;
      const docTime = new Date(docDateStr).getTime();
      const diffDays = Math.max(0, Math.round((refTime - docTime) / (1000 * 60 * 60 * 24)));

      // Filtrujemy dokumenty z ostatniego roku (max 550 dni)
      if (diffDays > EXTENDED_YEAR_DAYS) {
        continue;
      }

      const docTitle = doc.title || '';
      const docContent = doc.content || '';
      const docTags = doc.tags || [];
      const docFullText = `${docTitle} ${docContent} ${docTags.join(' ')}`;
      const docStems = this.extractStems(docFullText);
      const docTitleStems = this.extractStems(docTitle);

      // Obliczenie części wspólnej rdzeni słów
      const intersection = inputStems.filter((s) => docStems.includes(s));
      const uniqueMatched = Array.from(new Set(intersection));

      if (uniqueMatched.length === 0) {
        continue;
      }

      // Podobieństwo bazowe (współczynnik Dice'a)
      const totalTokens = (inputStems.length + docStems.length) / 2;
      let score = (uniqueMatched.length / Math.max(totalTokens, 4)) * 100;

      // Bonus za dopasowanie słów w tytule
      const titleMatches = titleStems.filter((s) => docTitleStems.includes(s));
      if (titleMatches.length > 0) {
        score += titleMatches.length * 15;
      }

      // Bonus za pokrycie tagów
      const commonTags = inputTags.filter((t) =>
        docTags.map((dt) => dt.toLowerCase()).includes(t.toLowerCase()),
      );
      if (commonTags.length > 0) {
        score += commonTags.length * 10;
      }

      // Normalizacja do 15% - 98%
      const finalPercentage = Math.min(98, Math.max(15, Math.round(score)));

      if (finalPercentage >= 20) {
        const caseNumber =
          (doc.metadata?.numerSprawy as string) ||
          (doc.metadata?.caseNumber as string) ||
          `Nr ${doc.id}`;
        const applicant =
          (doc.metadata?.wnioskodawca as string) ||
          (doc.metadata?.applicant as string) ||
          doc.author ||
          'Anonim';
        const department = (doc.metadata?.department as string) || undefined;
        const status = (doc.metadata?.status as string) || undefined;

        scoredDocs.push({
          id: doc.id,
          caseNumber,
          title: doc.title,
          content: doc.content,
          applicant,
          date: doc.metadata?.dataWplywu?.toString() || doc.createdAt.substring(0, 10),
          department,
          status,
          tags: doc.tags,
          similarityPercentage: finalPercentage,
          matchedKeywords: uniqueMatched.slice(0, 8),
          daysAgo: diffDays,
        });
      }
    }

    // Sortowanie zbieżnych dokumentów od najbardziej podobnych
    scoredDocs.sort((a, b) => b.similarityPercentage - a.similarityPercentage);

    // Analiza i rekomendacja wydziałów
    const suggestedDepartments = this.resolveDepartments(inputStems, scoredDocs);

    const hasMatches = scoredDocs.length > 0;
    const summary = hasMatches
      ? `Znaleziono ${scoredDocs.length} zbieżnych wniosków z ostatniego roku (najwyższa zbieżność: ${scoredDocs[0].similarityPercentage}% z wnioskiem ${scoredDocs[0].caseNumber}).`
      : 'Nie wykryto bezpośrednio zbieżnych wniosków z ostatniego roku. Zaproponowano wydziały na podstawie analizy tematycznej.';

    return {
      hasMatches,
      similarDocuments: scoredDocs.slice(0, 5),
      suggestedDepartments,
      summary,
    };
  }

  private resolveDepartments(
    inputStems: string[],
    similarDocs: SimilarDocumentItem[],
  ): DepartmentRecommendation[] {
    const departmentsConfig = [
      {
        id: 'wgk',
        name: 'Wydział Zieleni i Gospodarki Komunalnej - WGK',
        stems: ['zwierz', 'odławi', 'wyłap', 'schronisk', 'bezdomn', 'zieleń', 'park', 'drzew', 'psó', 'kot'],
        weight: 50,
        reason: 'Właściwy w sprawach opieki nad bezdomnymi zwierzętami, ich wyłapywania, zieleni miejskiej i parków.',
        contactEmail: 'wgk@um.bydgoszcz.pl',
      },
      {
        id: 'wgo',
        name: 'Wydział Gospodarki Odpadami - WGO',
        stems: ['odpad', 'śmiec', 'czystoś', 'utylizac', 'opłat za odpad', 'gospodarowani odpad'],
        weight: 50,
        reason: 'Właściwy w sprawach gospodarowania odpadami komunalnymi, czystości i opłat śmieciowych.',
        contactEmail: 'wgo@um.bydgoszcz.pl',
      },
      {
        id: 'we',
        name: 'Wydział Edukacji i Sportu - WE',
        stems: ['szkoł', 'uczn', 'edukac', 'oświat', 'cudzoziem', 'podstawow', 'nauczyciel', 'przedszkol', 'klas'],
        weight: 50,
        reason: 'Właściwy w sprawach sieci szkół podstawowych, statystyk uczniów, uczniów cudzoziemców i organizacji oświaty.',
        contactEmail: 'we@um.bydgoszcz.pl',
      },
      {
        id: 'wim',
        name: 'Wydział Inwestycji Miasta - WIM',
        stems: ['astori', 'basen', 'inwestycj', 'budow', 'obiekt', 'dokumentacj', 'techniczn', 'pływaln'],
        weight: 50,
        reason: 'Właściwy w sprawach dokumentacji technicznej, planowania oraz budowy miejskich obiektów i kompleksów sportowych.',
        contactEmail: 'wim@um.bydgoszcz.pl',
      },
      {
        id: 'wab',
        name: 'Wydział Administracji Budowlanej - WAB',
        stems: ['rzeźb', 'rzeźbiarz', 'sztuk', 'kultur', 'pomnik', 'stehnov', 'zabytk', 'estetyk', 'przestrzen', 'zagospodarowan terenu', 'architektur'],
        weight: 50,
        reason: 'Właściwy w sprawach zagospodarowania terenu, architektury miejskiej, pomników i rzeźb w przestrzeni publicznej.',
        contactEmail: 'wab@um.bydgoszcz.pl',
      },
      {
        id: 'wuk',
        name: 'Wydział Uprawnień Komunikacyjnych - WUK',
        stems: ['alkohol', 'koncesj', 'zezwolen', 'sprzedaż', 'punktów', 'napojów', 'handl', 'lokal', 'pojazd', 'komunikacj'],
        weight: 50,
        reason: 'Właściwy w sprawach zezwoleń i koncesji na sprzedaż napojów alkoholowych, ewidencji punktów handlowych oraz uprawnień komunikacyjnych.',
        contactEmail: 'wuk@um.bydgoszcz.pl',
      },
      {
        id: 'wzp',
        name: 'Wydział Zamówień Publicznych - WZP',
        stems: ['umow', 'zamówien', 'jakotak', 'przetarg', 'wykonawc', 'kontrakt', 'ofert'],
        weight: 50,
        reason: 'Właściwy w sprawach umów z wykonawcami, postępowań przetargowych oraz zamówień publicznych.',
        contactEmail: 'wzp@um.bydgoszcz.pl',
      },
      {
        id: 'woś',
        name: 'Wydział Ochrony Środowiska - WOŚ',
        stems: ['środowisk', 'przyrod', 'drzew', 'wycink', 'powietrz', 'hałas', 'wod', 'rzek'],
        weight: 45,
        reason: 'Właściwy w sprawach ochrony środowiska, przyrody, jakości powietrza i gospodarki wodnej.',
        contactEmail: 'wos@um.bydgoszcz.pl',
      },
      {
        id: 'wmg',
        name: 'Wydział Mienia i Geodezji - WMG',
        stems: ['działk', 'grunt', 'nieruchomośc', 'geodezj', 'lokal miejsk', 'własnośc'],
        weight: 45,
        reason: 'Właściwy w sprawach gospodarowania nieruchomościami miejskimi, działkami i sprawami geodezyjnymi.',
        contactEmail: 'wmg@um.bydgoszcz.pl',
      },
      {
        id: 'wso',
        name: 'Wydział Spraw Obywatelskich - WSO',
        stems: ['mieszkańc', 'meldunk', 'dowod', 'ludnośc', 'pesel', 'obywatelsk'],
        weight: 45,
        reason: 'Właściwy w sprawach ewidencji ludności, dowodów osobistych i liczby mieszkańców.',
        contactEmail: 'wso@um.bydgoszcz.pl',
      },
      {
        id: 'bks',
        name: 'Biuro Komunikacji Społecznej - BKS',
        stems: ['komunikacj', 'społeczn', 'bip', 'konsultacj', 'prezydent', 'ratusz'],
        weight: 15,
        reason: 'Biuro koordynujące centralne udostępnianie informacji publicznej i kontakt z mediami.',
        contactEmail: 'bks@um.bydgoszcz.pl',
      },
    ];

    const departmentScores = departmentsConfig.map((dept) => {
      let score = 0;
      const matched = dept.stems.filter((s) => inputStems.includes(s));
      score += matched.length * dept.weight;

      // Jeśli podobne wnioski z przeszłości zawierają słowa kluczowe tego wydziału
      for (const simDoc of similarDocs) {
        const simDocStems = this.extractStems(`${simDoc.title} ${simDoc.content} ${simDoc.tags.join(' ')}`);
        const simMatched = dept.stems.filter((s) => simDocStems.includes(s));
        if (simMatched.length > 0) {
          score += (simDoc.similarityPercentage / 100) * simMatched.length * 20;
        }
      }

      return {
        ...dept,
        score,
        matchedCount: matched.length,
      };
    });

    departmentScores.sort((a, b) => b.score - a.score);

    const maxScore = Math.max(1, departmentScores[0].score);

    const recommendations: DepartmentRecommendation[] = departmentScores
      .filter((d, index) => d.score > 0 || index === 0)
      .slice(0, 3)
      .map((d, index) => {
        const confidence = Math.min(96, Math.max(35, Math.round((d.score / maxScore) * 92)));
        let customReason = d.reason;

        // Jeśli zbieżny wniosek wskazuje na ten wydział, dodaj informację dla urzędnika
        if (similarDocs.length > 0 && index === 0) {
          customReason += ` Uwaga: Wykryto zbieżność z wnioskiem ${similarDocs[0].caseNumber} z dnia ${similarDocs[0].date}.`;
        }

        return {
          id: d.id,
          name: d.name,
          confidence,
          reason: customReason,
          isPrimary: index === 0,
          contactEmail: d.contactEmail,
        };
      });

    // Zawsze upewniamy się, że jest co najmniej 1 rekomendowany wydział (domyślnie BKS)
    if (recommendations.length === 0) {
      const bks = departmentsConfig.find((d) => d.id === 'bks')!;
      recommendations.push({
        id: bks.id,
        name: bks.name,
        confidence: 65,
        reason: bks.reason,
        isPrimary: true,
        contactEmail: bks.contactEmail,
      });
    }

    return recommendations;
  }

  private extractStems(text: string): string[] {
    const stopWords = new Set([
      'i', 'w', 'z', 'o', 'na', 'do', 'od', 'po', 'ze', 'za', 'pod', 'nad', 'przy',
      'oraz', 'też', 'czy', 'nie', 'to', 'jak', 'że', 'się', 'jest', 'są', 'przez',
      'które', 'która', 'który', 'których', 'proszę', 'udostępnienie', 'informacji',
      'informacja', 'informacje', 'publicznej', 'publiczna', 'publiczne', 'dot', 'dotyczy',
      'dla', 'sp', 'zoo', 'spółka', 'nr', 'wniosek', 'zapytanie', 'stan', 'jego',
      'jej', 'ich', 'tym', 'tego', 'temu', 'także', 'dnia', 'roku', 'lat', 'dni', 'godz', 'a', 'b', 'c',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-ząćęłńóśźż0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    return words.map((w) => this.stemPolishWord(w));
  }

  private stemPolishWord(word: string): string {
    const suffixes = [
      'owych', 'owego', 'owemu', 'owej', 'owym', 'nymi', 'nego', 'nemu', 'nych',
      'nym', 'ach', 'ami', 'ych', 'ego', 'emu', 'iej', 'iem', 'ość', 'ość',
      'om', 'em', 'am', 'ów', 'ie', 'ka', 'ek', 'ce', 'eś', 'aś', 'ą', 'ę',
      'a', 'y', 'e', 'i', 'o', 'u',
    ];

    for (const suffix of suffixes) {
      if (word.length - suffix.length >= 3 && word.endsWith(suffix)) {
        return word.slice(0, word.length - suffix.length);
      }
    }

    return word;
  }

  /**
   * Przygotowuje urzędowy model odpowiedzi na podstawie odpowiedzi z wydziału merytorycznego
   * oraz wykrywa wszelkie wrażliwe pola podlegające potencjalnej anonimizacji.
   */
  generateResponseModel(docId: string, dto: GenerateResponseDto): ResponseModelResult {
    const document = this.findById(docId);
    const caseNumber =
      (document.metadata?.numerSprawy as string) ||
      (document.metadata?.caseNumber as string) ||
      `BKS.IV.1431.${document.id}.2026`;
    const applicant =
      (document.metadata?.wnioskodawca as string) ||
      (document.metadata?.applicant as string) ||
      document.author ||
      'Wnioskodawca';
    const deptName =
      dto.departmentName ||
      (document.metadata?.department as string) ||
      'Wydział merytoryczny Urzędu Miasta';

    const todayStr = new Date().toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const dataWplywu =
      document.metadata?.dataWplywu?.toString() ||
      document.createdAt.substring(0, 10);

    // Szablon oficjalnej odpowiedzi urzędu
    const draftResponseText = [
      'URZĄD MIASTA BYDGOSZCZY',
      'Biuro Komunikacji Społecznej',
      `Znak sprawy: ${caseNumber}`,
      `Bydgoszcz, dnia ${todayStr} r.`,
      '',
      'Wnioskodawca:',
      applicant,
      '',
      `Dotyczy: Wniosek o udostępnienie informacji publicznej z dnia ${dataWplywu} r. w sprawie: "${document.title}".`,
      '',
      'ODPOWIEDŹ NA WNIOSEK O UDOSTĘPNIENIE INFORMACJI PUBLICZNEJ',
      '',
      `Działając na podstawie art. 13 ust. 1 w zw. z art. 10 ust. 1 ustawy z dnia 6 września 2001 r. o dostępie do informacji publicznej (Dz. U. z 2022 r. poz. 902 z późn. zm.), w odpowiedzi na Państwa wniosek, po uzyskaniu stanowiska merytorycznego z ${deptName}, uprzejmie informuję:`,
      '',
      dto.departmentFeedback.trim(),
      '',
      'Pouczenie:',
      'Zgodnie z art. 5 ust. 2 ustawy z dnia 6 września 2001 r. o dostępie do informacji publicznej, prawo do informacji publicznej podlega ograniczeniu ze względu na prywatność osoby fizycznej lub tajemnicę przedsiębiorcy. W związku z powyższym dane wrażliwe podlegające ochronie zostały poddane anonimizacji w publicznym rejestrze BIP.',
      '',
      'Z upoważnienia Prezydenta Miasta Bydgoszczy',
      (document.metadata?.osobaOdpowiedzialna as string) || 'Inspektor ds. Informacji Publicznej',
      'Biuro Komunikacji Społecznej',
    ].join('\n');

    // Wykrywanie danych podlegających anonimizacji
    const sensitiveFields = this.detectSensitiveData(draftResponseText, applicant);

    // Generowanie wersji zanonimizowanej (z zastąpionymi polami)
    let anonymizedText = draftResponseText;
    for (const field of sensitiveFields) {
      if (field.isAnonymized) {
        anonymizedText = anonymizedText.split(field.value).join(field.replacement);
      }
    }

    return {
      caseNumber,
      documentTitle: document.title,
      applicant,
      departmentName: deptName,
      draftResponseText,
      dane_podlegajace_anonimizacji: sensitiveFields,
      anonymizedPreviewText: anonymizedText,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Wykrywa pola wrażliwe w tekście podlegające anonimizacji zgodnie z art. 5 ust. 2 UDIP / RODO.
   */
  detectSensitiveData(text: string, applicant?: string): SensitiveField[] {
    const fields: SensitiveField[] = [];
    let counter = 1;

    // 1. Adresy e-mail (z wyłączeniem oficjalnych domen urzędowych)
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    let match: RegExpExecArray | null;
    while ((match = emailRegex.exec(text)) !== null) {
      const email = match[0];
      if (!email.toLowerCase().includes('um.bydgoszcz.pl') && !email.toLowerCase().includes('@bydgoszcz.pl')) {
        fields.push({
          id: `sens_${counter++}`,
          category: 'email',
          label: 'Prywatny adres e-mail',
          value: email,
          replacement: '[zanonimizowano adres e-mail - art. 5 ust. 2 UDIP]',
          startIndex: match.index,
          endIndex: match.index + email.length,
          isAnonymized: true,
          legalBasis: 'art. 5 ust. 2 ustawy o dostępie do informacji publicznej (prywatność osoby fizycznej / RODO)',
        });
      }
    }

    // 2. Numery telefonów
    const phoneRegex = /(?:\+48\s?)?(?:[1-9]\d{2}[\s-]?\d{3}[\s-]?\d{3}|[1-9]\d{1}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      const phone = match[0];
      if (!phone.includes('1431')) {
        fields.push({
          id: `sens_${counter++}`,
          category: 'telefon',
          label: 'Numer telefonu',
          value: phone,
          replacement: '[zanonimizowano nr telefonu - art. 5 ust. 2 UDIP]',
          startIndex: match.index,
          endIndex: match.index + phone.length,
          isAnonymized: true,
          legalBasis: 'art. 5 ust. 2 UDIP (ochrona prywatności osoby fizycznej)',
        });
      }
    }

    // 3. PESEL (11 cyfr)
    const peselRegex = /\b\d{11}\b/g;
    while ((match = peselRegex.exec(text)) !== null) {
      const pesel = match[0];
      fields.push({
        id: `sens_${counter++}`,
        category: 'pesel',
        label: 'Numer PESEL',
        value: pesel,
        replacement: '[zanonimizowano numer PESEL]',
        startIndex: match.index,
        endIndex: match.index + pesel.length,
        isAnonymized: true,
        legalBasis: 'art. 5 ust. 2 UDIP / RODO (szczególna ochrona numeru PESEL)',
      });
    }

    // 4. Adresy zamieszkania / ulicy z numerem domu i lokalu
    const addressRegex = /\b(?:ul\.|ulicy|al\.|alei|pl\.|placu|os\.|osiedlu)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?)\s+(\d+[a-zA-Z]?(?:\s*\/\s*\d+)?)\b/gi;
    while ((match = addressRegex.exec(text)) !== null) {
      const address = match[0];
      fields.push({
        id: `sens_${counter++}`,
        category: 'adres',
        label: 'Adres zamieszkania / nieruchomości prywatnej',
        value: address,
        replacement: '[zanonimizowano adres zamieszkania - art. 5 ust. 2 UDIP]',
        startIndex: match.index,
        endIndex: match.index + address.length,
        isAnonymized: true,
        legalBasis: 'art. 5 ust. 2 UDIP (ochrona prywatności osoby fizycznej)',
      });
    }

    // 5. Seria i numer dowodu osobistego (np. ABC 123456 lub ABC123456)
    const idCardRegex = /\b[A-Z]{3}\s?\d{6}\b/g;
    while ((match = idCardRegex.exec(text)) !== null) {
      const idCard = match[0];
      fields.push({
        id: `sens_${counter++}`,
        category: 'inne',
        label: 'Numer i seria dowodu osobistego',
        value: idCard,
        replacement: '[zanonimizowano numer dowodu osobistego]',
        startIndex: match.index,
        endIndex: match.index + idCard.length,
        isAnonymized: true,
        legalBasis: 'art. 5 ust. 2 UDIP / RODO (dokument tożsamości)',
      });
    }

    // 6. Numer rachunku bankowego osoby fizycznej (26 cyfr, np. PL 12 3456...)
    const ibanRegex = /\b(?:PL\s?)?\d{2}(?:\s?\d{4}){6}\b/gi;
    while ((match = ibanRegex.exec(text)) !== null) {
      const iban = match[0];
      fields.push({
        id: `sens_${counter++}`,
        category: 'inne',
        label: 'Numer rachunku bankowego',
        value: iban,
        replacement: '[zanonimizowano numer rachunku bankowego]',
        startIndex: match.index,
        endIndex: match.index + iban.length,
        isAnonymized: true,
        legalBasis: 'art. 5 ust. 2 UDIP / tajemnica bankowa',
      });
    }

    // 7. Numer księgi wieczystej (np. BY1B/00123456/7)
    const kwRegex = /\b[A-Z0-9]{4}\/\d{8}\/\d\b/g;
    while ((match = kwRegex.exec(text)) !== null) {
      const kw = match[0];
      fields.push({
        id: `sens_${counter++}`,
        category: 'inne',
        label: 'Numer księgi wieczystej',
        value: kw,
        replacement: '[zanonimizowano numer księgi wieczystej]',
        startIndex: match.index,
        endIndex: match.index + kw.length,
        isAnonymized: true,
        legalBasis: 'art. 5 ust. 2 UDIP (prywatność właściciela nieruchomości)',
      });
    }

    // 8. Wnioskodawca będący osobą fizyczną
    if (
      applicant &&
      applicant !== 'Anonim' &&
      !applicant.toLowerCase().includes('sp. z o.o.') &&
      !applicant.toLowerCase().includes('stowarzyszenie') &&
      !applicant.toLowerCase().includes('s.a.')
    ) {
      const escaped = applicant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const appRegex = new RegExp(`\\b${escaped}\\b`, 'g');
      while ((match = appRegex.exec(text)) !== null) {
        if (!fields.some((f) => f.value === match![0])) {
          fields.push({
            id: `sens_${counter++}`,
            category: 'osoba',
            label: 'Imię i nazwisko wnioskodawcy (osoba fizyczna)',
            value: match[0],
            replacement: '[zanonimizowano dane wnioskodawcy - art. 5 ust. 2 UDIP]',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            isAnonymized: true,
            legalBasis: 'art. 5 ust. 2 UDIP (prywatność osoby fizycznej / RODO)',
          });
        }
      }
    }

    // 6. Osoby fizyczne (imiona i nazwiska) pojawiające się w treści odpowiedzi
    const nameRegex = /\b(Jan|Anna|Piotr|Maria|Tomasz|Krzysztof|Paweł|Michał|Ewa|Agnieszka|Magdalena|Katarzyna|Marcin|Marek|Andrzej|Stanisław|Jakub|Antoni|Barbara|Teresa|Jerzy|Jacek|Wojciech|Krystyna|Danuta|Elżbieta|Małgorzata|Zofia|Tadeusz|Henryk)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)\b/g;
    while ((match = nameRegex.exec(text)) !== null) {
      const fullName = match[0];
      // Pomijamy prezydenta i osoby już dodane
      if (!fullName.includes('Bruski') && !fullName.includes('Prezydent') && !fields.some((f) => f.value === fullName)) {
        fields.push({
          id: `sens_${counter++}`,
          category: 'osoba',
          label: 'Dane osobowe (imię i nazwisko osoby fizycznej)',
          value: fullName,
          replacement: '[zanonimizowano dane osobowe - art. 5 ust. 2 UDIP]',
          startIndex: match.index,
          endIndex: match.index + fullName.length,
          isAnonymized: true,
          legalBasis: 'art. 5 ust. 2 UDIP (prywatność osoby fizycznej)',
        });
      }
    }

    // Usunięcie ewentualnych duplikatów wartości
    const uniqueFields: SensitiveField[] = [];
    const seen = new Set<string>();
    for (const f of fields) {
      if (!seen.has(f.value)) {
        seen.add(f.value);
        uniqueFields.push(f);
      }
    }

    return uniqueFields;
  }

  /**
   * Zatwierdzenie ostatecznej odpowiedzi przez urzędnika wraz z zapisanymi danymi o anonimizacji.
   */
  approveResponse(docId: string, dto: ApproveResponseDto): Document {
    const document = this.findById(docId);
    const nowIso = new Date().toISOString();
    const today = nowIso.substring(0, 10);

    document.metadata.status = 'odpowiedziano';
    document.metadata.dataOdpowiedzi = today;
    document.metadata.odpowiedzZatwierdzona = dto.finalResponseText;
    document.metadata.wersjaAnonimizowana = dto.anonymizedText || dto.finalResponseText;
    document.metadata.dane_podlegajace_anonimizacji = dto.dane_podlegajace_anonimizacji || [];
    if (dto.officerNote) {
      document.metadata.notatkaUrzednika = dto.officerNote;
    }
    document.updatedAt = nowIso;

    return document;
  }
}

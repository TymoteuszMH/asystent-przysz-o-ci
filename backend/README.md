# Backend - Asystent Przyszłości

Backend aplikacji oparty na **NestJS 11** z endpointami REST API dla dokumentów JSON.

## Uruchomienie

```bash
cd backend
npm install
npm run start:dev
```

## Konfiguracja Groq

Skopiuj `.env.example` do `.env` i uzupełnij `GROQ_API_KEY`. Analiza wniosku i generowanie projektu odpowiedzi korzystają z modelu `openai/gpt-oss-20b` w Groq.

Import DOCX wymaga programu `python3` (wersja 3.9 lub nowsza). Backend odczytuje tekst główny dokumentu lokalnie. Limit pliku i rozpakowanej treści to 25 MB.

Odczyt skanów JPG, PNG i PDF wymaga `tesseract` z pakietem języka polskiego (`pol`) oraz narzędzi Poppler (`pdftotext`, `pdftoppm`) dla PDF. OCR działa lokalnie, z limitem 25 MB na plik i 20 stron wymagających rozpoznania w jednym PDF.

## Endpointy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/documents` | Pobiera wszystkie dokumenty |
| `GET` | `/documents/:id` | Pobiera dokument po ID lub numerze sprawy |
| `POST` | `/documents` | Rejestruje wniosek po potwierdzeniu przeglądu anonimizacji. Duplikat wniosku z zapisaną odpowiedzią jest zwolniony |
| `POST` | `/documents/extract-docx` | Odczytuje tekst z pliku DOCX w polu multipart `file` |
| `POST` | `/documents/extract-image` | Odczytuje skan JPG lub PNG z pola multipart `file` |
| `POST` | `/documents/extract-pdf` | Odczytuje warstwę tekstową i skanowane strony PDF z pola multipart `file` |

### Przykłady

```bash
# Wszystkie dokumenty
curl http://localhost:3000/documents

# Dokument po ID
curl http://localhost:3000/documents/1

# Dodanie nowego dokumentu
curl -X POST http://localhost:3000/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nowy wniosek",
    "anonymizationReviewed": true,
    "content": "Treść nowego wniosku...",
    "author": "Jan Kowalski",
    "tags": ["wniosek", "nowy"],
    "metadata": {
      "department": "Biuro Komunikacji Społecznej",
      "status": "nowy"
    }
  }'
```

## Struktura projektu

```
backend/
├── src/
│   ├── documents/
│   │   ├── document.interface.ts    # Interfejs Document
│   │   ├── documents.controller.ts  # Kontroler (endpointy)
│   │   ├── documents.module.ts      # Moduł dokumentów
│   │   └── documents.service.ts     # Logika biznesowa
│   ├── app.module.ts                # Główny moduł
│   └── main.ts                      # Punkt wejścia
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

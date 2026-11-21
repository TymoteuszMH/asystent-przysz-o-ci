# Backend - Asystent Przyszłości

Backend aplikacji oparty na **NestJS 11** z endpointami REST API dla dokumentów JSON.

## Uruchomienie

```bash
cd backend
npm install
npm run start:dev
```

## Endpointy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/documents` | Pobiera wszystkie dokumenty |
| `GET` | `/documents/:id` | Pobiera dokument po ID lub numerze sprawy |
| `POST` | `/documents` | Dodaje nowy dokument |

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

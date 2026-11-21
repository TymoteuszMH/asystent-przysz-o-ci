# Asystent Przyszłości

System wspomagania urzędnika w obsłudze wniosków o informację publiczną z modułami:
1. **Analiza zbieżności wniosków z ostatniego roku** i inteligentnej dystrybucji do wydziałów merytorycznych (`wydzialy`),
2. **Przygotowanie modelu odpowiedzi urzędowej** na podstawie informacji z wydziału,
3. **Automatyczne oznaczanie i anonimizacja danych wrażliwych** (`dane_podlegajace_anonimizacji`) zgodnie z art. 5 ust. 2 ustawy o dostępie do informacji publicznej (UDIP) oraz RODO przed zatwierdzeniem i publikacją w BIP.

---

## Architektura projektu

- **`backend/`** – Serwer REST API w NestJS 11 (`http://localhost:3000`):
  - `GET /documents` – pobieranie wszystkich zapytań
  - `GET /documents/:id` – pobieranie szczegółów zapytania
  - `POST /documents` – rejestracja nowego zapytania
  - `POST /documents/check-similarity` – weryfikacja zbieżności z wnioskami z ostatniego roku i rekomendacja wydziału
  - `POST /documents/:id/generate-response` – generowanie oficjalnego modelu odpowiedzi i wykrywanie danych wrażliwych
  - `POST /documents/:id/approve-response` – zatwierdzenie odpowiedzi przez urzędnika i zapis wersji zanonimizowanej
- **`frontend/`** – Aplikacja SPA w Angular 19 (`http://localhost:4200`):
  - Panel urzędnika, rejestr BIP, wyszukiwanie na żywo,
  - Moduł Drag & Drop z badaniem zbieżności,
  - Warsztat modelowania odpowiedzi urzędowej z interaktywnym panelem `dane_podlegajace_anonimizacji` i zatwierdzaniem.
- **`wydzialy`** – Oficjalny rejestr 19 wydziałów Urzędu Miasta.

---

## Szybki start

### 1. Uruchomienie backendu (NestJS)

```bash
cd backend
npm install
npm run start:dev
```
Backend będzie dostępny pod adresem: `http://localhost:3000`.

### 2. Uruchomienie frontendu (Angular)

W nowym oknie terminala:
```bash
cd frontend
npm install
npm start
```
Frontend otworzy się pod adresem: `http://localhost:4200`.

---

## Kluczowe moduły urzędnika

### 1. Model odpowiedzi i anonimizacja (`dane_podlegajace_anonimizacji`)
- Na podstawie materiałów przesłanych przez wydział system generuje oficjalne pismo z zachowaniem formalizmów urzędowych (nagłówek, znak sprawy, powołanie na art. 13 ust. 1 w zw. z art. 10 ust. 1 UDIP, pouczenie o art. 5 ust. 2 UDIP).
- Silnik analizy danych wrażliwych identyfikuje:
  - Dane osobowe (imiona i nazwiska osób fizycznych, wnioskodawcy, pracowników),
  - Adresy e-mail (z wyłączeniem oficjalnych skrzynek urzędowych),
  - Numery telefonów prywatnych,
  - Numery PESEL,
  - Adresy zamieszkania / nieruchomości prywatnych (ulica, nr domu/lokalu).
- Urzędnik w interaktywnym panelu decyduje o anonimizacji poszczególnych pól z podglądem w czasie rzeczywistym wersji jawnej i wersji zanonimizowanej (do publikacji w BIP).
- Po zatwierdzeniu sprawa otrzymuje status `odpowiedziano`.

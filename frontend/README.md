# Frontend - Asystent Przyszłości (Panel Urzędnika)

Aplikacja frontendowa stworzona w oparciu o **Angular 19** (Standalone Components) dedykowana dla urzędników do zarządzania wnioskami o informację publiczną, badania zbieżności spraw, generowania modeli odpowiedzi i anonimizacji danych wrażliwych.

---

## 🚀 Uruchomienie

### 1. Wymagania wstępne
Upewnij się, że backend NestJS jest uruchomiony na porcie `3000`:
```bash
cd backend
npm run start:dev
```

### 2. Uruchomienie frontendu Angular
```bash
cd frontend
npm start
```

Aplikacja wystartuje pod adresem: **http://localhost:4200**

---

## 📋 Zrealizowane funkcjonalności

1. **Rejestr zapytań (`/documents`)**:
   - Przegląd spraw, filtry statusów, wydziałów, wyszukiwarka na żywo, statystyki.

2. **Wgrywanie wniosków i badanie zbieżności (`/documents/new`)**:
   - Strefa Drag & Drop, weryfikacja zbieżności z wnioskami z ostatniego roku, typowanie wydziałów (WGK, WE, WGO, WIM itd.) i wysyłka próśb o przygotowanie odpowiedzi.

3. **Warsztat modelu odpowiedzi i anonimizacja (`/documents/:id`)**:
   - **Formularz odpowiedzi z wydziału**: wprowadzanie informacji od wydziału merytorycznego z gotowymi szablonami testowymi.
   - **Generowanie modelu urzędowego**: tworzenie sformalizowanego pisma zgodnego z ustawą o dostępie do informacji publicznej.
   - **Panel `dane_podlegajace_anonimizacji`**:
     - Wykrywanie imion i nazwisk, e-maili, telefonów, numerów PESEL i adresów prywatnych.
     - Przełączniki on/off dla każdego wykrytego pola wraz z podstawą prawną (art. 5 ust. 2 UDIP).
     - Możliwość dodania własnej frazy do anonimizacji.
   - **Dwa tryby podglądu**:
     - *Projekt z wyróżnionymi polami* (oznaczenia danych wrażliwych),
     - *Wersja zanonimizowana (BIP)* (gotowa do bezpiecznej publikacji publicznej).
   - **Zatwierdzenie odpowiedzi**:
     - Dodanie adnotacji urzędnika BIP,
     - Zapisanie wersji zanonimizowanej w bazie i zmiana statusu sprawy na `odpowiedziano`.

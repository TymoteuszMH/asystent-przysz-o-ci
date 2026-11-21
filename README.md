#GovFlow

Nasze rozwiązanie to lekka, intuicyjna aplikacja webowa zaprojektowana specjalnie dla urzędników, hostowana w pełni lokalnie na infrastrukturze urzędu. System działa w zamkniętym środowisku i nie wymaga kosztownej integracji z zewnętrznymi systemami urzędowymi. Wykorzystuje lokalnie uruchomiony model językowy oraz lokalną bazę wektorową zasilaną wyłącznie dokumentami wgranymi przez urząd. Gwarantuje to pełną suwerenność danych i zero ryzyka ich wycieku poza urząd.
Działanie:

## 1. Wgranie i analiza formalno-merytoryczna wniosku: 
Urzędnik wgrywa do aplikacji plik z wnioskiem. Lokalny model AI analizuje jego treść, strukturę i formę, automatycznie wyciągając kluczowe dane oraz weryfikując zgodność z wymogami ustawowymi. 

## 2. Przeszukiwanie archiwum i rekomendacja ścieżki:
System przeszukuje lokalną bazę wiedzy i natychmiast wyświetla listę podobnych spraw z ostatniego roku wraz z gotowymi odpowiedziami. Następnie analizuje strukturę organizacyjną Urzędu Miasta Bydgoszczy i wskazuje konkretne wydziały lub biura, do których należy skierować zapytanie o przygotowanie danych merytorycznych.

## 3. Zintegrowany kalendarz wniosków i zarządzanie terminami:
Sprawa trafia do interaktywnej tabeli połączonej z kalendarzem, posortowanej chronologicznie od najstarszych do najnowszych wniosków. System automatycznie wylicza ustawowy termin odpowiedzi i podświetla kolorem wnioski pilne. Urzędnik ma pełną kontrolę nad kartą sprawy oraz statusami na każdym etapie. 

## 4. Agregacja danych z wydziałów i generowanie projektu pisma:
Po otrzymaniu informacji zwrotnych z poszczególnych wydziałów, urzędnik wgrywa je do odpowiedniej sprawy w aplikacji. Lokalny model AI łączy zebrane informacje z kontekstem wniosku oraz wzorami urzędowymi i generuje kompletny projekt pisma wyjściowego.

## 5. Półautomatyczna anonimizacja:
Przed eksportem moduł anonimizacji wykrywa w wygenerowanym projekcie wszelkie nadmiarowe dane wrażliwe i osobowe, podświetlając je na szaro jako sugestie do ukrycia. Urzędnik jednym kliknięciem zatwierdza wybrane fragmenty lub odznacza te, które powinny pozostać jawne. 

## 6. Eksport i pełna kontrola człowieka:
Gotowy, zanonimizowany projekt odpowiedzi jest eksportowany do edytowalnego pliku. System nie wysyła żadnej korespondencji automatycznie - pełni wyłącznie funkcję bezpiecznego asystenta, pozostawiając ostateczną weryfikację merytoryczną oraz wysyłkę w rękach urzędnika.

# Sklep rowerowy - projekt nr 4

## Członkowie zespołu C

- Dawid Kryński
- Julia Zezula
- Kuba Wykocki
- Piotr Makoś

## Zagadnienie biznesowe

Witryna sklepu rowerowego oferującego sprzedaż rowerów, części i akcesoriów oraz dodatkowy serwis naprawczy.

Platforma ma umożliwiać przeglądanie produktów, składanie zamówień, opłacanie ich oraz rezerwację usług naprawy roweru wraz ze sprawdzaniem statusu naprawy.

## Wymagania funkcjonalne

- Niezalogowany użytkownik może przeglądać produkty.
- Niezalogowany użytkownik może filtrować produkty.
- Niezalogowany użytkownik może dodawać i usuwać produkty z koszyka.
- Użytkownik może utworzyć konto.
- Użytkownik może się zalogować.
- Zalogowany użytkownik może złożyć zamówienie.
- Zalogowany użytkownik może opłacić zamówienie.
- Zalogowany użytkownik może sprawdzić status zamówienia.
- Użytkownik może przeglądać dostępne terminy napraw.
- Zalogowany użytkownik może zamówić usługę naprawy roweru.
- Zalogowany użytkownik może sprawdzić status naprawy.
- System obsługuje mockowe płatności.
- System może symulować nieudaną płatność.

## Architektura aplikacji

Aplikacja będzie podzielona na frontend React oraz kilka backendowych serwisów REST.

Każdy serwis backendowy będzie osobną aplikacją Express z własną odpowiedzialnością. Dane będą przechowywane w relacyjnych bazach SQLite obsługiwanych przez Sequelize.

Autentykacja użytkownika będzie oparta o JWT.

## Serwisy

### User Service

Odpowiada za użytkowników i autentykację.

Zakres:

- rejestracja,
- logowanie,
- generowanie JWT,
- dane zalogowanego użytkownika,
- ochrona endpointów wymagających logowania.

### Product Service

Odpowiada za katalog produktów.

Zakres:

- lista produktów,
- szczegóły produktu,
- filtrowanie produktów,
- kategorie,
- ceny i dostępność.

TODO:

- dokładny model produktu,
- endpointy administracyjne,
- sposób filtrowania,
- obsługa stanu magazynowego.

### Order Service

Odpowiada za zamówienia.

Zakres:

- tworzenie zamówienia,
- lista zamówień użytkownika,
- szczegóły zamówienia,
- pozycje zamówienia,
- status zamówienia,
- powiązanie zamówienia z płatnością.

### Payment Service

Mockowy serwis płatności.

Zakres:

- przyjęcie płatności,
- zwrócenie wyniku płatności,
- symulacja sukcesu lub błędu płatności.

### Repair Service

Odpowiada za usługi naprawy roweru.

Zakres:

- lista usług serwisowych,
- kalendarz dostępności serwisu,
- rezerwacja dnia oddania roweru,
- szacowanie dnia odbioru na podstawie czasu naprawy,
- status naprawy,
- lista napraw użytkownika.

## Uruchomienie

```
cd services/user-service
npm install
npm start
```

```
cd services/repair-service
npm install
npm start
```

```
cd frontend
npm install
npm run dev
```

## Konta testowe

- klient: `user` / `user`
- administrator: `admin` / `admin`

## Frontend

Frontend będzie aplikacją React działającą w modelu CSR.

Planowane widoki:

- strona główna,
- lista produktów,
- szczegóły produktu,
- koszyk,
- logowanie,
- rejestracja,
- zamówienia,
- rezerwacja naprawy,
- historia napraw,
- panel konta użytkownika.

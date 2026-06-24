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

Aplikacja jest podzielona na frontend React oraz kilka backendowych serwisów REST.

Każdy serwis backendowy jest osobną aplikacją Express z własną odpowiedzialnością. Dane są przechowywane w relacyjnych bazach SQLite obsługiwanych przez Sequelize.

Autentykacja użytkownika jest oparta o JWT.

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

### Order Service

Odpowiada za zamówienia (port `4003`).

Zakres:

- tworzenie zamówienia,
- lista zamówień użytkownika,
- szczegóły zamówienia,
- pozycje zamówienia,
- status zamówienia,
- rezerwacja produktów w Product Service,
- powiązanie zamówienia z płatnością w Payment Service.

Endpointy:

- `POST /orders` — złożenie zamówienia (JWT),
- `GET /orders` — lista zamówień użytkownika lub wszystkich (admin),
- `GET /orders/:id` — szczegóły zamówienia,
- `PATCH /orders/:id/status` — zmiana statusu (admin).

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

### Szybki start (Windows)

Aby uruchomić wszystkie serwisy i frontend jednym skryptem:

```
start.bat
```

Albo z terminala:

```
.\scripts\start-all.ps1
```

Wymuszenie `npm install` we wszystkich serwisach:

```
.\scripts\start-all.ps1 -Install
```

Skrypt otwiera osobne okna terminala dla każdego serwisu, uruchamia frontend i otwiera aplikację w przeglądarce pod adresem `http://localhost:5173`. Jeśli dany port jest już zajęty, skrypt pomija ten serwis zamiast zgłaszać błąd.

### Ręczne uruchomienie

Każdy serwis uruchamia się w osobnym terminalu.

```
cd services/user-service
npm install
npm run migrate
npm start
```

Konta demo `user/user` i `admin/admin` sa odtwarzane domyslnie przy starcie `user-service`. Mozna to wylaczyc:

```
$env:SEED_DEMO_USERS="false"
npm start
```

```
cd services/product-service
npm install
npm run migrate
npm start
```

Produkty demo sa odtwarzane domyslnie przy starcie `product-service`. Mozna to wylaczyc:

```
$env:SEED_DEMO_PRODUCTS="false"
npm start
```

```
cd services/order-service
npm install
npm run migrate
npm start
```

```
cd services/payment-service
npm install
npm start
```

```
cd services/repair-service
npm install
npm run migrate
npm start
```

Uslugi naprawcze demo sa odtwarzane domyslnie przy starcie `repair-service`. Mozna to wylaczyc:

```
$env:SEED_DEMO_REPAIR_SERVICES="false"
npm start
```

```
cd frontend
npm install
npm run dev
```

### Porty serwisów

| Serwis | Port |
|--------|------|
| User Service | 4001 |
| Product Service | 3002 |
| Order Service | 4003 |
| Repair Service | 4005 |
| Payment Service | 4006 |
| Frontend (Vite) | 5173 |

## Konta testowe

Konta sa domyslnie odtwarzane przy starcie `user-service`.

- klient: `user` / `user`
- administrator: `admin` / `admin`

## Frontend

Frontend jest aplikacją React działającą w modelu CSR.

Widoki:

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

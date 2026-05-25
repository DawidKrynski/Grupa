# VeloShop sklep rowerowy - projekt nr 4 Grupy C

## Członkowie zespołu

- Dawid Kryński
- Julia Zezula
- Kuba Wykocki
- Piotr Makoś

---

# 1. Zagadnienie biznesowe

VeloShop to internetowa platforma sprzedaży rowerów, części i akcesoriów rowerowych z dodatkową obsługą serwisu naprawczego.

System ma umożliwiać przeglądanie katalogu, składanie zamówień, obsługę płatności, zgłaszanie napraw oraz śledzenie statusu zamówień i napraw.

## 1.1 Aktorzy systemu

- Klient niezalogowany - przegląda produkty, filtruje katalog i korzysta z koszyka.
- Klient zalogowany - składa zamówienia, płaci, sprawdza status zamówień i zgłasza naprawy.
- Administrator / pracownik - zarządza produktami, zamówieniami i naprawami.

## 1.2 Główne procesy biznesowe

- zakup rowerów, części i akcesoriów,
- zarządzanie katalogiem,
- obsługa zamówień,
- obsługa płatności,
- zgłaszanie i obsługa napraw,
- autentykacja użytkowników.

---

# 2. Wymagania funkcjonalne

## 2.1 Wymagania ogólne

- Użytkownik może przeglądać i filtrować produkty.
- Użytkownik może dodawać i usuwać produkty z koszyka.
- Użytkownik może utworzyć konto i zalogować się.
- Zalogowany użytkownik może złożyć i opłacić zamówienie.
- Zalogowany użytkownik może sprawdzić status zamówienia.
- Użytkownik może przeglądać dostępne terminy napraw.
- Zalogowany użytkownik może zgłosić naprawę roweru.
- Zalogowany użytkownik może sprawdzić status naprawy.
- System obsługuje mockowe płatności.
- System może symulować nieudaną płatność.
- Administrator może zarządzać produktami, zamówieniami i naprawami.

---

## 2.2 User Service

Odpowiada za rejestrację, logowanie i zarządzanie profilami użytkowników.

Serwis wydaje tokeny JWT podpisane wspólnym sekretem. Udostępnia też `authMiddleware.js`, używany przez pozostałe serwisy do weryfikacji tożsamości.

Role:

- `customer`
- `admin`

Endpointy:

```txt
POST /auth/register
POST /auth/login
GET /users/me
````

### POST `/auth/register`

```json
{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email": "jan@example.com",
  "password": "haslo123"
}
```

### POST `/auth/login`

```json
{
  "email": "jan@example.com",
  "password": "haslo123"
}
```

`GET /users/me` wymaga JWT.

---

## 2.3 Product Service

Odpowiada za katalog produktów i stany magazynowe.

Zakres:

* lista produktów,
* szczegóły produktu,
* filtrowanie po kategorii, marce, cenie i dostępności,
* ceny,
* stany magazynowe,
* rezerwacja produktów przez Order Service i Repair Service.

Endpointy:

```txt
GET /products
GET /products/:id
POST /products
DELETE /products/:id
POST /products/:id/reserve
```

### GET `/products`

Query params:

```txt
category=&brand=&minPrice=&maxPrice=&available=
```

### POST `/products`

Wymaga JWT i roli `admin`.

```json
{
  "name": "Trek Marlin 5",
  "brand": "Trek",
  "category": "MTB",
  "price": 2499,
  "stock": 10,
  "description": "...",
  "imageUrl": "..."
}
```

### POST `/products/:id/reserve`

Endpoint wewnętrzny używany przez Order Service i Repair Service.

```json
{
  "quantity": 2
}
```

---

## 2.4 Order Service

Odpowiada za pełen cykl zamówienia: przyjęcie koszyka, weryfikację dostępności w Product Service, zainicjowanie płatności w Payment Service oraz finalizację.

Endpointy:

```txt
POST /orders
GET /orders
GET /orders/:id
PATCH /orders/:id/status
```

### POST `/orders`

Wymaga JWT.

```json
{
  "items": [
    {
      "productId": 3,
      "quantity": 1
    },
    {
      "productId": 7,
      "quantity": 2
    }
  ],
  "deliveryAddress": "ul. Rowerowa 1, Warszawa",
  "paymentMethod": "card"
}
```

Przykładowe statusy:

```txt
pending
paid
failed
shipped
completed
cancelled
```

---

## 2.5 Payment Service

Mockowa bramka płatności. Symuluje przetwarzanie transakcji.

Endpointy:

```txt
POST /payments
GET /payments/:id
```

### POST `/payments`

```json
{
  "orderId": 15,
  "amount": 2499.00,
  "paymentMethod": "card"
}
```

Przykładowe statusy:

```txt
pending
success
failed
```

---

## 2.6 Repair Service

Odpowiada za obsługę zleceń serwisowych.

Klient zgłasza usterkę, opisując rower. Może wskazać produkt z katalogu Product Service albo podać własny opis. Serwisant aktualizuje status i dodaje notatki. Serwis może odpytywać Product Service o dostępne części zamienne oraz zlecać płatność w Payment Service.

Endpointy:

```txt
GET /repair-services
GET /repair-slots
POST /repairs
GET /repairs
GET /repairs/:id
PATCH /repairs/:id/status
```

### POST `/repairs`

Wymaga JWT.

```json
{
  "productId": 3,
  "bikeDescription": "Trek Marlin 5, 2022",
  "issueDescription": "Pęknięta rama, przeskakujące biegi",
  "repairServiceId": 2,
  "slotId": 5
}
```

### PATCH `/repairs/:id/status`

Wymaga JWT i roli `admin`.

```json
{
  "status": "in_progress"
}
```

Przykładowe statusy:

```txt
booked
accepted
in_progress
waiting_for_parts
ready
completed
cancelled
```

---

## 2.7 Frontend React

Frontend będzie aplikacją React działającą w modelu CSR.

Planowane widoki:

* strona główna,
* katalog produktów,
* szczegóły produktu,
* koszyk,
* logowanie,
* rejestracja,
* proces zamówienia,
* panel użytkownika,
* historia zamówień,
* zgłoszenia napraw,
* status naprawy,
* panel administratora.

---

# 3. Architektura aplikacji

System zostanie zbudowany w architekturze mikroserwisów.

Każdy serwis backendowy będzie osobną aplikacją Node.js/Express z własną bazą SQLite obsługiwaną przez Sequelize.

Frontend React komunikuje się z serwisami przez REST API.

Tożsamość użytkownika będzie przekazywana przez JWT:

```txt
Authorization: Bearer <token>
```

## 3.1 Serwisy systemu

* Frontend React
* User Service
* Product Service
* Order Service
* Payment Service
* Repair Service

## 3.2 Komunikacja między serwisami

Zgodnie z diagramem:

* użytkownik składa zamówienie przez Order Service,
* użytkownik zleca naprawę przez Repair Service,
* Order Service autoryzuje użytkownika przez User Service,
* Repair Service autoryzuje użytkownika przez User Service,
* Order Service rezerwuje produkty w Product Service,
* Repair Service rezerwuje produkty w Product Service,
* Order Service zleca płatność w Payment Service,
* Repair Service zleca płatność w Payment Service.

## 3.3 Diagram komunikacji

![Diagram architektury](architecture-diagram.jpg)

## 3.4 Warstwowa struktura serwisów

Każdy serwis będzie miał podział:

```txt
Routes
  -> Controllers
      -> Services
          -> Models
              -> SQLite Database
```

## 3.5 Bazy danych

Każdy serwis posiada własną bazę SQLite.

Planowany podział:

* User Service - użytkownicy, role, dane logowania.
* Product Service - produkty, kategorie, marki, ceny, stany magazynowe.
* Order Service - zamówienia, pozycje zamówień, statusy.
* Payment Service - płatności, statusy, kwoty, metody płatności.
* Repair Service - usługi, terminy, zgłoszenia, statusy, notatki serwisanta.

---

# 4. Technologie

* Node.js LTS
* Express
* Sequelize
* SQLite
* React
* REST API
* JWT
* CORS

---

# 5. Podsumowanie

Projekt VeloShop zakłada stworzenie sklepu rowerowego z obsługą zamówień, płatności i napraw.

Aplikacja będzie składać się z frontendu React oraz pięciu backendowych serwisów REST:

* User Service
* Product Service
* Order Service
* Payment Service
* Repair Service

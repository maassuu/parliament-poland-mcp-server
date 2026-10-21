# TODO

> Wygenerowano przez /recognize - 2026-05-17, zaktualizowano 2026-10-21
> Fokus: jakość kodu

## Krytyczne

- [x] Zastąpić `any` w handlerach narzędzi typami interfejsów - `src/types/api.ts`
- [x] Poprawić `makeSejmRequest` - zwracać szczegóły błędu (status code, message) zamiast połykać je i zwracać null
- [x] Naprawić błędne endpointy: transkrypcje, grupy bilateralne, zapytania pisemne, proces legislacyjny
- [x] Obsłużyć HTTP 204 (pusta odpowiedź dla nieznanego ID) jako "brak danych"

## Ważne

- [x] Dodać typy generyczne do każdego toola (`makeSejmRequest<Mp>` itd.)
- [x] Wyciągnąć powtarzalny wzorzec handlera do helperów w `src/utils/response.ts`
- [x] Dodać timeout do fetch w `src/utils/api.ts`
- [x] Zsynchronizować wersję - `scripts/sync-version.mjs` w hooku `npm version`
- [x] Dodać linter (Biome) jako skrypt npm i krok CI
- [x] Stronicowanie lokalne dla endpointów, które ignorują `offset`/`limit`, i limit rozmiaru odpowiedzi
- [x] Filtry zgodne ze specyfikacją API (interpelacje, zapytania, procesy, nagrania)
- [x] Nowe narzędzia: szczegóły głosowania, głosowania posła, wyszukiwarka głosowań, treść wypowiedzi, posiedzenia komisji, posiedzenie, zdjęcie posła

## Drobne usprawnienia

- [x] Typy handlerów wyprowadzane ze schematu (`defineTool` + `z.infer`)
- [x] Dodać `.nvmrc`
- [ ] Rozważyć enum/stałe dla endpointów API zamiast template strings w każdym toolu
- [ ] Treść interpelacji i zapytań pisemnych (`/interpellations/{num}/body`, odpowiedzi)
- [ ] Szczegóły posiedzenia komisji i jego zapis (`/committees/{code}/sittings/{num}/html`)

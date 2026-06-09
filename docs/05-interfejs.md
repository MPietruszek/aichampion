# Interfejs użytkownika

## Model UX: "Rozmowy o plikach" (jak ChatGPT/Claude)

Każda rozmowa jest powiązana z konkretnym plikiem. Użytkownik uploaduje regulamin/umowę → powstaje nowa rozmowa → może do niej wracać.

## Układ ekranu

```
┌─────────────────┬────────────────────────────────────────┐
│   SIDEBAR       │   OBSZAR CZATU                         │
│                 │                                        │
│  [+ Nowa        │  ┌──────────────────────────────────┐  │
│   rozmowa]      │  │  Umowa_najmu_2024.pdf        [↓] │  │
│                 │  └──────────────────────────────────┘  │
│  ── Dziś ──     │                                        │
│  📄 Umowa       │   ╭──────────────────────────────╮     │
│     najmu       │   │ Jakie są kary umowne         │     │
│  📄 Regulamin   │   │ za zerwanie umowy?           │     │
│     pracy       │   ╰──────────────────────────────╯     │
│                 │                                        │
│  ── Wcześniej ──│   Zgodnie z §8 pkt 3, kara umowna      │
│  📄 NDA 2023    │   za zerwanie umowy przed terminem      │
│  📄 Umowa B2B   │   wynosi 20% wartości pozostałego       │
│                 │   okresu umowy.                        │
│                 │                                        │
│                 │   Źródło: §8 pkt 3 — Kary umowne  [↗] │
│                 │                                        │
│                 │  ┌──────────────────────────────────┐  │
│                 │  │ Zadaj pytanie o dokument...   [→]│  │
│                 │  └──────────────────────────────────┘  │
└─────────────────┴────────────────────────────────────────┘
```

## Flow: nowa rozmowa

1. Klik **"+ Nowa rozmowa"**
2. Pojawia się modal / drag & drop: wrzuć PDF lub DOCX
3. System indeksuje plik (spinner: "Analizuję dokument...")
4. Po indeksowaniu → otwiera się okno czatu z tym plikiem
5. Rozmowa pojawia się w sidebarze z nazwą pliku jako tytułem

## Elementy UI

### Sidebar
- Lista rozmów pogrupowana: Dziś / Wcześniej / [miesiąc]
- Ikona pliku + nazwa dokumentu jako tytuł rozmowy
- Hover: opcje rename / usuń rozmowę
- Nowa rozmowa = nowy upload (jeden plik = jedna rozmowa)

### Nagłówek czatu
- Nazwa pliku + ikona do pobrania oryginału
- Chip z typem dokumentu (PDF / DOCX) i rozmiarem

### Wiadomości
- Bąbelki jak w standardowym czacie
- Pod odpowiedzią modelu: cytowany fragment z numerem §
- Klik na źródło → podświetlenie fragmentu w dokumencie (opcjonalnie: podgląd PDF obok)

### Input
- Textarea z auto-resize
- Enter = wyślij, Shift+Enter = nowa linia
- Streaming odpowiedzi (tekst pojawia się na żywo)

## Opcjonalne rozszerzenie (v2)

- Podgląd PDF po prawej stronie (split view) z podświetlaniem źródłowych akapitów
- Porównanie dwóch dokumentów: "Otwórz drugą umowę obok"
- Eksport rozmowy do PDF/DOCX

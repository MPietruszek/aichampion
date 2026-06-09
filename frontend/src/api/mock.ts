import type { Conversation, Message } from '../types'

// Rozmowy per user_id — każdy widzi tylko swoje
export const ALL_MOCK_CONVERSATIONS: (Conversation & { user_id: string })[] = [
  // aichampion
  {
    id: '1', user_id: 'demo-1',
    title: 'Umowa najmu lokalu 2024',
    file_name: 'Umowa_najmu_lokalu_2024.pdf',
    file_type: 'pdf',
    file_size: 245000,
    indexed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2', user_id: 'demo-1',
    title: 'Regulamin pracy',
    file_name: 'Regulamin_pracy_v3.docx',
    file_type: 'docx',
    file_size: 189000,
    indexed: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  // admin
  {
    id: '3', user_id: 'demo-2',
    title: 'Umowa NDA z kontrahentem',
    file_name: 'NDA_Contrahent_XYZ.pdf',
    file_type: 'pdf',
    file_size: 98000,
    indexed: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: '4', user_id: 'demo-2',
    title: 'Umowa SaaS z klientem B2B',
    file_name: 'Umowa_SaaS_B2B_2024.pdf',
    file_type: 'pdf',
    file_size: 312000,
    indexed: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

export function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('czat-umowy-auth')
    return JSON.parse(raw ?? '{}')?.state?.user?.user_id ?? ''
  } catch { return '' }
}

export function getMockConversations(): Conversation[] {
  const uid = getCurrentUserId()
  return ALL_MOCK_CONVERSATIONS.filter(c => c.user_id === uid)
}

export const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      conversation_id: '1',
      role: 'user',
      content: 'Jakie są kary umowne za zerwanie umowy przed terminem?',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'm2',
      conversation_id: '1',
      role: 'assistant',
      content:
        'Zgodnie z §8 pkt 3 umowy, kara umowna za zerwanie umowy przed upływem okresu najmu wynosi równowartość 3-miesięcznego czynszu. Najemca jest zobowiązany do zapłaty kary w terminie 14 dni od daty rozwiązania umowy.\n\nDodatkowo, zgodnie z §8 pkt 4, jeśli rozwiązanie nastąpi z winy Najemcy, Wynajmujący ma prawo dochodzić odszkodowania przewyższającego wysokość kary umownej na zasadach ogólnych.',
      sources: [
        { paragraph: '§8 pkt 3', title: 'Kary umowne', text: 'Kara umowna za zerwanie...', score: 0.95 },
        { paragraph: '§8 pkt 4', title: 'Kary umowne', text: 'Wynajmujący ma prawo...', score: 0.82 },
      ],
      created_at: new Date(Date.now() - 3590000).toISOString(),
    },
    {
      id: 'm3',
      conversation_id: '1',
      role: 'user',
      content: 'Kiedy najemca może wypowiedzieć umowę bez kary?',
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'm4',
      conversation_id: '1',
      role: 'assistant',
      content:
        'Według §6 pkt 2 umowy, Najemca może wypowiedzieć umowę bez naliczania kary umownej w następujących przypadkach:\n\n1. Lokal ma wady uniemożliwiające korzystanie z niego zgodnie z przeznaczeniem, a Wynajmujący nie usunął ich w ciągu 30 dni od pisemnego wezwania.\n2. Wynajmujący narusza postanowienia umowy w sposób istotny i nie zaprzestał naruszeń w ciągu 14 dni od pisemnego wezwania.\n3. Najemca traci zdolność do prowadzenia działalności z przyczyn niezależnych od niego (np. cofnięcie licencji przez organ administracji).',
      sources: [
        { paragraph: '§6 pkt 2', title: 'Wypowiedzenie umowy', text: 'Najemca może wypowiedzieć...', score: 0.97 },
      ],
      created_at: new Date(Date.now() - 1790000).toISOString(),
    },
  ],
  '2': [
    {
      id: 'm5',
      conversation_id: '2',
      role: 'user',
      content: 'Ile wynosi okres wypowiedzenia?',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'm6',
      conversation_id: '2',
      role: 'assistant',
      content:
        'Zgodnie z §12 Regulaminu pracy, okresy wypowiedzenia umowy o pracę wynoszą:\n\n- 2 tygodnie — przy stażu pracy krótszym niż 6 miesięcy,\n- 1 miesiąc — przy stażu pracy co najmniej 6 miesięcy,\n- 3 miesiące — przy stażu pracy co najmniej 3 lata.\n\nOkresy te są zgodne z Kodeksem Pracy (art. 36 §1 KP). Regulamin nie przewiduje dłuższych okresów dla stanowisk kierowniczych.',
      sources: [
        { paragraph: '§12', title: 'Rozwiązanie stosunku pracy', text: 'Okresy wypowiedzenia...', score: 0.96 },
      ],
      created_at: new Date(Date.now() - 86390000).toISOString(),
    },
  ],
  '3': [],
}

const MOCK_RESPONSES: Record<string, string> = {
  'dpa-review': `# Przegląd DPA: Contrahent XYZ Sp. z o.o.

**Kierunek:** Jesteśmy procesorem (klient przesyła nam swoje DPA)
**Data przeglądu:** ${new Date().toLocaleDateString('pl-PL')}

## Podsumowanie
Umowa wymaga istotnych zmian przed podpisaniem. Kluczowe problemy to brak listy podprocesorów oraz zbyt krótki termin powiadomienia o naruszeniu.
Problemy: 0🟢 1🟡 2🟠 1🔴

## Przegląd punkt po punkcie

### Określenie ról (art. 28 RODO)
✅ **Co mówi umowa:** §2 prawidłowo identyfikuje strony jako administratora i procesora.
**Ocena:** 🟢 Zgodne z RODO art. 4 ust. 7-8.

### Podprocesorzy (art. 28 ust. 2-4 RODO)
⚠️ **Co mówi umowa:** §5 przyznaje klientowi prawo weta przy każdej zmianie podprocesora.
**Luka:** Prawo weta na poziomie "każdej zmiany" jest nieoperacyjne przy skali SaaS.
**Ocena:** 🟠 Wysokie ryzyko operacyjne.
**Proponowana redakcja:** Zmienić na: "Procesor informuje Administratora z 30-dniowym wyprzedzeniem o planowanej zmianie. Administrator może wyrazić sprzeciw w terminie 14 dni."

### Zgłaszanie naruszeń (art. 33 RODO)
🔴 **Co mówi umowa:** §8 wymaga powiadomienia w ciągu 24 godzin od "powzięcia wiedzy".
**Luka:** RODO wymaga 72 godzin do organu nadzorczego (UODO). Wewnętrzna 24h nie jest standardem — jest niemożliwa do spełnienia przy złożonych incydentach.
**Ocena:** 🔴 Krytyczne.
**Proponowana redakcja:** "Procesor powiadomi Administratora bez zbędnej zwłoki, nie później niż w ciągu 36 godzin od stwierdzenia naruszenia, aby Administrator mógł wywiązać się z obowiązku 72-godzinnego zgłoszenia do UODO (art. 33 RODO)."`,

  'ip-clause-review': `# Przegląd klauzul IP: Umowa o Współpracy z Dev Partner S.A.

**Data przeglądu:** ${new Date().toLocaleDateString('pl-PL')}
**Nasza strona dla IP:** Nabywamy prawa do kodu
**Prawo właściwe:** polskie

## Podsumowanie
Wykryto krytyczną lukę — klauzula cesji nie wymienia pól eksploatacji, co czyni ją nieważną w polskim prawie autorskim.
Problemy: 1🔴 1🟠 0🟡 1🟢

## ⚠️ LUKA W CESJI — KRYTYCZNA

**Sekcja 7.1** przenosi "wszelkie prawa autorskie do kodu" bez wymienienia pól eksploatacji.

**Ryzyko:** Zgodnie z art. 41 ust. 2 Ustawy o prawie autorskim, umowa musi wymieniać pola eksploatacji WPROST. Klauzula "wszelkie prawa" jest nieważna.

**Proponowana redakcja:**
> "Wykonawca przenosi na Zamawiającego autorskie prawa majątkowe do Oprogramowania na następujących polach eksploatacji: (a) utrwalanie i zwielokrotnianie — wytwarzanie egzemplarzy techniką cyfrową; (b) obrót oryginałem lub egzemplarzami; (c) rozpowszechnianie — publiczne udostępnianie w sieciach komputerowych; (d) modyfikacja i tworzenie dzieł zależnych; (e) sublicencjonowanie."`,

  'is-this-a-problem': `⚠️ **Needs a look**

Klauzula ogranicza odpowiedzialność do "równowartości 3-miesięcznych opłat" — to standard rynkowy dla SaaS B2B w Polsce.

Jednak sprawdź §12 ust. 2: jeśli wyłączenie obejmuje "wszelkie szkody bez wyjątku", narusza art. 473 §2 KC (nie można wyłączyć odpowiedzialności za winę umyślną). Dodaj: "z wyłączeniem odpowiedzialności za szkody wyrządzone umyślnie".`,

  'hiring-review': `# Przegląd NDA + Zakaz Konkurencji: TechPartner Sp. z o.o.

**Typ dokumentu:** NDA + Umowa B2B z zakazem konkurencji
**Data przeglądu:** ${new Date().toLocaleDateString('pl-PL')}

## Podsumowanie
Zakaz konkurencji jest prawdopodobnie nieważny — brak ograniczenia geograficznego i brak rekompensaty. NDA jest zgodne z UZNK.
Problemy: 1🔴 1🟠 0🟡 1🟢

## Zakaz konkurencji

### Zakres geograficzny
🔴 **Co mówi umowa:** §9 — "na terytorium całego świata przez 3 lata".
**Problem:** Globalny zakaz konkurencji dla kontraktu B2B w Polsce jest rażąco nieproporcjonalny. Polskie sądy regularnie uznają takie zapisy za sprzeczne z art. 58 §2 KC (zasady współżycia społecznego).
**Proponowana redakcja:** Ogranicz do "terytorium Rzeczypospolitej Polskiej i krajów UE, w których Partner prowadził działalność w trakcie współpracy".

### Rekompensata za zakaz
🟠 **Co mówi umowa:** Brak jakiegokolwiek wynagrodzenia za okres zakazu po zakończeniu współpracy.
**Problem:** W B2B brak rekompensaty nie jest automatycznie nieważny (inaczej niż w prawie pracy — art. 1012 KP), ale znacząco osłabia wykonalność i narażia na miarkowanie kar.`,

  'reg-gap-analysis': `# Analiza Luk Regulacyjnych: Nowa funkcja analityki zachowań użytkowników

**Zakres regulacji:** RODO, PKE, UŚUDE
**Data analizy:** ${new Date().toLocaleDateString('pl-PL')}

## Musi być zrobione (przed uruchomieniem)

| Luka | Naprawa | Właściciel | Termin | Status |
|---|---|---|---|---|
| Brak podstawy prawnej dla trackingu behawioralnego | Dodać "uzasadniony interes" lub zbierać zgodę — LIA do przeprowadzenia | Prawnik / DPO | Przed uruchomieniem | ☐ |
| Cookies analityczne bez uprzedniej zgody | Zaimplementować banner cookies zgodny z PKE art. 173 — pre-checked = nielegalne | Dev / Product | Przed uruchomieniem | ☐ |
| Brak klauzuli informacyjnej dla nowej kategorii danych | Zaktualizować Politykę Prywatności o cel "analityka zachowań" | Prawnik | -7 dni przed | ☐ |

## Powinno być zrobione

| Luka | Naprawa | Właściciel | Termin | Status |
|---|---|---|---|---|
| Brak oceny skutków (DPIA) dla profilowania | Przeprowadzić DPIA — art. 35 RODO, profilowanie na dużą skalę | DPO | Q1 | ☐ |
| Okres retencji danych analitycznych nie określony | Dodać do polityki: max 13 miesięcy (standard GA) | Prawnik | Q1 | ☐ |

## Już zgodne
- ✅ Podstawowe cookies sesyjne — zwolnione z obowiązku zgody (PKE art. 173 ust. 3)
- ✅ Umowy powierzenia z dostawcami analityki (DPA) — aktualny status

## Uwagi specyficzne dla Polski
🍪 **PKE art. 173:** UKE aktywnie egzekwuje przepisy o cookies od 2024. Kary do 3% rocznego przychodu.`,
}

const DEFAULT_RESPONSES = [
  'Zgodnie z §{para} umowy o zachowaniu poufności, strony zobowiązują się do nieujawniania informacji poufnych przez okres 3 lat od daty podpisania umowy. Naruszenie tego obowiązku skutkuje karą umowną w wysokości 50 000 zł.',
  'Na podstawie §{para} NDA, za informacje poufne uznaje się wszelkie dane techniczne, handlowe, finansowe oraz know-how przekazane w związku z realizacją współpracy. Nie stanowią informacji poufnych dane powszechnie dostępne.',
  'Nie znalazłem tej informacji w dokumencie. Zapytanie dotyczy zagadnienia, które nie zostało uregulowane w przesłanych fragmentach umowy.',
]

export async function* mockStreamMessage(content: string, command: string | null = null) {
  await delay(command ? 800 : 400)

  const isCommand = !!command && command in MOCK_RESPONSES
  const para = Math.floor(Math.random() * 10) + 1

  const response = isCommand
    ? MOCK_RESPONSES[command]
    : DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)].replace('{para}', String(para))

  if (!isCommand) {
    yield { type: 'sources' as const, sources: [
      { paragraph: `§${para}`, title: 'Postanowienia ogólne', text: response.slice(0, 80), score: 0.91 },
    ]}
  }

  // Dla komend symuluj wolniejszy streaming (długa analiza)
  const tokenDelay = isCommand ? 15 : 40
  const words = response.split(' ')
  for (const word of words) {
    await delay(tokenDelay)
    yield { type: 'token' as const, content: word + ' ' }
  }

  yield { type: 'done' as const }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

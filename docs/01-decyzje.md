# Decyzje projektowe

## Model

**Wybrany:** `CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512`

**Dlaczego:**
- Jawnie zaprojektowany pod polskie prawo i administrację publiczną
- Dotrenowany na ~15k instrukcji RAG — idealny do pracy z dokumentami
- Instruction-tuned (lepszy do ekstrakcji, porównań, precyzyjnych zadań niż wariant chat)

**Odrzucone alternatywy:**
- `PLLuM-12B-chat-2512` — fallback gdyby brakło VRAM; wyraźnie niższa jakość na długich umowach
- `Llama-PLLuM-70B-chat-2512` — gorszy do zadań precyzyjnych niż instruct

## Precyzja modelu

**Wybrana:** Q8 (kwantyzacja 8-bit)

**Dlaczego nie BF16:**
- Różnica jakości vs BF16: <1–2%, w praktyce nieodróżnialna dla zadań tekstowych/prawnych
- Oszczędność VRAM: 140 GB → 70 GB

**Kiedy warto wrócić do BF16:** nigdy dla tego use-case'u (dotyczyłoby tylko zadań numerycznych)

## Sprzęt

**Wybrany:** 2× A100 40GB (80 GB VRAM łącznie)

**Dlaczego nie H100:**
- Q8 na 70B mieści się w 70 GB — H100 byłoby przepłacaniem
- Koszt: ~$20–30k zakup vs ~$60–80k za 2× H100

**Minimalne wymagania:**
- 2× GPU z 40 GB VRAM każde (A100 40GB lub ekwiwalent)
- Tensor parallelism: 2 (podzielony między oba GPU przez vLLM)

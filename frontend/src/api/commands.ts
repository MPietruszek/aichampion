import { apiFetch } from './client'
import type { SlashCommand } from '../types'

// Statyczna lista komend — backup gdy backend offline (demo mode)
export const STATIC_COMMANDS: SlashCommand[] = [
  {
    name: 'dpa-review',
    label: 'DPA Reviewer',
    description: 'Przegląd Umowy Powierzenia Przetwarzania Danych pod kątem RODO i polskiej UODO',
    hint: 'Analizuje DPA: role, zakres, podprocesorzy, bezpieczeństwo, naruszenia',
  },
  {
    name: 'ip-clause-review',
    label: 'IP Clause Reviewer',
    description: 'Przegląd klauzul własności intelektualnej — prawa do kodu, licencje, cesje',
    hint: 'Sprawdza cesję praw, pola eksploatacji (art. 41 ust. 2 UPA), licencje',
  },
  {
    name: 'is-this-a-problem',
    label: 'Is This a Problem?',
    description: 'Szybki triage zapisu umowy — czy to problem? ✅ / ⚠️ / 🛑',
    hint: 'Wklej klauzulę lub opisz sytuację — dostaniesz ocenę w 1 zdaniu',
  },
  {
    name: 'hiring-review',
    label: 'B2B / NDA Review',
    description: 'Przegląd umowy B2B lub NDA pod kątem zakazu konkurencji, kar i poufności',
    hint: 'Analizuje zakaz konkurencji, kary umowne (art. 483 KC), klauzule NDA',
  },
  {
    name: 'reg-gap-analysis',
    label: 'Reg Gap Analysis',
    description: 'Analiza luk regulacyjnych — RODO, PKE, cookies, nowe funkcje SaaS',
    hint: 'Wskaż regulację lub opisz nową funkcję — dostaniesz plan naprawczy',
  },
]

export const listCommands = async (): Promise<SlashCommand[]> => {
  try {
    return await apiFetch<SlashCommand[]>('/commands')
  } catch {
    return STATIC_COMMANDS
  }
}

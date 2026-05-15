export type Period = "month" | "6months"

export const PERIOD_LABELS: Record<Period, string> = {
  month:     "Este mês",
  "6months": "Últimos 6 meses",
}

export const MOCK_DATA: Record<Period, Record<string, number>> = {
  month: {
    MG: 2_400_000, SP: 2_200_000, RJ: 1_500_000, PE: 1_300_000, BA: 1_100_000,
    PR: 870_000,   RS: 760_000,   SC: 630_000,   GO: 410_000,   CE: 320_000,
    ES: 280_000,   DF: 250_000,   MT: 220_000,   MS: 200_000,   PA: 180_000,
    PB: 150_000,   MA: 140_000,   SE: 125_000,   RN: 115_000,   AL: 100_000,
    PI: 90_000,    AM: 80_000,    RO: 65_000,    TO: 50_000,    AC: 38_000,
    AP: 28_000,    RR: 18_000,
  },
  "6months": {
    SP: 14_200_000, MG: 11_800_000, RJ: 8_900_000, RS: 6_300_000, PR: 5_800_000,
    SC: 4_200_000,  BA: 3_900_000,  GO: 2_700_000, PE: 2_500_000, CE: 2_100_000,
    ES: 1_800_000,  DF: 1_600_000,  MT: 1_400_000, MS: 1_300_000, PA: 1_100_000,
    PB: 980_000,    MA: 890_000,    SE: 800_000,   RN: 730_000,   AL: 650_000,
    PI: 580_000,    AM: 510_000,    RO: 420_000,   TO: 320_000,   AC: 240_000,
    AP: 170_000,    RR: 110_000,
  },
}


export type CityItem = {
  key: string
  label: string
  icon?: string
  children?: CityItem[]
}

export const ALL_CITIES: CityItem[] = [
  { key: 'ame', label: 'AME', icon: '🏥' },
  { key: 'anhembi', label: 'Anhembi', icon: '📍' },
  { key: 'arandu', label: 'Arandu', icon: '📍' },
  { key: 'avare_pref', label: 'Avaré Prefeitura', icon: '🏛️' },
  { key: 'bofete', label: 'Bofete', icon: '📍' },
  { key: 'chavantes', label: 'Chavantes', icon: '📍' },
  { key: 'igaracu', label: 'Igaraçu do Tietê', icon: '📍' },
  { key: 'itatinga', label: 'Itatinga', icon: '📍' },
  { key: 'pardinho_1', label: 'Pardinho 1', icon: '📍' },
  { key: 'pardinho_2', label: 'Pardinho 2', icon: '📍' },
  { key: 'pereiras', label: 'Pereiras', icon: '📍' },
  { key: 'pratania', label: 'Pratânia', icon: '📍' },
  { key: 'sao_manuel_ahbb', label: 'São Manuel AHBb', icon: '🏥' },
  {
    key: 'sao_manuel_pref', label: 'São Manuel Prefeitura', icon: '🏛️',
    children: [
      { key: 'smp_geral_obstetrico', label: 'Geral Obstétrico', icon: '👶' },
      { key: 'smp_geral_transvaginal', label: 'Geral Transvaginal', icon: '🧬' },
      { key: 'smp_mamas', label: 'Mamas', icon: '🎗️' },
      { key: 'smp_osteoarticular', label: 'Osteoarticular', icon: '🦴' },
    ]
  },
  { key: 'torre_de_pedra', label: 'Torre de Pedra', icon: '📍' },
  { key: 'oleo', label: 'Óleo', icon: '🛢️' },
  { key: 'unimed', label: 'Unimed', icon: '🟢' },
]

export function pickCitiesByKeys(keys: string[]): CityItem[] {
  const map = new Map<string, CityItem>()
  const add = (item: CityItem) => map.set(item.key, item)
  ALL_CITIES.forEach(c => {
    add(c)
    c.children?.forEach(add)
  })
  return keys.map(k => map.get(k)).filter(Boolean) as CityItem[]
}

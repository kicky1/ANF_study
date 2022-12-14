import React from 'react';

/**
 * 馃敟 Czym s膮 RENDER PROPS?
 * 
 * TL;DR; to forma odwr贸cenia kontroli w Reakcie, kt贸ry i tak odwraca kontrol臋 馃
 * (bo zamiast bezpo艣rednio montowa膰 DOMa, produkuje VDOMa, a tym zajmuje si臋 i p贸藕niej i kto inny)
 * 
 * Normalnie komponent buduje ca艂y sw贸j widok. Przyjmuje propsy, ma stan
 * - ale sam decyduje o tym jak widok wygl膮da.
 * 
 * Natomiast w przypadku render prop - o cz臋艣ci widoku decyduje SAM, a cz臋艣膰 przychodzi
 * w艂a艣nie jako RENDER PROP - czyli props, kt贸ry jest funkcj膮 produkuj膮c膮 widok
 * (mo偶na by powiedzie膰, 偶e to zagnie偶d偶ony komponent)
 * 
 * Po co?
 * - 偶eby osi膮gn膮膰 elastyczno艣膰, np. jak poni偶ej - o wygl膮dzie LISTY decyduje komponent ItemsList
 * ale o wygl膮dzie pojedynczego ELEMENTU - render prop (czyli rodzic, kt贸ry przekazuje render propa)
 * - niekt贸re komponenty wykorzystuj膮ce render propsy s膮 czysto wizualne (poni偶ej) - a inne zawieraj膮
 * logik臋 (w tym side effecty, np. pobieram dane + renderuj臋 list臋, a pojedyncze elementy - render-prop)
 * 
 * U nas dodatkowo robimy i komponent i render propsa GENERYCZNIE - dzi臋ki temu typ T jest POWI膭ZANY:
 * dotyczy ITEM贸w + render propsa (gdyby艣my przekazali co艣 niekompatybilnego - TS b臋dzie nas 艣ciga艂)
 */

interface ItemsListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode // 馃敟 RENDER PROP
}

export function ItemsList<T extends { id: string | number }>(props: ItemsListProps<T>){
  const { items, renderItem } = props
  return <ul>
    { items.map( item => <li key={item.id}>{ renderItem(item) }</li> ) }
  </ul>
}

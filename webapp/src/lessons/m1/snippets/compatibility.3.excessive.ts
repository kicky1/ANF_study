export {}

interface Human {
  name: string
}

interface Developer extends Human {
  languages: string[]
}

// name i language jest kompatybilne
// jak odkomentujemy `address` - to też kompatybilne
const john = {
  name: "John",
  languages: ['js', 'ts'],
  address: "Liverpool"
}

const dejv = {
  name: "Dejv",
  languages: ['js', 'ts'],
  address: "Liverpool"
}

const dev: Developer = john
const dev2: Developer = dejv

// ale jak podstawimy literał (czyli bez tworzenia zmiennej, do której przypisujemy obiekt np john), to kaboom ❌
const anotherDev: Developer = {
  name: "John",
  languages: ['js', 'ts'],
  address: "Liverpool" // ❌ Object literal may only specify known properties, and 'address' does not exist in type 'Developer'
}

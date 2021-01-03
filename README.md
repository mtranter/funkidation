# Funkidation

## Parse. Don't validate

A typescript typesafe typecurious parsing/validating library.

### Motivation.
Parse raw Javascript objects into higher level domain objects with real types that can be trusted.

Make full use of Typescript's type inference to do away with unnecessary type declarations, while maintaining statically typed goodness.


## tl;dr Real World Usage:
[Parsing complex objects](#parsing-complex-objects)


### Library Primitives
```typescript

type ParserSuccess<A> = { result: A }
type ParserFailure = { errors: NonEmptyArray<{reason: string}> }
type ParserResult<A> = ParserSuccess<A> | ParserFailure

type ParserFor<Output, Input = any> {
    parse: (i: Input) => ParserResult<Output>
}
```

### Simple Literal Parsers
```typescript
import { ParserFor, Parsers, ParserResult } from 'funkidation-core'

const boolLiteralParser: ParserFor<bool, any> = Parsers.bool
const validResult = boolLiteralParser.parse(true)
ParserResult.match(validResult)({
    valid: v => expect(v.result).toEqual(true),
    invalid: i => expect(i).toBeFalsy()
})

const invalidResult = boolLiteralParser.parse("true") // strict parsing. This will fail
ParserResult.match(validResult)({
    valid: v => expect(v.result).toBeFalsy(),
    invalid: i => expect(i).toEqual({reason: "Expected boolean, got 'true'"})
})

const stringLiteralParser: ParserFor<string, any> = Parsers.string
stringLiteralParser.parse("ok!") // valid.result == "ok!"
stringLiteralParser.parse(123) // invalid

const numberLiteralParser: ParserFor<number, any> = Parsers.number
const numArrayParser: ParserFor<number[], any> = Parsers.array(Parsers.number)
const unionLiteralParser: ParserFor<number | string, any> = Parsers.number.or(Parsers.string)
```

### Optional values
```typescript
const boolParser = Parsers.bool.optional()
boolParser.parse(null) // valid.result == null
```

### Conversion parsers
```typescript
const stringConversionParser: ParserResult<string, any> = Parsers.toString
const validResult = stringConversionParser.parse(true)
ParserResult.match(validResult)({
    valid: v => expect(v.result).toEqual("true"),
    invalid: i => expect(i).toBeFalsy()
})

const boolConversionParser: ParserResult<boolean, string> = Parsers.parseBool
const intConversionParser: ParserResult<number, string> = Parsers.parseInt
const floatConversionParser: ParserResult<number, string> = Parsers.parseFloat
const dateConversionParser: ParserResult<number, string> = Parsers.parseDate
```

### Parser Composition
You may notice that the bool, int, float and date conversion parsers are of type `string` in their `Input` type.

These can be constructed by composing parsers together.

```typescript
const stringParser = Parsers.string
const intParser = Parsers.parseInt
const anyToIntParser = stringParser.then(intParser) //type checked

const validResult: ParserResult<number> = anyToIntParser.parse("123")

```

### Functional Combinators

These primitives come with the standard map/flatMap type combinators allowing construction of new parsers from more primitive parsers
```typescript
// map
const numToBoolParser: ParserFor<boolean> = Parsers.number.map(i => i > 0)

// subflatMap
const evenNumberParser: ParserFor<number> = 
    Parsers
        .number
        .subflatMap(n => n % 2 === 0 ? ParserResult.valid(n) : ParserResult.invalid(cons({reason: `Expected an even number. Got ${n}` })))

//flatMap
const smartBoolParser: ParserFor<boolean> = 
    Parsers
        .string
        .or(Parsers.number)
        .flatMap(s => typeof s == 'number' ? numToBoolParser : Parsers.parseBool)

```

### Parsing Complex Objects
```typescript
const parser = Parsers.for({
    name: Parsers.string,
    age: Parsers.number,
    isMale: Parsers.bool.optional(true).or(Parsers.parseBool),
    occupation: Parsers.for({
        title: Parsers.string,
        startDate: Parsers.string.then(Parsers.parseDate)
    })
})

const result = parser.parse({
    name: "Jolene",
    age: 30,
    isMale: "false",
    occupation: {
        title: "Devops Manager",
        startDate: "01 Jan 2020"
    }
})

ParserResult.match(result)({
    valid: a => expect(a.result).toEqual({
        name: "Jolene",
        age: 30,
        isMale: false,
        occupation: {
            title: "Devops Manager",
            startDate: new Date(2020, 0, 1)
        }
    }),
    invalid: e => expect(e).toBeFalsy()
})

```

### Parsers for recursive types

Explicit type declarations are required here.

```typescript

type Language = { readonly name: string, readonly influencedBy?: readonly Language[] }

const languageParser: ParserFor<Language> = Parsers.for({
    name: Parsers.string,
    influencedBy: Parsers.array(() => languageParser).optional()
})
const typescript = {
    name: "Typescript",
    influencedBy: [{
        name: "C#",
        influencedBy: [{ name: "Java" }, { name: "C++" }]
    }, {
        name: "Scala",
        influencedBy: [{ name: "Haskell" }, { name: "ML" }]
    }]
}

const result: ParserResult<Language> = languageParser.parse(typescript)
ParserResult.match(result)({
    valid: v => expect(v.result).toEqual(typescript),
    invalid: e => expect(e).toBeFalsy()
})
```

# Funkidation

## Parse. Don't validate

A typescript typesafe typecurious parsing/validating library.

### Usage.

```typescript

describe("#for", () => {

    it("should return a valid parsed object", () => {
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
    })
    it("should return a valid result for recursive types", () => {
        type Language = { name: string, influencedBy?: Language[]}

        const languageParser = Parsers.for<Language>({
            name: Parsers.string,
            influencedBy: Parsers.array(() => languageParser).optional(true)
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
            valid: v => {
                const language: Language = v.result
                expect(v.result).toEqual(typescript)
            },
            invalid: e => expect(e).toBeFalsy()
        })
    })
})
```
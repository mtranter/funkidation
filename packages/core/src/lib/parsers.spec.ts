import { ParserFor, Parsers, ParserResult } from './parsers'

describe("Parsers", () => {
    describe("#string", () => {
        const parser = Parsers.string
        it("should return valid for a valid string", () => {
            const a = parser.parse("a")
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual("a"),
                invalid: e => expect(e).toBeFalsy()
            })
        })

        it("should return invalid for an invalid string", () => {
            const a = parser.parse(1)
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })

        })
    })
    describe("#toString", () => {
        const parser = Parsers.toString
        it("should return valid for a valid string", () => {
            const a = parser.parse("a")
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual("a"),
                invalid: e => expect(e).toBeFalsy()
            })
        })

        it("should return valid for an invalid string", () => {
            const a = parser.parse(1)
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual("1"),
                invalid: e => expect(e).toBeFalsy()
            })

        })
    })
    describe("#number", () => {
        const parser = Parsers.number
        it("should return valid for a valid number", () => {
            const a = parser.parse(1)
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual(1),
                invalid: e => expect(e).toBeFalsy()
            })
        })

        it("should return invalid for an invalid number", () => {
            const a = parser.parse("a")
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })

        it("should return invalid for a string that contains a valid number", () => {
            const a = parser.parse("1")
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })
    })

    describe("#parseInt", () => {
        const parser = Parsers.parseInt
        it("should return invalid for an invalid number", () => {
            const a = parser.parse("a")
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })

        it("should return valid for a string that contains a valid number", () => {
            const a = parser.parse("1")
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual(1),
                invalid: e => expect(e).toBeFalsy()
            })
        })
    })

    describe("#parseFloat", () => {
        const parser = Parsers.parseFloat
        it("should return invalid for an invalid number", () => {
            const a = parser.parse("a")
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })

        it("should return valid for a string that contains a valid number", () => {
            const a = parser.parse("1")
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual(1),
                invalid: e => expect(e).toBeFalsy()
            })
        })
    })

    describe("#boolean", () => {
        const parser = Parsers.bool
        it("should return valid for a valid boolean", () => {
            const a = parser.parse(true)
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual(true),
                invalid: e => expect(e).toBeFalsy()
            })
        })

        it("should return invalid for an invalid boolean", () => {
            const a = parser.parse("a")
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })

        it("should return invalid for an string that container a valid boolean", () => {
            const a = parser.parse("true")
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })
    })
    describe("#parseBool", () => {
        const parser = Parsers.parseBool

        it("should return invalid for an invalid number", () => {
            const a = parser.parse("a")
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })

        it("should return valid for a string that contains a valid bool", () => {
            const a = parser.parse("true")
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual(true),
                invalid: e => expect(e).toBeFalsy()
            })
        })
    })
    describe("#array", () => {
        const parser = Parsers.array(Parsers.number)
        it("should return a valid result for an array of numbers", () => {
            const a = parser.parse([1, 2, 3, 4])
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual([1, 2, 3, 4]),
                invalid: e => expect(e).toBeFalsy()
            })
        })

        it("should return an invalid result for an array with a bad member", () => {
            const a = parser.parse([1, "2", 3, 4])
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })
        it("should return an invalid result for a non array", () => {
            const a = parser.parse(1)
            ParserResult.match(a)({
                valid: a => expect(a.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })
    })

    describe("#parseDate", () => {
        const parser = Parsers.parseDate

        it("should parse a valid ISO date", () => {
            const result = parser.parse("1970-01-01T00:00:00.000Z")
            ParserResult.match(result)({
                valid: d => expect(d.result.getTime()).toEqual(0),
                invalid: e => expect(e).toBeFalsy()
            })
        })
        it("should parse a valid date", () => {
            const result = parser.parse("01 Jan 1970 00:00:00 GMT")
            ParserResult.match(result)({
                valid: d => expect(d.result.toISOString()).toEqual("1970-01-01T00:00:00.000Z"),
                invalid: e => expect(e).toBeFalsy()
            })
        })
        it("should return an invalid result for an invalid ISO date", () => {
            const result = parser.parse("32 Jan 1970 00:00:00 GMT")
            ParserResult.match(result)({
                valid: d => expect(d.result).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })
    })


    describe("#matches", () => {
        const parser = Parsers.matches(/^\d{2,3}$/)

        it("should return a valid result when pattern matches regex", () => {
            const result = parser.parse("123")
            ParserResult.match(result)({
                valid: d => expect(d.result).toEqual("123"),
                invalid: e => expect(e).toBeFalsy()
            })
        })
        it("should return an invalid result when pattern does not match regex", () => {
            const result = parser.parse("12345a")
            ParserResult.match(result)({
                valid: d => expect(d).toBeFalsy(),
                invalid: e => expect(e).toBeTruthy()
            })
        })
    })

    describe("#for", () => {

        it("should return a valid parsed object", () => {
            
            const personParser = Parsers.for({
                name: Parsers.string,
                age: Parsers.number,
                isMale: Parsers.bool.or(Parsers.parseBool).optional(),
                occupation: Parsers.for({
                    title: Parsers.string,
                    startDate: Parsers.string.then(Parsers.parseDate)
                })
            })

            const result = personParser.parse({
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
        })
    })
})
import { Parser, Parsers, ParserResult } from './parsers'

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
    describe("#for", () => {
        
        it("should return a valid parsed object", () => {
            const parser = Parsers.for({
                name: Parsers.string,
                age: Parsers.number,
                isMale: Parsers.bool.optional(false),
                occupation: Parsers.for({
                    title: Parsers.string,
                    startDate: Parsers.number
                })
            })
            const a = parser.parse({
                name: "Jolene",
                age: 30,
                occupation: {
                    title: "Devops Manager",
                    startDate: 180000000000
                }
            })
            ParserResult.match(a)({
                valid: a => expect(a.result).toEqual({
                    name: "Jolene",
                    age: 30,
                    occupation: {
                        title: "Devops Manager",
                        startDate: 180000000000
                    }
                }),
                invalid: e => expect(e).toBeFalsy()
            })
        })

    })

})
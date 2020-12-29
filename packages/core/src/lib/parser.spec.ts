import { Parser, Parsers, ParserResult } from './parsers'

describe("Parser", () => {
    it("should return OK for a valid input", () => {
        const parser = Parser.for(a => ParserResult.valid(String(a)))
        const a = parser.parse("a")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual("a"),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should return invalid for undefined with a required parser", () => {
        const parser = Parsers.string
        const a = parser.parse(undefined)
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })

    it("should return valid for undefined with a optional parser", () => {
        const parser = Parsers.string.optional(true)
        const a = parser.parse(undefined)
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeUndefined(),
            invalid: e => expect(e).toBeFalsy()
        })
    })
    it("should return valid for defined value with a optional parser", () => {
        const parser = Parsers.string.optional(false)
        const a = parser.parse("a")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual("a"),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should return invalid for undefined with a non-optional parser", () => {
        const parser = Parsers.string.optional(false)
        const a = parser.parse(undefined)
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })

    it("should map a valid result to another result", () => {
        const parser = Parser.for(a => ParserResult.valid(String(a))).map(i => parseInt(i))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual(1),
            invalid: e => expect(e).toBeFalsy()
        })
    })
    it("should not map an invalid result to a new result", () => {
        const result = ParserResult.invalid<string>({head: {reason: "Error", originalValue: undefined}, tail: []})
        const mappedResult = result.map(a => "Hello") as ParserResult<string>
        ParserResult.match(mappedResult)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors.head.reason).toEqual("Error")
        })
    })
    it("should return a single valid result given the product of two valid result", () => {
        const resultPair = ParserResult.valid("a").product(ParserResult.valid("b")) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toEqual(["a", "b"]),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should return an invalid result given the product of one valid and one invalid result", () => {
        const resultPair = ParserResult.valid("a").product(ParserResult.invalid({head: {reason: "Error", originalValue: undefined}, tail:[]})) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })
    it("should return an invalid result given the product of two invalid results", () => {
        const resultPair = ParserResult.invalid({head: {reason: "Error 1", originalValue: undefined}, tail:[]}).product(ParserResult.invalid({head: {reason: "Error 2", originalValue: undefined}, tail:[]})) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => {
                expect(e).toBeTruthy()
                expect(e.errors.head.reason).toEqual("Error 1")
                expect(e.errors.tail[0].reason).toEqual("Error 2")
            }
        })
    })

    it("should return an invalid result given the product of one invalid and one valid result", () => {
        const resultPair = ParserResult.invalid({head: {reason: "Error", originalValue: undefined}, tail:[]}).product(ParserResult.valid("a")) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })

    it("should subflatMap to another result", () => {
        const parser = Parser.for(a => ParserResult.valid(String(a))).subflatMap(i => ParserResult.try(() => parseInt(i)))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual(1),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should subflatMap chaining errors", () => {
        const parser = Parser.for(a => ParserResult.valid(String(a))).subflatMap(i => ParserResult.invalid({head: {reason:"Error 1", originalValue: undefined}, tail: []}))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors.head.reason).toEqual("Error 1")
        })
    })
    it("should subflatMap chaining earlier errors", () => {
        const parser = Parser.for<string>(a => ParserResult.invalid({head: {reason:"Error 1", originalValue: undefined}, tail: []})).subflatMap(i => ParserResult.try(() => parseInt(i)))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors.head.reason).toEqual("Error 1")
        })
    })
    it("should subflatMap passing errors to result", () => {
        const parser = Parser.for(a => ParserResult.valid(String(a)))
            .subflatMap(i => ParserResult.try(() => { throw new Error("Boom!") }))
        const a = parser.parse("a")
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors.head).toEqual("Boom!")
        })
    })

    it("should compose parsers", () => {
        const stringParser = Parser.for(a => ParserResult.valid(String(a)))
        const intParser = Parser.for((a: string) => ParserResult.try(() => parseInt(a)))
        const composed = stringParser.then(intParser)
        const one = composed.parse("1")
        ParserResult.match(one)({
            valid: a => expect(a.result).toEqual(1),
            invalid: e => expect(e).toBeFalsy()
        })
    })
    it("should compose parsers passing initial errors to result", () => {
        const stringParser = Parser.for(a => ParserResult.invalid({head: {reason: "Error 1", originalValue: undefined}, tail:[]}))
        const intParser = Parser.for((a: string) => ParserResult.try(() => parseInt(a)))
        const composed = stringParser.then(intParser)
        const one = composed.parse("1")
        ParserResult.match(one)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors.head.reason).toEqual("Error 1")
        })
    })

    it("should build a Union type of parsers", () => {
        const stringOrNumberParser = Parsers.string.or(Parsers.number)
        const oneString = stringOrNumberParser.parse("1")
        ParserResult.match(oneString)({
            valid: a => expect(a.result).toEqual("1"),
            invalid: e => expect(e).toBeFalsy()
        })
        const one = stringOrNumberParser.parse(1)
        ParserResult.match(one)({
            valid: a => expect(a.result).toEqual(1),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should return an invalid result for union parser that does not satisfy union constraint", () => {
        const stringOrNumberParser = Parsers.string.or(Parsers.number)
        const bool = stringOrNumberParser.parse(false)
        ParserResult.match(bool)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })
    
})
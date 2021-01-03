import { cons, tail } from './non-empty-array'
import { Parsers, ParserResult } from './parsers'

describe("Parser", () => {
    it("should return OK for a valid input", () => {
        const parser = Parsers.from(a => ParserResult.valid(String(a)))
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
        const parser = Parsers.string.optional()
        const a = parser.parse(undefined)
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeUndefined(),
            invalid: e => expect(e).toBeFalsy()
        })
    })
    it("should return valid for defined value with a optional parser", () => {
        const parser = Parsers.string.required()
        const a = parser.parse("a")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual("a"),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should return invalid for undefined with a non-optional parser", () => {
        const parser = Parsers.string.required()
        const a = parser.parse(undefined)
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })

    it("should map a valid result to another result", () => {
        const parser = Parsers.from(a => ParserResult.valid(String(a))).map(i => parseInt(i))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual(1),
            invalid: e => expect(e).toBeFalsy()
        })
    })
    it("should not map an invalid result to a new result", () => {
        const result = ParserResult.invalid<string>(cons({reason: "Error", originalValue: undefined}))
        const mappedResult = ParserResult.map(result)(a => "Hello") as ParserResult<string>
        ParserResult.match(mappedResult)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors[0].reason).toEqual("Error")
        })
    })
    it("should return a single valid result given the product of two valid result", () => {
        const resultPair = ParserResult.product(ParserResult.valid("a"))(ParserResult.valid("b")) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toEqual(["a", "b"]),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should return an invalid result given the product of one valid and one invalid result", () => {
        const resultPair = ParserResult.product(ParserResult.valid("a"))(ParserResult.invalid(cons({reason: "Error", originalValue: undefined}))) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })
    it("should return an invalid result given the product of two invalid results", () => {
        const resultPair = ParserResult.product(ParserResult.invalid(cons({reason: "Error 1", originalValue: undefined})))(ParserResult.invalid(cons({reason: "Error 2", originalValue: undefined}))) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => {
                expect(e).toBeTruthy()
                expect(e.errors[0].reason).toEqual("Error 1")
                expect(tail(e.errors)[0].reason).toEqual("Error 2")
            }
        })
    })

    it("should return an invalid result given the product of one invalid and one valid result", () => {
        const resultPair = ParserResult.product(ParserResult.invalid(cons({reason: "Error", originalValue: undefined})))(ParserResult.valid("a")) as ParserResult<[string, string]>
 
        ParserResult.match(resultPair)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e).toBeTruthy()
        })
    })

    it("should subflatMap to another result", () => {
        const parser = Parsers.from(a => ParserResult.valid(String(a))).subflatMap(i => ParserResult.try(() => parseInt(i)))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual(1),
            invalid: e => expect(e).toBeFalsy()
        })
    })

    it("should subflatMap returning subsequent errors", () => {
        const parser = Parsers.from(a => ParserResult.valid(String(a))).subflatMap(i => ParserResult.invalid(cons({reason: "Error 1", originalValue: undefined})))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors[0].reason).toEqual("Error 1")
        })
    })
    it("should subflatMap returning initial errors", () => {
        const parser = Parsers.from(a => ParserResult.invalid(cons({reason: "Error 1", originalValue: undefined}))).subflatMap(i => ParserResult.valid(1))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors[0].reason).toEqual("Error 1")
        })
    })

    it("should flatMap one valid result to another result", () => {
        const parser = Parsers.from(a => ParserResult.valid(String(a))).flatMap(i => Parsers.lit(3))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toEqual(3),
            invalid: e => expect(e).toBeFalsy()
        })
    })
    it("should flatMap returning earlier errors", () => {
        const parser = Parsers.failure({reason: "Error", originalValue: undefined}).flatMap(i => Parsers.lit(1))
        const a = parser.parse("1")
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors[0].reason).toEqual("Error")
        })
    })
    it("should subflatMap passing errors to result", () => {
        const parser = Parsers.from(a => ParserResult.valid(String(a)))
            .subflatMap(i => ParserResult.try(() => { throw new Error("Boom!") }))
        const a = parser.parse("a")
        ParserResult.match(a)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors[0].reason).toEqual("Boom!")
        })
    })

    it("should compose parsers", () => {
        const stringParser = Parsers.from(a => ParserResult.valid(String(a)))
        const intParser = Parsers.from((a: string) => ParserResult.try(() => parseInt(a)))
        const composed = stringParser.then(intParser)
        const one = composed.parse("1")
        ParserResult.match(one)({
            valid: a => expect(a.result).toEqual(1),
            invalid: e => expect(e).toBeFalsy()
        })
    })
    it("should compose parsers passing initial errors to result", () => {
        const stringParser = Parsers.from<string>(a => ParserResult.invalid(cons({reason: "Error 1", originalValue: undefined})))
        const intParser = Parsers.from((a: string) => ParserResult.try(() => parseInt(a)))
        const composed = stringParser.then(intParser)
        const one = composed.parse("1")
        ParserResult.match(one)({
            valid: a => expect(a.result).toBeFalsy(),
            invalid: e => expect(e.errors[0].reason).toEqual("Error 1")
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
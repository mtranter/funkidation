import { Eq } from 'fp-ts/lib/Eq';
import { ParserResult } from 'funkidation-core';
import { NonEmptyArray } from 'funkidation-core'
import { Applicative } from './parser-result';
import * as laws from 'fp-ts-laws'
import * as fc from 'fast-check'

const getParserResult = <A>(arb: fc.Arbitrary<A>): fc.Arbitrary<ParserResult<A>> =>
    fc.oneof(arb.map(ParserResult.valid), fc.constant(ParserResult.invalid<A>(NonEmptyArray.cons({ reason: "Test", originalValue: undefined }))))

export const parserResultEq = <A>(a: Eq<A>): Eq<ParserResult<A>> => ({
    equals: (pa, pb) => ParserResult.match(ParserResult.product(pa)(pb))({
        valid: r => a.equals(r.result[0], r.result[1]),
        invalid: r => NonEmptyArray.tail(r.errors).every(e => e.reason === r.errors[0].reason)
    })
})

describe('Parser result applicative instance', () => {
    it('should test Applicative laws', () => {
        laws.applicative(Applicative)(getParserResult, parserResultEq)
    })
})
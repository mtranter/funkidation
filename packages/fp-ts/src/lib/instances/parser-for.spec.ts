import { ParserFor, Parsers } from 'funkidation-core';
import { parserResultEq } from './parser-result.spec'
import { Monad } from './parser-for';
import * as laws from 'fp-ts-laws'
import * as fc from 'fast-check'
import { Eq } from 'fp-ts/lib/Eq';

const getParserFor = <A>(arb: fc.Arbitrary<A>): fc.Arbitrary<ParserFor<A>> =>
    fc.oneof(arb.map(Parsers.lit), fc.constant(Parsers.failure<A>({ reason: "Test", originalValue: undefined })))

const getEq = <A>(a: Eq<A>): Eq<ParserFor<A>> => ({
    equals: (pa, pb) => {
        const ra = pa.parse({})
        const rb = pb.parse({})
        return parserResultEq(a).equals(ra, rb)
    }
})
describe('Parser result applicative instance', () => {

    it('should test Applicative laws', () => {
        laws.applicative(Monad)(getParserFor, getEq)
    })
    
    it('should test Monad laws', () => {
        laws.monad(Monad)(getEq)
    })
})
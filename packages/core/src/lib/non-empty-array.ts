

export type NonEmptyArray<A> = ReadonlyArray<A> & {
    readonly 0: A
}

export const head = <A>(a: NonEmptyArray<A>): A => a[0]
export const tail = <A>(a: NonEmptyArray<A>): readonly A[] => a.slice(1)
export const cons = <A>(head: A, tail: readonly A[] = []): NonEmptyArray<A> => [head, ...tail]
export const concat = <A>(a: NonEmptyArray<A>, b: NonEmptyArray<A>): NonEmptyArray<A> => cons(head(a), tail(a).concat(b))
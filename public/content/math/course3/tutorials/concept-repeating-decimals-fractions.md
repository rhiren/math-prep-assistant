# Repeating Decimals as Fractions

## The big idea

A decimal that repeats a fixed digit or block of digits forever is rational.
That means it can be written exactly as a fraction of two integers.

For example:

- `0.333... = 1/3`
- `0.272727... = 3/11`
- `0.999... = 1`

The dots matter. `0.27` is a terminating decimal, but `0.272727...` repeats
the block `27` forever.

## Why the algebra method works

Suppose:

`x = 0.777...`

The repeating block has one digit, so multiply by 10:

`10x = 7.777...`

Now subtract the original equation:

`10x - x = 7.777... - 0.777...`

The repeating tails cancel:

`9x = 7`

Therefore:

`x = 7/9`

Multiplying by a power of ten lines up identical repeating tails. Subtraction
removes those tails and leaves an ordinary equation.

## One repeating digit

For a decimal such as `0.444...`:

1. Let `x = 0.444...`.
2. Multiply by 10: `10x = 4.444...`.
3. Subtract: `9x = 4`.
4. Divide: `x = 4/9`.

This gives a useful pattern:

`0.ddd... = d/9`

Examples:

- `0.222... = 2/9`
- `0.555... = 5/9`
- `0.888... = 8/9`

Always simplify the fraction when possible. For example,
`0.666... = 6/9 = 2/3`.

## A repeating block

If two digits repeat, multiply by `100`.

Let:

`x = 0.121212...`

Then:

`100x = 12.121212...`

Subtract:

`99x = 12`

So:

`x = 12/99 = 4/33`

For a three-digit block, multiply by `1000`.

`0.123123... = 123/999 = 41/333`

The denominator before simplifying is made of as many 9s as there are
repeating digits:

- one repeating digit → denominator `9`
- two repeating digits → denominator `99`
- three repeating digits → denominator `999`

## When some digits do not repeat

Consider `0.2333...`. The digit `2` does not repeat; only `3` repeats.

Let:

`x = 0.2333...`

First move past the nonrepeating digit:

`10x = 2.333...`

Then line up one full repeating block:

`100x = 23.333...`

Subtract:

`100x - 10x = 23.333... - 2.333...`

`90x = 21`

`x = 21/90 = 7/30`

The denominator before simplifying has:

- one `9` for each repeating digit
- one `0` for each nonrepeating decimal digit

So `0.2333...` can also be found by:

`(23 - 2) / 90 = 21/90 = 7/30`

## Repeating decimals greater than 1

Convert the decimal part and then combine it with the whole number.

`2.333... = 2 + 1/3 = 7/3`

For `1.272727...`:

`1.272727... = 1 + 27/99 = 1 + 3/11 = 14/11`

## Negative repeating decimals

Convert the positive value, then keep the negative sign.

`-0.666... = -(2/3) = -2/3`

## Why `0.999... = 1`

Let `x = 0.999...`.

`10x = 9.999...`

Subtract:

`9x = 9`

So `x = 1`.

There is no gap between `0.999...` and `1`. They are two representations of
the same number.

## Check your fraction

Divide the numerator by the denominator:

`4 ÷ 33 = 0.121212...`

This is a useful way to verify that the correct block repeats.

## Common mistakes

- Multiplying by `10` when a two-digit block repeats. Use `100` so the full
  block lines up.
- Treating the dots as optional. `0.6` and `0.666...` are different numbers.
- Writing `27/100` for `0.272727...`. A repeating two-digit block starts with
  denominator `99`, not `100`.
- Forgetting to subtract the correct equations when there is a nonrepeating
  prefix.
- Stopping before simplifying the fraction.
- Thinking `0.999...` is only close to `1`. It equals `1` exactly.

## Quick practice

1. Convert `0.555...` to a fraction.
2. Convert `0.181818...` to a fraction.
3. Convert `0.1666...` to a fraction.
4. Convert `1.444...` to a fraction.
5. Explain why every repeating decimal is rational.

### Answers

1. `5/9`
2. `18/99 = 2/11`
3. `(16 - 1)/90 = 15/90 = 1/6`
4. `1 + 4/9 = 13/9`
5. A repeating decimal can be converted to a ratio of integers by aligning and
   subtracting its repeating tails.

import { describe, it, expect } from 'vitest';
import { HandEvaluator } from '../HandEvaluator.js';
import { stringToCard } from '../Card.js';
import { HandRankCategory } from '../types.js';

describe('HandEvaluator', () => {
  const cards = (strArr: string[]) => strArr.map(stringToCard);

  it('correctly identifies a Royal Flush', () => {
    const hand = cards(['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2c', '3d']);
    const evalResult = HandEvaluator.evaluate(hand);
    expect(evalResult.category).toBe(HandRankCategory.ROYAL_FLUSH);
    expect(evalResult.description).toBe('Royal Flush');
  });

  it('correctly identifies a Straight Flush', () => {
    const hand = cards(['9s', '8s', '7s', '6s', '5s', 'Kd', '2c']);
    const evalResult = HandEvaluator.evaluate(hand);
    expect(evalResult.category).toBe(HandRankCategory.STRAIGHT_FLUSH);
    expect(evalResult.tiebreakers[0]).toBe(9);
  });

  it('correctly identifies Four of a Kind', () => {
    const hand = cards(['Ac', 'As', 'Ah', 'Ad', 'Ks', '9h', '2d']);
    const evalResult = HandEvaluator.evaluate(hand);
    expect(evalResult.category).toBe(HandRankCategory.FOUR_OF_A_KIND);
    expect(evalResult.tiebreakers[0]).toBe(14); // Aces
    expect(evalResult.tiebreakers[1]).toBe(13); // King kicker
  });

  it('correctly identifies Full House', () => {
    const hand = cards(['Ts', 'Th', 'Td', '8c', '8d', '2s', '3h']);
    const evalResult = HandEvaluator.evaluate(hand);
    expect(evalResult.category).toBe(HandRankCategory.FULL_HOUSE);
    expect(evalResult.tiebreakers[0]).toBe(10);
    expect(evalResult.tiebreakers[1]).toBe(8);
  });

  it('correctly identifies a Flush', () => {
    const hand = cards(['Kd', 'Jd', '9d', '6d', '3d', 'As', 'Th']);
    const evalResult = HandEvaluator.evaluate(hand);
    expect(evalResult.category).toBe(HandRankCategory.FLUSH);
    expect(evalResult.tiebreakers[0]).toBe(13);
  });

  it('correctly identifies a broadway Straight', () => {
    const hand = cards(['Ac', 'Kd', 'Qh', 'Js', 'Tc', '4d', '2h']);
    const evalResult = HandEvaluator.evaluate(hand);
    expect(evalResult.category).toBe(HandRankCategory.STRAIGHT);
    expect(evalResult.tiebreakers[0]).toBe(14);
  });

  it('correctly identifies an Ace-low Wheel Straight (A-2-3-4-5)', () => {
    const hand = cards(['Ac', '5d', '4h', '3s', '2c', 'Kh', 'Jd']);
    const evalResult = HandEvaluator.evaluate(hand);
    expect(evalResult.category).toBe(HandRankCategory.STRAIGHT);
    expect(evalResult.tiebreakers[0]).toBe(5); // 5 is high card in wheel
  });

  it('correctly breaks tie with kickers on One Pair', () => {
    const hand1 = cards(['As', 'Ah', 'Kd', 'Qc', '9s', '2h', '3d']); // Pair Aces, K Q 9
    const hand2 = cards(['Ac', 'Ad', 'Kd', 'Jc', '9s', '2h', '3d']); // Pair Aces, K J 9

    const eval1 = HandEvaluator.evaluate(hand1);
    const eval2 = HandEvaluator.evaluate(hand2);

    expect(eval1.category).toBe(HandRankCategory.ONE_PAIR);
    expect(eval2.category).toBe(HandRankCategory.ONE_PAIR);
    expect(HandEvaluator.compareEvaluations(eval1, eval2)).toBeGreaterThan(0);
  });

  it('correctly breaks tie on Two Pair', () => {
    const hand1 = cards(['Ks', 'Kh', 'Qs', 'Qh', 'Jc', '2s', '3d']); // Kings & Queens, Jack
    const hand2 = cards(['Ks', 'Kh', 'Ts', 'Th', 'Ac', '2s', '3d']); // Kings & Tens, Ace

    const eval1 = HandEvaluator.evaluate(hand1);
    const eval2 = HandEvaluator.evaluate(hand2);

    // K-Q beats K-T even though K-T has Ace kicker
    expect(HandEvaluator.compareEvaluations(eval1, eval2)).toBeGreaterThan(0);
  });

  it('correctly identifies exact tie', () => {
    const hand1 = cards(['As', 'Kd', 'Qc', 'Jh', '9s', '2d', '3c']);
    const hand2 = cards(['Ah', 'Kc', 'Qd', 'Js', '9d', '4h', '5c']);

    const eval1 = HandEvaluator.evaluate(hand1);
    const eval2 = HandEvaluator.evaluate(hand2);

    expect(HandEvaluator.compareEvaluations(eval1, eval2)).toBe(0);
  });
});


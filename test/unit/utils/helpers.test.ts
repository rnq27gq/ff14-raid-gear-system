import { describe, it, expect } from 'vitest';
import { getPositionRoleClass, getDisplayTeamName } from '../../../src/utils/helpers';

describe('helpers', () => {
  describe('getPositionRoleClass', () => {
    it('MTはtankを返す', () => {
      expect(getPositionRoleClass('MT')).toBe('tank');
    });

    it('STはtankを返す', () => {
      expect(getPositionRoleClass('ST')).toBe('tank');
    });

    it('H1はhealerを返す', () => {
      expect(getPositionRoleClass('H1')).toBe('healer');
    });

    it('H2はhealerを返す', () => {
      expect(getPositionRoleClass('H2')).toBe('healer');
    });

    it('D1はdpsを返す', () => {
      expect(getPositionRoleClass('D1')).toBe('dps');
    });

    it('D2はdpsを返す', () => {
      expect(getPositionRoleClass('D2')).toBe('dps');
    });

    it('D3はdpsを返す', () => {
      expect(getPositionRoleClass('D3')).toBe('dps');
    });

    it('D4はdpsを返す', () => {
      expect(getPositionRoleClass('D4')).toBe('dps');
    });

    it('無効な値は空文字を返す', () => {
      expect(getPositionRoleClass('INVALID' as any)).toBe('');
    });
  });

  describe('getDisplayTeamName', () => {
    it('ハイフンがある場合は前半部分を返す', () => {
      expect(getDisplayTeamName('TeamName-12345')).toBe('TeamName');
    });

    it('ハイフンがない場合は全体を返す', () => {
      expect(getDisplayTeamName('TeamName')).toBe('TeamName');
    });

    it('空文字の場合は空文字を返す', () => {
      expect(getDisplayTeamName('')).toBe('');
    });

    it('nullの場合は空文字を返す', () => {
      expect(getDisplayTeamName(null as any)).toBe('');
    });

    it('undefinedの場合は空文字を返す', () => {
      expect(getDisplayTeamName(undefined as any)).toBe('');
    });

    it('複数のハイフンがある場合は最初のハイフンまでを返す', () => {
      expect(getDisplayTeamName('Team-Name-12345')).toBe('Team');
    });
  });
});

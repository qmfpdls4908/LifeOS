/**
 * 부채 기본 설정 (시드 데이터)
 * - 최초 실행 시에만 사용되며, 이후에는 localStorage('lifeos_debts')에서 관리됨
 * - 사용자가 FinanceView에서 직접 부채 항목을 추가/수정 가능
 */
export const DEFAULT_DEBTS = [
  { creditor: '학자금 대출', amount: 2000000 },
  { creditor: '은행 대출', amount: 3000000 }
];

export const DEFAULT_TOTAL_DEBT = DEFAULT_DEBTS.reduce((sum, item) => sum + item.amount, 0);

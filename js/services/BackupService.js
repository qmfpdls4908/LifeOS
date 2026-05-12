/**
 * LifeOS 데이터 백업/복원 서비스
 * - 모든 localStorage 키를 JSON 파일로 내보내기
 * - JSON 파일에서 데이터 읽어 복원하기
 * - 데이터 읽기만 수행, 쓰기는 사용자 확인 후에만 실행
 */
export class BackupService {
  // 백업 대상 키 목록 (LifeOS 관련 모든 키)
  #ALL_KEYS = [
    'transactions',
    'routines_v4',
    'routines_v3',
    'lifeos_destinations',
    'habits_v2',
    'habits',
    'reviews',
    'calendar_events',
    'lifeos_profile',
    'lifeos_debts',
    'opencode_go_api_key'
  ];

  /**
   * 모든 localStorage 데이터를 JSON 객체로 수집
   * @returns {{ data: Object, keyCount: number }}
   */
  #collectAllData() {
    const backup = {};
    for (const key of this.#ALL_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          backup[key] = JSON.parse(raw);
        } catch (e) {
          // opencode_go_api_key 같은 raw string은 parse 실패 → 원본 문자열 저장
          backup[key] = raw;
        }
      }
    }
    return { data: backup, keyCount: Object.keys(backup).length };
  }

  /**
   * 모든 데이터를 JSON 파일로 다운로드
   * @returns {{ success: boolean, message: string }}
   */
  exportData() {
    const { data, keyCount } = this.#collectAllData();

    if (keyCount === 0) {
      return { success: false, message: '백업할 데이터가 없습니다.' };
    }

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = 'LifeOS_backup_' + timestamp + '.json';

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, message: keyCount + '개 항목 백업 완료! (' + fileName + ')' };
  }

  /**
   * JSON 파일을 읽어 localStorage에 복원
   * @param {File} file - 사용자가 선택한 JSON 파일
   * @returns {Promise<{success: boolean, message: string}>}
   */
  restoreData(file) {
    return new Promise((resolve) => {
      if (!file || !file.name.endsWith('.json')) {
        resolve({ success: false, message: 'JSON 파일만 선택할 수 있습니다.' });
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const keys = Object.keys(data);

          if (keys.length === 0) {
            resolve({ success: false, message: '빈 파일입니다.' });
            return;
          }

          let restoredCount = 0;
          for (const key of keys) {
            const value = data[key];
            try {
              if (typeof value === 'string') {
                localStorage.setItem(key, value);
              } else {
                localStorage.setItem(key, JSON.stringify(value));
              }
              restoredCount++;
            } catch (writeErr) {
              console.warn('[BackupService] 키 쓰기 실패: ' + key, writeErr);
            }
          }

          resolve({
            success: restoredCount > 0,
            message: restoredCount + '/' + keys.length + '개 항목 복원 완료! 페이지를 새로고침합니다...'
          });
        } catch (err) {
          resolve({ success: false, message: '올바른 LifeOS 백업 파일이 아닙니다.' });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, message: '파일을 읽을 수 없습니다.' });
      };

      reader.readAsText(file);
    });
  }

  /**
   * 모든 localStorage 데이터를 삭제 (초기화)
   * @returns {{ success: boolean, message: string }}
   */
  clearAllData() {
    const { keyCount } = this.#collectAllData();

    if (keyCount === 0) {
      return { success: false, message: '삭제할 데이터가 없습니다.' };
    }

    for (const key of this.#ALL_KEYS) {
      localStorage.removeItem(key);
    }

    return { success: true, message: keyCount + '개 항목을 삭제했습니다. 페이지를 새로고침합니다...' };
  }
}

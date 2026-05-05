export const DESTINATIONS = [
  {
    id: 'ulsan', name: '울산',
    routes: [
      { method: 'KTX',    from: '부산역', to: '울산역', duration: '약 20분', cost: '₩8,400' },
      { method: '무궁화호',  from: '부전역', to: '태화강역', duration: '약 1시간 10분', cost: '₩4,100' },
      { method: '시외버스', from: '부산종합터미널', to: '울산시외터미널', duration: '약 1시간', cost: '₩5,500' },
    ],
  },
  {
    id: 'gimhae', name: '김해',
    routes: [
      { method: '경전철+버스', from: '사상역', to: '김해', duration: '약 40분', cost: '약 ₩1,500' },
      { method: '시외버스',       from: '부산서부터미널', to: '김해터미널', duration: '약 30분', cost: '약 ₩2,500' },
    ],
  },
  {
    id: 'company', name: '회사',
    routes: [
      { method: '대중교통', from: '자택', to: '회사', duration: '미정', cost: '미정 (이사 후 업데이트)' },
    ],
  },
  {
    id: 'kyungnam_univ', name: '경남대학교',
    routes: [
      { 
        method: '통학버스 (김해방면)', 
        from: '김해시청', 
        to: '학교 (경남대)', 
        duration: '1시간 5분', 
        cost: '₩1,700',
        time: '07:25 탑승 ➔ 08:30 도착',
        details: '탑승 장소: 지도 참조.',
        images: [
          './assets/gimhae_map.png', // 사용자가 저장할 이미지 경로 (탑승 장소)
          './assets/gimhae_timetable.png' // 사용자가 저장할 이미지 경로 (시간표)
        ]
      },
    ],
  },
];

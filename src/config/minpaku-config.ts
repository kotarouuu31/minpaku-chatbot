// ととのいヴィラ PAL の基本情報設定
export const minpakuConfig = {
  propertyName: 'ととのいヴィラ PAL',
  address: '静岡県伊豆の国市奈古谷字石橋2206番133 エメラルドタウン207-1-77',
  propertyType: '貸別荘・バーベキュー施設',
  checkinTime: '15:00',
  checkoutTime: '11:00',
  wifiPassword: 'pal2024',
  emergencyContact: '055-000-0000',
  description: '静岡県伊豆の国市にある、自然に囲まれたプライベート感あふれる貸別荘です。バーベキューや地元の新鮮な食材をお楽しみいただけます。',
  
  // アクセス情報
  access: {
    naviSetting: '芙蓉公園（伊豆の国市奈古谷）',
    viaPoint: '南箱根・グランビュー（〒410-2132 静岡県伊豆の国市奈古谷2219-60）',
    notes: 'Googleマップでは細い山道に案内される場合があるため、南箱根・グランビューを経由地として設定することをおすすめします。'
  },

  // 周辺施設情報
  nearbyShops: {
    supermarkets: [
      {
        name: 'スーパーあおき 函南店',
        distance: '車で約15分',
        address: '静岡県田方郡函南町間宮833-1',
        phone: '0120-169-345',
        hours: '9:00〜21:00',
        description: '地元食材が揃う人気スーパー。精肉・野菜・お惣菜も充実'
      },
      {
        name: 'マックスバリュ 函南店',
        distance: '車で約15分', 
        address: '静岡県田方郡函南町間宮字寺前台341',
        phone: '055-978-5811',
        hours: '7:00〜23:30',
        description: '早朝から深夜まで営業。日用品や飲み物も揃って便利'
      },
      {
        name: 'エース生鮮館 畑毛店',
        distance: '車で約10分',
        address: '静岡県田方郡函南町柏谷1310-4', 
        phone: '055-970-1031',
        description: 'ローカル感あふれる生鮮市場。野菜や果物が新鮮＆安い'
      }
    ],
    specialty: [
      {
        name: '杉山鮮魚店',
        distance: '車で約10分',
        address: '静岡県田方郡函南町平井1264-282',
        phone: '055-979-2690', 
        hours: '10:30～18:30（定休：月曜）',
        description: '沼津港直送の新鮮な魚。鯵の干物3枚380円、伊勢海老・鮑の予約も可能（1kgあたり8,000〜10,000円）',
        speciality: '鯵の干物、伊勢海老、鮑'
      },
      {
        name: '良酒倉庫 宮内酒店',
        distance: '車で約10分',
        address: '静岡県伊豆の国市守木767-6',
        description: '伊豆の地酒やクラフトビールが豊富。BBQのお供にぴったり'
      }
    ]
  },

  // BBQ情報
  bbqInfo: {
    preparation: 'BBQの準備は到着前にお済ませください。別荘地内にはお店がほとんどありません。',
    shoppingArea: '車で15分圏内に必要な食材・用品が揃うお店があります。',
    recommendations: [
      '調味料や炭は事前購入推奨',
      '杉山鮮魚店の鯵の干物がおすすめ',
      '伊勢海老・鮑は事前予約がおすすめ',
      '地酒・クラフトビールで乾杯'
    ]
  }
};

// 環境変数とのフォールバック（環境変数優先、なければ設定ファイル使用）
export const getMinpakuConfig = () => ({
  ...minpakuConfig,
  propertyName: process.env.MINPAKU_PROPERTY_NAME || minpakuConfig.propertyName,
  address: process.env.MINPAKU_ADDRESS || minpakuConfig.address,
  checkinTime: process.env.MINPAKU_CHECKIN_TIME || minpakuConfig.checkinTime,
  checkoutTime: process.env.MINPAKU_CHECKOUT_TIME || minpakuConfig.checkoutTime,
  wifiPassword: process.env.MINPAKU_WIFI_PASSWORD || minpakuConfig.wifiPassword,
  emergencyContact: process.env.MINPAKU_EMERGENCY_CONTACT || minpakuConfig.emergencyContact
});

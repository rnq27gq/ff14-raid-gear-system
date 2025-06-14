-- データタイプ制約を緩和して、新しいタイプを追加

-- 既存の制約を削除
ALTER TABLE raid_data DROP CONSTRAINT IF EXISTS raid_data_data_type_check;

-- 新しい制約を追加（より多くのデータタイプを許可）
ALTER TABLE raid_data ADD CONSTRAINT raid_data_data_type_check 
CHECK (data_type IN ('players', 'allocations', 'settings', 'equipmentData', 'raidTiers', 'priorities', 'weapons'));

-- 既存のデータタイプも確認
\d raid_data;
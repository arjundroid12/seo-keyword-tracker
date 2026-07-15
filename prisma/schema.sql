-- SEO Keyword Tracker — Turso/libSQL schema
-- Run via: npm run db:init  (uses Turso REST API)
-- Or paste directly into Turso shell.

CREATE TABLE IF NOT EXISTS Restaurant (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  location   TEXT NOT NULL,
  website    TEXT,
  cuisine    TEXT,
  createdAt  TEXT NOT NULL,
  updatedAt  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Keyword (
  id              TEXT PRIMARY KEY,
  restaurantId    TEXT NOT NULL,
  keyword         TEXT NOT NULL,
  searchVolume    INTEGER NOT NULL DEFAULT 0,
  difficulty      INTEGER NOT NULL DEFAULT 0,
  organicRanking  INTEGER,
  gbpRanking      INTEGER,
  createdAt       TEXT NOT NULL,
  updatedAt       TEXT NOT NULL,
  FOREIGN KEY (restaurantId) REFERENCES Restaurant(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_keyword_restaurant ON Keyword(restaurantId);
CREATE INDEX IF NOT EXISTS idx_keyword_volume ON Keyword(searchVolume DESC);

CREATE TABLE IF NOT EXISTS RankingHistory (
  id              TEXT PRIMARY KEY,
  keywordId       TEXT NOT NULL,
  month           TEXT NOT NULL,
  organicRanking  INTEGER,
  gbpRanking      INTEGER,
  createdAt       TEXT NOT NULL,
  FOREIGN KEY (keywordId) REFERENCES Keyword(id) ON DELETE CASCADE,
  UNIQUE (keywordId, month)
);

CREATE INDEX IF NOT EXISTS idx_ranking_keyword ON RankingHistory(keywordId);
CREATE INDEX IF NOT EXISTS idx_ranking_month ON RankingHistory(month);

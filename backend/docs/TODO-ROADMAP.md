# 🎯 World Cup 2026 - TODO Roadmap

## ✅ הושלמו (Completed)

### Backend Infrastructure
- [x] **Prisma Schema** - מודלים לקבוצות, משחקים, ניבויים, ליגות
  - Team, Match, GroupStanding, ThirdPlaceRanking
  - User, League, LeagueMember, Form
  - MatchPick, AdvancePick, TopScorerPick
  
- [x] **Database Seeding** - ייבוא נתוני מונדיאל 2026
  - 48 קבוצות (12 קבוצות × 4 קבוצות)
  - 104 משחקים (48 group + 56 knockout)
  - קישור Teams ל-GroupStandings
  - קישור Team IDs למשחקי קבוצות
  
- [x] **MatchResultService** - לוגיקה אוטומטית לעדכון תוצאות
  - עדכון Match (score, winner, isFinished)
  - עדכון GroupStandings אוטומטית
  - מיון קבוצות לפי נקודות/הפרש שערים
  - דירוג 8 קבוצות שלישיות
  - הקצאת קבוצות שלישיות למשחקי R32
  - העברת מנצחים לסיבובים הבאים
  
- [x] **ThirdPlaceResolver** - לוגיקה לפתרון קבוצות שלישיות
  - פרסור team codes (1A, 2B, 3-ABCDF, W73)
  - Lookup table עם 70 combinations
  - resolveThirdPlaceAssignments()

- [x] **AdminController** - API לעדכון תוצאות משחקים
  - POST /api/admin/matches/:id/result
  - Validation עם Zod
  - Authentication (requireAdmin middleware)

---

## 🔧 תיקונים נדרשים (Critical Fixes)

### 1. TypeScript Linter Cache Issue
**Priority: HIGH**
**Status:** ⚠️ השגיאות לא משפיעות על runtime אבל מפריעות ל-DX

**שגיאות:**
- `fifaCode does not exist in type TeamWhereUniqueInput`
- `matchNumber does not exist in type MatchWhereUniqueInput`
- `groupStanding / thirdPlaceRanking does not exist`
- `team1/team2 does not exist` (AdminController)

**פתרונות אפשריים:**
1. Restart TypeScript Language Server ב-VSCode
2. מחיקת `node_modules/.prisma` ו-`npx prisma generate` מחדש
3. Rebuild TypeScript project: `npx tsc --build --clean && npx tsc`
4. בדיקה אם `@@unique` constraints נכונים ב-schema

**קבצים מושפעים:**
- `backend/prisma/seed.ts`
- `backend/src/controllers/AdminController.ts`
- `backend/src/services/MatchResultService.ts` (עובד!)

---

## 🚀 שלב 1: API Endpoints (Backend)

### 2. GroupStandings API ✅
**Priority: HIGH**  
**Status:** ✅ הושלם (27/12/2025)

**Endpoints:**
```typescript
GET /api/standings
  Query params: ?group=A&group=B (optional)
  Response: { groups: { A: [...], B: [...] }, metadata: {...} }

GET /api/standings/:groupLetter
  Response: { groupLetter: 'A', standings: [...] }

GET /api/standings/third-place/rankings
  Response: [{ rank: 1, groupLetter: 'E', team: {...}, points: 6, ... }]
```

**קבצים שנוצרו:**
- ✅ `backend/src/models/GroupStanding.ts`
- ✅ `backend/src/controllers/StandingsController.ts`
- ✅ `backend/src/routes/standings.ts`

**מתודות Model:**
- ✅ `GroupStandingModel.findByGroups(letters?: string[])`
- ✅ `GroupStandingModel.findByGroup(letter: string)`
- ✅ `GroupStandingModel.getThirdPlaceRankings()`

---

### 3. ThirdPlaceRankings API ✅
**Priority: MEDIUM**  
**Status:** ✅ הושלם - מאוחד עם Standings API

**Endpoint:**
```typescript
GET /api/standings/third-place/rankings
  Response: [{ rank: 1, groupLetter: 'E', team: {...} }]
```

---

### 4. Enhanced Matches API ✅
**Priority: HIGH**  
**Status:** ✅ הושלם (27/12/2025)

**Endpoints משופרים:**
```typescript
GET /api/matches
  Query: ?stage=GROUP&group=A&upcoming=true&limit=10
  
GET /api/matches/:id
  Single match with teams
  
GET /api/matches/stage/:stage
  Matches by stage
```

**שיפורים ל-MatchController:**
- ✅ פילטר לפי קבוצה (groupLetter)
- ✅ פילטר לפי upcoming matches
- ✅ Limit תוצאות
- ✅ מיון לפי תאריך/matchNumber
- ✅ Include related data (team1, team2, winner)

**קבצים שעודכנו:**
- ✅ `backend/src/controllers/MatchController.ts`
- ✅ `backend/src/models/Match.ts` (תוקן ל-team1/team2 במקום teamA/teamB)

---

### 5. Predictions API ✅
**Priority: HIGH**  
**Status:** ✅ הושלם (27/12/2025)

**Endpoints:**
```typescript
POST /api/predictions/matches
  Body: {
    predictions: [
      { matchId: string, predScoreA: number, predScoreB: number }
    ]
  }

POST /api/predictions/advances
  Body: {
    predictions: [
      { stage: Stage, teamId: string }
    ]
  }

POST /api/predictions/top-scorer
  Body: { playerName: string }

GET /api/predictions/my
  Response: { matchPicks: [...], advancePicks: [...], topScorerPicks: [...] }
```

**קבצים שנוצרו:**
- ✅ `backend/src/controllers/PredictionsController.ts`
- ✅ `backend/src/routes/predictions.ts`
- ✅ `backend/docs/API-ENDPOINTS.md` (תיעוד מפורט)

**תכונות:**
- ✅ Validation של matchIds ו-teamIds
- ✅ חישוב אוטומטי של Outcome
- ✅ בדיקת form locking
- ✅ Authentication עם Clerk

---

## 🎨 שלב 2: Frontend UI

### 6. Admin Dashboard
**Priority: HIGH**

**מסכים:**
1. **Matches Management**
   - טבלת משחקים עם פילטרים
   - כפתור "Update Result" לכל משחק
   
2. **Match Result Form**
   - Input לציון Team 1 / Team 2
   - כפתור Submit
   - הצגת standings מעודכנים אחרי שמירה

**Components:**
- `AdminMatchList.tsx`
- `UpdateResultModal.tsx`
- `GroupStandingsTable.tsx`

**Route:** `/admin/matches`

---

### 7. Group Standings Display
**Priority: HIGH**

**UI:**
- טבלה לכל קבוצה (12 קבוצות)
- עמודות: Pos, Team, P, W, D, L, GF, GA, GD, Pts
- עדכון בזמן אמת (polling או WebSocket)
- סימון ויזואלי למקומות עולים (1st, 2nd, 3rd)

**Component:** `GroupStandingsWidget.tsx`
**Route:** `/standings`

---

### 8. Match Predictions Form
**Priority: HIGH**

**UI בהתאם ל-Excel:**
1. **Group Stage Section**
   - טבלת משחקים לפי קבוצות
   - Input לציון Team 1 / Team 2
   - חישוב אוטומטי של W/D/L
   
2. **Knockout Stage Section**
   - ברקטים עם placeholders
   - כפתורי בחירה למנצחים

3. **Additional Predictions**
   - Top Scorer input
   - Checkboxes לקבוצות שעולות לכל שלב

**Components:**
- `PredictionForm.tsx`
- `GroupMatchesSection.tsx`
- `KnockoutBracket.tsx`
- `TopScorerPicker.tsx`

**Route:** `/my-predictions`

---

### 9. Leaderboard
**Priority: MEDIUM**

**UI:**
- טבלת שחקנים מדורגים
- עמודות: Rank, Name, Total Points, Form Status
- פילטר לפי ליגה
- קישור לצפייה בטופס של כל שחקן

**Component:** `Leaderboard.tsx`
**Route:** `/leaderboard`

---

## 💡 שלב 3: Logic & Automation

### 10. Scoring System
**Priority: HIGH**

**חוקי ניקוד (לפי Excel):**
- ניחוש תוצאה מדויקת: X נקודות
- ניחוש הפרש שערים נכון: Y נקודות
- ניחוש מנצח נכון: Z נקודות
- ניחוש קבוצה שעולה: N נקודות
- ניחוש מלך שערים: M נקודות

**Service:** `ScoringService.ts`
**פונקציות:**
```typescript
calculateMatchPoints(pick: MatchPick, match: Match): number
calculateAdvancePoints(pick: AdvancePick, actualWinners: Team[]): number
calculateTopScorerPoints(pick: TopScorerPick, actualScorer: Player): number
recalculateFormScore(formId: string): Promise<void>
```

**Model:** `ScoringRun` - מעקב אחרי חישובי ניקוד

---

### 11. Auto-Update R32 Matches
**Priority: MEDIUM**

**Logic:**
- כשכל משחקי הקבוצות מסתיימים → trigger
- עדכון team1Id/team2Id במשחקי R32
- התבססות על:
  - מקום 1 בכל קבוצה
  - מקום 2 בכל קבוצה
  - 8 קבוצות שלישיות מדורגות

**כבר קיים ב-MatchResultService!**
- `checkGroupStageComplete()`
- `updateThirdPlaceRankings()`
- `assignR32ThirdPlaceTeams()`

**TODO:** וידוא שהלוגיקה רצה בכל עדכון משחק קבוצתי

---

### 12. Real-time Updates
**Priority: LOW-MEDIUM**

**אופציות:**
1. **WebSocket (Socket.io)**
   - Server-push לעדכוני משחקים
   - עדכון standings בזמן אמת
   
2. **Server-Sent Events (SSE)**
   - חד-כיווני מספיק למקרה שלנו
   
3. **Polling**
   - Simple אבל פחות יעיל

**Events:**
- `match:updated` - תוצאת משחק התעדכנה
- `standings:updated` - טבלת קבוצה השתנתה
- `third-place:determined` - 8 הקבוצות נקבעו

**קובץ:** `backend/src/services/WebSocketService.ts`

---

## 🧪 שלב 4: Testing

### 13. Backend Tests

**Unit Tests:**
- `MatchResultService.test.ts`
  - עדכון match + standings
  - מיון קבוצות
  - חישוב נקודות
  - trigger third place rankings
  
- `ThirdPlaceResolver.test.ts`
  - parseTeamCode()
  - resolveThirdPlaceAssignments()
  - כל 70 combinations מ-JSON

- `ScoringService.test.ts`
  - חישוב נקודות לכל סוג ניבוי

**Integration Tests:**
- סימולציית מחזור מלא של group stage
- בדיקת עדכון R32 אחרי סיום קבוצות

**Framework:** Jest או Vitest

---

### 14. Frontend Tests

**Component Tests:**
- `PredictionForm.test.tsx` - שמירה ו-validation
- `GroupStandingsTable.test.tsx` - תצוגה נכונה
- `UpdateResultModal.test.tsx` - עדכון תוצאה

**E2E Tests (Playwright):**
- זרימת משתמש מלאה: הרשמה → ניבוי → צפייה בתוצאות
- זרימת Admin: עדכון תוצאה → וידוא standings

---

## 📚 שלב 5: Documentation & Polish

### 15. API Documentation
- Swagger/OpenAPI spec
- Postman collection
- דוגמאות requests/responses

### 16. User Guide
- הוראות הרשמה
- איך למלא טופס ניבויים
- הסבר על מערכת הניקוד

### 17. Deployment
- Docker setup
- CI/CD pipeline (GitHub Actions)
- Environment variables guide
- Database backup strategy

---

## 🎯 סדר עדיפויות מומלץ

### Sprint 1 (2-3 ימים) ✅ הושלם!
1. ✅ תיקון TypeScript linter issues
2. ✅ GroupStandings API (27/12/2025)
3. ✅ Enhanced Matches API (27/12/2025)
4. ✅ Predictions API (27/12/2025)
5. ⏳ Admin Dashboard - Update Result Form

### Sprint 2 (3-4 ימים)
5. ⏳ Group Standings UI
6. ⏳ Predictions API
7. ⏳ Match Predictions Form (UI)
8. ⏳ Scoring System logic

### Sprint 3 (2-3 ימים)
9. ⏳ Leaderboard UI
10. ⏳ Tests (unit + integration)
11. ⏳ Real-time updates (optional)

### Sprint 4 (2 ימים)
12. ⏳ Polish & Bug fixes
13. ⏳ Documentation
14. ⏳ Deployment prep

---

## 🔗 קישורים שימושיים

**Docs:**
- [Match Result Automation](./match-result-automation.md)
- [Prisma Schema](../prisma/schema.prisma)
- [Third Place Assignments](./third_place_assignments.json)

**Excel Reference:**
- [WCup_2026_3.6_en.xlsx](./WCup_2026_3.6_en.xlsx)

**Preview:**
- [UI Preview Image](./WCup_2026_Preview_en.png)

---

**עודכן:** 27/12/2025  
**גרסה:** 1.0  
**סטטוס:** 🚀 Ready for Sprint 1

